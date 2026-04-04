import { ref } from 'vue'

import {
  extractCollection,
  formatCurrency,
  formatShortDate,
  joinName,
  readDateString,
  readNumber,
  readObject,
  readString,
} from '../lib/backend'
import { useApi } from './useApi'

export interface BillingInvoice {
  id: number
  clientName: string
  roomNumber: string
  stayId: number | null
  reservationId: number | null
  totalAmount: number
  totalLabel: string
}

export interface BillingPayment {
  id: number
  invoiceId: number | null
  amount: number
  amountLabel: string
  methodName: string
  paymentDate: string
}

export interface BillingPaymentMethod {
  id: number
  name: string
  description: string
}

function createClientNameMap(payload: unknown): Map<number, string> {
  const map = new Map<number, string>()

  for (const item of extractCollection(payload)) {
    const id = readNumber(item, 'id')

    if (id !== null) {
      map.set(id, joinName(readString(item, 'nombre', 'name'), readString(item, 'apellido', 'surname')) || `Cliente ${id}`)
    }
  }

  return map
}

function createReservationRoomMap(reservationsPayload: unknown, roomsPayload: unknown): Map<number, string> {
  const roomNumbers = new Map<number, string>()

  for (const room of extractCollection(roomsPayload)) {
    const roomId = readNumber(room, 'id')

    if (roomId !== null) {
      roomNumbers.set(roomId, readString(room, 'numero', 'number') || 'Sin numero')
    }
  }

  const reservationRooms = new Map<number, string>()

  for (const reservation of extractCollection(reservationsPayload)) {
    const reservationId = readNumber(reservation, 'id')
    const roomId = readNumber(reservation, 'habitacionId') ?? readNumber(readObject(reservation, 'habitacion'), 'id')

    if (reservationId !== null) {
      reservationRooms.set(reservationId, roomId !== null ? roomNumbers.get(roomId) ?? 'Sin numero' : 'Sin numero')
    }
  }

  return reservationRooms
}

function createStayReservationMap(payload: unknown): Map<number, number | null> {
  const map = new Map<number, number | null>()

  for (const item of extractCollection(payload)) {
    const stayId = readNumber(item, 'id')

    if (stayId !== null) {
      map.set(stayId, readNumber(item, 'reservaId') ?? readNumber(readObject(item, 'reserva'), 'id'))
    }
  }

  return map
}

function createPaymentMethodMap(payload: unknown): Map<number, BillingPaymentMethod> {
  const map = new Map<number, BillingPaymentMethod>()

  for (const item of extractCollection(payload)) {
    const id = readNumber(item, 'id')

    if (id !== null) {
      map.set(id, {
        id,
        name: readString(item, 'nombre', 'name') || `Metodo ${id}`,
        description: readString(item, 'descripcion', 'description') || 'Sin descripcion',
      })
    }
  }

  return map
}

export function useBillingData() {
  const { request } = useApi()

  const invoices = ref<BillingInvoice[]>([])
  const payments = ref<BillingPayment[]>([])
  const paymentMethods = ref<BillingPaymentMethod[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    isLoading.value = true
    error.value = null

    try {
      const [invoicesPayload, clientsPayload, staysPayload, reservationsPayload, roomsPayload, paymentsPayload, paymentMethodsPayload] = await Promise.all([
        request('/factura'),
        request('/cliente'),
        request('/estancia'),
        request('/reserva'),
        request('/habitacion'),
        request('/pago'),
        request('/metodopago'),
      ])

      const clientNames = createClientNameMap(clientsPayload)
      const stayReservationMap = createStayReservationMap(staysPayload)
      const reservationRoomMap = createReservationRoomMap(reservationsPayload, roomsPayload)
      const paymentMethodMap = createPaymentMethodMap(paymentMethodsPayload)

      invoices.value = extractCollection(invoicesPayload).map((item) => {
        const invoiceId = readNumber(item, 'id') ?? 0
        const clientId = readNumber(item, 'clienteId') ?? readNumber(readObject(item, 'cliente'), 'id')
        const stayId = readNumber(item, 'estanciaId') ?? readNumber(readObject(item, 'estancia'), 'id')
        const reservationId = stayId !== null ? stayReservationMap.get(stayId) ?? null : null
        const totalAmount = readNumber(item, 'montoTotal', 'total', 'importeTotal') ?? 0

        return {
          id: invoiceId,
          clientName: clientId !== null ? clientNames.get(clientId) ?? `Cliente ${clientId}` : 'Cliente sin asignar',
          roomNumber: reservationId !== null ? reservationRoomMap.get(reservationId) ?? 'Sin habitacion' : 'Sin habitacion',
          stayId,
          reservationId,
          totalAmount,
          totalLabel: formatCurrency(totalAmount),
        }
      })

      payments.value = extractCollection(paymentsPayload).map((item) => {
        const paymentId = readNumber(item, 'id') ?? 0
        const invoiceId = readNumber(item, 'facturaId') ?? readNumber(readObject(item, 'factura'), 'id')
        const paymentMethodId = readNumber(item, 'metodoPagoId') ?? readNumber(readObject(item, 'metodoPago'), 'id')
        const amount = readNumber(item, 'montoSaldo', 'monto', 'importe') ?? 0

        return {
          id: paymentId,
          invoiceId,
          amount,
          amountLabel: formatCurrency(amount),
          methodName: paymentMethodId !== null ? paymentMethodMap.get(paymentMethodId)?.name ?? `Metodo ${paymentMethodId}` : 'Metodo sin asignar',
          paymentDate: formatShortDate(readDateString(item, 'fechaPago', 'fecha', 'createdAt')),
        }
      })

      paymentMethods.value = [...paymentMethodMap.values()]
    } catch (requestError) {
      error.value = requestError instanceof Error ? requestError.message : 'No se pudieron cargar las facturas.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    invoices,
    payments,
    paymentMethods,
    isLoading,
    error,
    refresh,
  }
}