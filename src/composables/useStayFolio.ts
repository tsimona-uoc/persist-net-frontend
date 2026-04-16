import { computed, ref } from 'vue'
import { extractCollection, readBoolean, readDateString, readNumber, readObject, readString } from '../lib/backend'
import { useApi } from './useApi'

// Interfaces adaptadas a la vista del Folio
export interface FolioLine {
  id: number
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

export function useStayFolio() {
  const { request } = useApi()

  // Estado
  const stayId = ref<number | null>(null)
  const invoiceId = ref<number | null>(null)
  
  const lines = ref<FolioLine[]>([])
  const payments = ref<FolioPayment[]>([])
  
  // Catálogos para los modales de añadir cargo/pago
  const extraServices = ref<ExtraServiceOption[]>([])
  const paymentMethods = ref<{ id: number, name: string }[]>([])
  
  // Datos del cliente para la cabecera
  const clientVip = ref<boolean>(false)
  const clientName = ref<string>('')

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Totales Calculados (La Magia de Vue)
  const totalCargos = computed(() => lines.value.reduce((sum, line) => sum + line.monto, 0))
  const totalPagos = computed(() => payments.value.reduce((sum, payment) => sum + payment.monto, 0))
  const saldoPendiente = computed(() => totalCargos.value - totalPagos.value)
  const isPaid = computed(() => saldoPendiente.value === 0 && totalCargos.value > 0)

  /**
   * Carga todo el contexto de una estancia específica
   */
  async function loadFolio(targetStayId: number) {
    isLoading.value = true
    error.value = null
    stayId.value = targetStayId

    try {
      // 1. Obtener datos de la Estancia (para sacar Reserva -> Cliente)
      const stayPayload = await request<Record<string, unknown>>(`/estancia/${targetStayId}`)
      const reserva = readObject(stayPayload, 'reserva')
      const cliente = readObject(reserva, 'cliente')
      
      clientName.value = `${readString(cliente, 'nombre')} ${readString(cliente, 'apellido')}`.trim()
      clientVip.value = readBoolean(cliente, 'vip') || false

      // 2. Buscar la factura de esta estancia (Asumimos 1 Estancia = 1 Factura)
      const invoicesPayload = await request('/factura')
      const invoice = extractCollection(invoicesPayload).find(f => 
        readNumber(f, 'estanciaId') === targetStayId || 
        readNumber(readObject(f, 'estancia'), 'id') === targetStayId
      )

      if (invoice) {
        invoiceId.value = readNumber(invoice, 'id')
        await loadInvoiceDetails(invoiceId.value!)
      } else {
        // Si no hay factura, la creamos automáticamente (Ideal para el KISS)
        await createInitialInvoice(targetStayId, readNumber(cliente, 'id')!)
      }

      // 3. Cargar catálogos para los dropdowns
      await loadCatalogs()

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar el folio.'
    } finally {
      isLoading.value = false
    }
  }

  async function loadInvoiceDetails(idFactura: number) {
    // NOTA: Reemplaza '/facturalinea' por el endpoint real que crees en tu backend
    // Si aún no lo tienes, el array `lines` quedará vacío por ahora, no dará error.
    try {
      const linesPayload = await request(`/facturalinea`)
      lines.value = extractCollection(linesPayload)
        .filter(l => readNumber(l, 'facturaId') === idFactura)
        .map(item => ({
          id: readNumber(item, 'id') || 0,
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
        monto: readNumber(item, 'montoSaldo', 'monto') || 0,
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

  async function createInitialInvoice(idEstancia: number, idCliente: number) {
    // Si la estancia no tenía factura, creamos el "Borrador"
    await request('/factura', {
      method: 'POST',
      body: JSON.stringify({
        estanciaId: idEstancia,
        clienteId: idCliente,
        montoTotal: 0
      })
    })
    // Recargamos para obtener el ID asignado
    await loadFolio(idEstancia)
  }

  async function addCharge(concepto: string, monto: number) {
    if (!invoiceId.value) return
    await request('/facturalinea', { // Endpoint a implementar en C#
      method: 'POST',
      body: JSON.stringify({ facturaId: invoiceId.value, concepto, monto, fecha: new Date().toISOString() })
    })
    await loadInvoiceDetails(invoiceId.value)
  }

  async function addPayment(metodoPagoId: number, monto: number) {
    if (!invoiceId.value) return
    await request('/pago', {
      method: 'POST',
      body: JSON.stringify({ facturaId: invoiceId.value, metodoPagoId, montoSaldo: monto, fechaPago: new Date().toISOString() })
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
    addPayment
  }
}