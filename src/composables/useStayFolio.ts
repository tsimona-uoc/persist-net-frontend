import { computed, ref } from 'vue'
import { extractCollection, readBoolean, readDateString, readNumber, readObject, readString } from '../lib/backend'
import { useApi } from './useApi'

export interface FolioLine {
  id: number
  facturaId: number
  concepto: string
  monto: number
  fecha: string
}

export interface FolioPayment {
  id: number
  metodoPagoId: number
  metodoNombre: string
  monto: number
  fecha: string
}

export interface ExtraServiceOption {
  id: number
  name: string
  price: number
}

export const LODGING_CONCEPT_PREFIX = 'Alojamiento'
export const VIP_DISCOUNT_CONCEPT = 'Descuento de Fidelidad VIP (10%)'

export function useStayFolio() {
  const { request } = useApi()

  const stayId = ref<number | null>(null)
  const invoiceId = ref<number | null>(null)
  
  const lines = ref<FolioLine[]>([])
  const payments = ref<FolioPayment[]>([])
  
  const extraServices = ref<ExtraServiceOption[]>([])
  const paymentMethods = ref<{ id: number, name: string }[]>([])
  
  const clientVip = ref<boolean>(false)
  const clientName = ref<string>('')

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const totalCargos = computed(() => lines.value.reduce((sum, line) => sum + line.monto, 0))
  const totalPagos = computed(() => payments.value.reduce((sum, payment) => sum + payment.monto, 0))
  const saldoPendiente = computed(() => totalCargos.value - totalPagos.value)
  const isPaid = computed(() => saldoPendiente.value === 0 && totalCargos.value > 0)

  function normalizeConcept(value: string): string {
    return value.trim().toLowerCase()
  }

  function isDiscountLine(line: FolioLine): boolean {
    return normalizeConcept(line.concepto) === normalizeConcept(VIP_DISCOUNT_CONCEPT)
  }

  function isLodgingLine(line: FolioLine): boolean {
    return normalizeConcept(line.concepto).startsWith(normalizeConcept(LODGING_CONCEPT_PREFIX))
  }

  function calculateVipDiscountAmount(): number {
    const baseTotal = lines.value
      .filter((line) => !isDiscountLine(line))
      .reduce((sum, line) => sum + line.monto, 0)

    return Number((baseTotal * 0.1).toFixed(2))
  }

  async function updateFacturaLine(line: FolioLine, monto: number) {
    await request(`/facturalinea/${line.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: line.id,
        facturaId: line.facturaId,
        concepto: line.concepto,
        monto,
        fecha: line.fecha || new Date().toISOString(),
      }),
    })
  }

  async function syncVipDiscountLine() {
    if (!invoiceId.value) {
      return
    }

    const discountLines = lines.value.filter(isDiscountLine)
    if (discountLines.length === 0) {
      return
    }

    const [primaryLine, ...extraLines] = discountLines
    if (extraLines.length > 0) {
      await Promise.all(extraLines.map((line) => request(`/facturalinea/${line.id}`, { method: 'DELETE' })))
      await loadInvoiceDetails(invoiceId.value)
      await syncVipDiscountLine()
      return
    }

    const discountAmount = calculateVipDiscountAmount()
    const desiredAmount = -discountAmount

    if (Math.abs(primaryLine.monto - desiredAmount) < 0.01) {
      return
    }

    await updateFacturaLine(primaryLine, desiredAmount)
    await loadInvoiceDetails(invoiceId.value)
  }

  
  async function loadFolio(targetStayId: number) {
    isLoading.value = true
    error.value = null
    stayId.value = targetStayId

    try {
      const stayPayload = await request<Record<string, unknown>>(`/estancia/${targetStayId}`)
      const reservaId = readNumber(stayPayload, 'reservaId') ?? readNumber(readObject(stayPayload, 'reserva'), 'id')
      
      let idCliente = 0
      let diasEstancia = 1

      if (reservaId) {
        const reservaPayload = await request<Record<string, unknown>>(`/reserva/${reservaId}`)
        idCliente = readNumber(reservaPayload, 'clienteId') ?? readNumber(readObject(reservaPayload, 'cliente'), 'id') ?? 0
        
        const fEntrada = new Date(readString(reservaPayload, 'fechaEntrada') || '')
        const fSalida = new Date(readString(reservaPayload, 'fechaSalida') || '')
        if (!isNaN(fEntrada.getTime()) && !isNaN(fSalida.getTime())) {
           const diff = Math.ceil(Math.abs(fSalida.getTime() - fEntrada.getTime()) / (1000 * 60 * 60 * 24))
           if (diff > 0) diasEstancia = diff
        }

        if (idCliente) {
          const clientePayload = await request<Record<string, unknown>>(`/cliente/${idCliente}`)
          clientName.value = `${readString(clientePayload, 'nombre')} ${readString(clientePayload, 'apellido')}`.trim()
          clientVip.value = readBoolean(clientePayload, 'vip') || false
        }
      }

      if (!clientName.value) clientName.value = 'Huésped desconocido'

      await loadCatalogs()

      const invoicesPayload = await request('/factura')
      const invoice = extractCollection(invoicesPayload).find(f => 
        readNumber(f, 'estanciaId') === targetStayId || 
        readNumber(readObject(f, 'estancia'), 'id') === targetStayId
      )

      if (invoice) {
        invoiceId.value = readNumber(invoice, 'id')
        await loadInvoiceDetails(invoiceId.value!)
        await syncVipDiscountLine()
      } else {
        await createInitialInvoice(targetStayId, idCliente, diasEstancia)
      }

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar el folio.'
    } finally {
      isLoading.value = false
    }
  }

  async function loadInvoiceDetails(idFactura: number) {
    try {
      const linesPayload = await request(`/facturalinea`)
      lines.value = extractCollection(linesPayload)
        .filter(l => readNumber(l, 'facturaId') === idFactura)
        .map(item => ({
          id: readNumber(item, 'id') || 0,
          facturaId: readNumber(item, 'facturaId') || idFactura,
          concepto: readString(item, 'concepto', 'descripcion') || 'Cargo',
          monto: readNumber(item, 'monto', 'precio') || 0,
          fecha: readDateString(item, 'fecha', 'createdAt') || new Date().toISOString()
        }))
    } catch (e) { console.warn("Endpoint de líneas aún no implementado en backend") }

    const paymentsPayload = await request(`/pago`)
    payments.value = extractCollection(paymentsPayload)
      .filter(p => readNumber(p, 'facturaId') === idFactura)
      .map(item => ({
        id: readNumber(item, 'id') || 0,
        metodoPagoId: readNumber(item, 'metodoPagoId') || 0,
        metodoNombre: readString(readObject(item, 'metodoPago'), 'nombre') || 'Pago',
        monto: readNumber(item, 'importe', 'montoSaldo', 'monto') || 0,
        fecha: readDateString(item, 'fechaPago', 'fecha') || new Date().toISOString()
      }))
  }

  async function loadCatalogs() {
    const [servicesPayload, methodsPayload] = await Promise.all([
      request('/servicioextra'),
      request('/metodopago')
    ])

    extraServices.value = extractCollection(servicesPayload).map(s => ({
      id: readNumber(s, 'id') || 0,
      name: readString(s, 'nombre', 'name') || '',
      price: readNumber(s, 'precioBase', 'precio') || 0
    }))

    paymentMethods.value = extractCollection(methodsPayload).map(m => ({
      id: readNumber(m, 'id') || 0,
      name: readString(m, 'nombre', 'name') || ''
    }))
  }

  async function createInitialInvoice(idEstancia: number, idCliente: number, noches: number) {
    const newInvoice = await request<Record<string, unknown>>('/factura', {
      method: 'POST',
      body: JSON.stringify({
        estanciaId: idEstancia,
        clienteId: idCliente > 0 ? idCliente : 1, // Fallback de seguridad
        total: 0,
        pagada: false,
        descuento: 0
      })
    })

    invoiceId.value = readNumber(newInvoice, 'id')

    if (invoiceId.value) {
      await addCharge(`Alojamiento (${noches} noches)`, noches * 80)
    }
  }

  async function addCharge(concepto: string, monto: number) {
    if (!invoiceId.value) return
    await request('/facturalinea', { 
      method: 'POST',
      body: JSON.stringify({ facturaId: invoiceId.value, concepto, monto, fecha: new Date().toISOString() })
    })
    await loadInvoiceDetails(invoiceId.value)
    await syncVipDiscountLine()
  }

  async function removeCharge(line: FolioLine) {
    if (!invoiceId.value || isLodgingLine(line)) return

    await request(`/facturalinea/${line.id}`, { method: 'DELETE' })
    await loadInvoiceDetails(invoiceId.value)
    await syncVipDiscountLine()
  }

  async function applyVipDiscount() {
    if (!clientVip.value || !invoiceId.value) return

    const discountLine = lines.value.find(isDiscountLine)
    if (discountLine) {
      await syncVipDiscountLine()
      return
    }

    const discountAmount = calculateVipDiscountAmount()
    if (discountAmount <= 0) {
      return
    }

    await addCharge(VIP_DISCOUNT_CONCEPT, -discountAmount)
  }

  async function addPayment(metodoPagoId: number, monto: number) {
    if (!invoiceId.value) return
    await request('/pago', {
      method: 'POST',
      body: JSON.stringify({ facturaId: invoiceId.value, metodoPagoId, importe: monto, fechaPago: new Date().toISOString() })
    })
    await loadInvoiceDetails(invoiceId.value)
  }

  return {
    stayId,
    clientName,
    clientVip,
    lines,
    payments,
    totalCargos,
    totalPagos,
    saldoPendiente,
    isPaid,
    extraServices,
    paymentMethods,
    loadFolio,
    addCharge,
    removeCharge,
    addPayment,
    applyVipDiscount
  }
}