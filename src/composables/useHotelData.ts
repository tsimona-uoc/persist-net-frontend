import { computed, ref, watch } from 'vue'

import {
  extractCity,
  extractCollection,
  formatCurrency,
  formatFullDate,
  formatShortDate,
  joinName,
  normalizeStatusTone,
  parseDate,
  readDateString,
  readNumber,
  readObject,
  readString,
  toDateKey,
  type UnknownRecord,
} from '../lib/backend'
import { useApi } from './useApi'
import { useHotelContext } from './useHotelContext'

export interface HotelClient {
  id: number
  name: string
  email: string
  phone: string
  dni: string
  address: string
  city: string
}

export interface HotelRoom {
  id: number
  hotelId: number | null
  number: number
  floorNumber: number | null
  floor: string
  floorLabel: string
  typeId: number | null
  typeName: string
  statusId: number | null
  statusName: string
  statusTone: string
}

export interface HotelReservation {
  id: number
  hotelId: number | null
  clientId: number | null
  roomId: number | null
  statusId: number | null
  regimenId: number | null
  guestName: string
  roomNumber: number
  roomType: string
  statusName: string
  statusTone: string
  checkIn: string
  checkOut: string
  reservationPeriodLabel: string
  totalLabel: string
}

function mapClients(payload: unknown): HotelClient[] {
  return extractCollection(payload).map((item) => {
    const firstName = readString(item, 'nombre', 'name')
    const lastName = readString(item, 'apellido', 'surname')
    const address = readString(item, 'direccion', 'address')

    return {
      id: readNumber(item, 'id') ?? 0,
      name: joinName(firstName, lastName) || `Cliente ${readNumber(item, 'id') ?? ''}`.trim(),
      email: readString(item, 'email') || 'Sin email',
      phone: readString(item, 'telefono', 'phone') || 'Sin telefono',
      dni: readString(item, 'documentacion', 'dni') || 'Sin documento',
      address,
      city: extractCity(address),
    }
  })
}

function mapReferenceNames(payload: unknown): Map<number, string> {
  const map = new Map<number, string>()

  for (const item of extractCollection(payload)) {
    const id = readNumber(item, 'id')

    if (id !== null) {
      map.set(id, readString(item, 'nombre', 'name') || `#${id}`)
    }
  }

  return map
}

function mapRooms(
  payload: unknown,
  roomTypeNames: Map<number, string>,
  roomStateNames: Map<number, string>,
): HotelRoom[] {
  return extractCollection(payload).map((item:any) => {
    const typeId = readNumber(item.tipoHabitacion, 'id')
    const stateId = readNumber(item.estadoHabitacion, 'id')
    const floor = readString(item, 'planta') || `${readNumber(item, 'piso', 'planta') ?? ''}`.trim()
    const statusName = stateId !== null ? roomStateNames.get(stateId) ?? 'Sin estado' : 'Sin estado'

    return {
      id: readNumber(item, 'id') ?? 0,
      hotelId: readNumber(item, 'hotelId') ?? getNestedId(item, 'hotel'),
      number: readNumber(item, 'numero', 'number') || 0,
      floorNumber: readNumber(item, 'piso', 'planta'),
      floor,
      floorLabel: floor || 'Sin planta',
      typeId,
      typeName: typeId !== null ? roomTypeNames.get(typeId) ?? 'Tipo sin definir' : 'Tipo sin definir',
      statusId: stateId,
      statusName,
      statusTone: normalizeStatusTone(statusName),
    }
  })
}

function getNestedId(record: UnknownRecord | null, key: string): number | null {
  return readNumber(readObject(record, key), 'id')
}

function mapReservations(
  payload: unknown,
  clients: HotelClient[],
  rooms: HotelRoom[],
  reservationStateNames: Map<number, string>,
): HotelReservation[] {
  const clientsById = new Map(clients.map((client) => [client.id, client]))
  const roomsById = new Map(rooms.map((room) => [room.id, room]))

  return extractCollection(payload).map((item) => {
    const nestedClient = readObject(item, 'cliente')
    const nestedRoom = readObject(item, 'habitacion')
    const clientId = readNumber(item, 'clienteId') ?? getNestedId(item, 'cliente')
    const roomId = readNumber(item, 'habitacionId') ?? getNestedId(item, 'habitacion')
    const client = clientId !== null ? clientsById.get(clientId) : null
    const room = roomId !== null ? roomsById.get(roomId) : null
    const checkIn = readDateString(item, 'fechaEntrada', 'fechaCheckIn')
    const checkOut = readDateString(item, 'fechaSalida', 'fechaCheckOut')
    const stateId = readNumber(item, 'estadoReservaId') ?? getNestedId(item, 'estadoReserva')
    const regimenId = readNumber(item, 'regimenId') ?? getNestedId(item, 'regimen')
    const statusName =
      ((stateId !== null ? reservationStateNames.get(stateId) : null) ??
        readString(readObject(item, 'estadoReserva'), 'nombre', 'name')) ||
      'Sin estado'
    const fallbackGuestName = joinName(readString(nestedClient, 'nombre', 'name'), readString(nestedClient, 'apellido', 'surname'))
    const totalAmount = readNumber(item, 'montoTotal', 'precioTotal', 'total')

    return {
      id: readNumber(item, 'id') ?? 0,
      hotelId: readNumber(item, 'hotelId') ?? room?.hotelId ?? getNestedId(item, 'hotel') ?? getNestedId(nestedRoom, 'hotel'),
      clientId,
      roomId,
      statusId: stateId,
      regimenId,
      guestName: client?.name || fallbackGuestName || `Cliente ${clientId ?? 'sin id'}`,
      roomNumber: room?.number || readNumber(nestedRoom, 'numero', 'number') || 0,
      roomType: room?.typeName || 'Sin tipo',
      statusName,
      statusTone: normalizeStatusTone(statusName),
      checkIn,
      checkOut,
      reservationPeriodLabel: checkIn && checkOut ? `${formatShortDate(checkIn)} - ${formatShortDate(checkOut)}` : 'Fechas pendientes',
      totalLabel: totalAmount !== null ? formatCurrency(totalAmount) : 'Sin tarifa',
    }
  })
}

function isReservationActiveOnDay(reservation: HotelReservation, dayKey: string): boolean {
  if (!reservation.checkIn || !reservation.checkOut) {
    return false
  }

  const currentDay = parseDate(dayKey)
  const checkIn = parseDate(reservation.checkIn)
  const checkOut = parseDate(reservation.checkOut)

  if (!currentDay || !checkIn || !checkOut) {
    return false
  }

  return currentDay >= checkIn && currentDay < checkOut
}

export function useHotelData() {
  const { request } = useApi()
  const { selectedHotelId } = useHotelContext()

  const clients = ref<HotelClient[]>([])
  const rooms = ref<HotelRoom[]>([])
  const reservations = ref<HotelReservation[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    isLoading.value = true
    error.value = null

    try {
      const [clientsPayload, roomsPayload, roomTypesPayload, roomStatesPayload, reservationsPayload, reservationStatesPayload] = await Promise.all([
        request('/cliente'),
        request('/habitacion'),
        request('/tipohabitacion'),
        request('/estadohabitacion'),
        request('/reserva'),
        request('/estadoreserva'),
      ])

      const nextClients = mapClients(clientsPayload)
      const roomTypeNames = mapReferenceNames(roomTypesPayload)
      const roomStateNames = mapReferenceNames(roomStatesPayload)
      const reservationStateNames = mapReferenceNames(reservationStatesPayload)
      const nextRooms = mapRooms(roomsPayload, roomTypeNames, roomStateNames)

      const nextReservations = mapReservations(reservationsPayload, nextClients, nextRooms, reservationStateNames)
      const hasRoomHotelScope = nextRooms.some((room) => room.hotelId !== null)
      const hasReservationHotelScope = nextReservations.some((reservation) => reservation.hotelId !== null)

      clients.value = nextClients
      rooms.value = selectedHotelId.value !== null && hasRoomHotelScope ? nextRooms.filter((room) => room.hotelId === selectedHotelId.value) : nextRooms
      reservations.value =
        selectedHotelId.value !== null && hasReservationHotelScope
          ? nextReservations.filter((reservation) => reservation.hotelId === selectedHotelId.value)
          : nextReservations
    } catch (requestError) {
      error.value = requestError instanceof Error ? requestError.message : 'No se pudieron cargar los datos del hotel.'
    } finally {
      isLoading.value = false
    }
  }

  const today = computed(() => new Date())
  const todayLabel = computed(() => formatFullDate(today.value))
  const todayKey = computed(() => toDateKey(today.value))

  const arrivalsToday = computed(() => {
    return reservations.value.filter((reservation) => reservation.checkIn === todayKey.value)
  })

  const departuresToday = computed(() => {
    return reservations.value.filter((reservation) => reservation.checkOut === todayKey.value)
  })

  const noShowsToday = computed(() => {
    return reservations.value.filter((reservation) => reservation.statusName.toLowerCase().includes('no-show'))
  })

  const occupiedRoomsCount = computed(() => {
    const activeRoomIds = new Set(
      reservations.value
        .filter((reservation) => reservation.roomId !== null && isReservationActiveOnDay(reservation, todayKey.value))
        .map((reservation) => reservation.roomId),
    )

    if (activeRoomIds.size > 0) {
      return activeRoomIds.size
    }

    return rooms.value.filter((room) => room.statusName.toLowerCase().includes('ocup')).length
  })

  watch(selectedHotelId, (nextHotelId, previousHotelId) => {
    if (nextHotelId !== previousHotelId) {
      refresh()
    }
  })

  return {
    clients,
    rooms,
    reservations,
    isLoading,
    error,
    todayLabel,
    arrivalsToday,
    departuresToday,
    noShowsToday,
    occupiedRoomsCount,
    refresh,
  }
}