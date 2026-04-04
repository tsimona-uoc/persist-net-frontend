import { computed, ref } from 'vue'

import {
  formatFullDate,
  formatShortDate,
  normalizeStatusTone,
  parseDate,
  readDateString,
  readNumber,
  readObject,
  readString,
  toDateKey,
} from '../lib/backend'
import { useApi } from './useApi'
import { useHotelData } from './useHotelData'

export interface StayOption {
  label: string
  value: number
  helper?: string
}

export interface StayStateOption extends StayOption {
  active: boolean
}

export interface StayFormValues {
  id?: number
  reservaId: number | null
  fechaCheckIn: string
  fechaCheckOut: string | null
  estadoEstanciaId: number | null
}

export interface HotelStay {
  id: number
  hotelId: number | null
  reservationId: number | null
  roomId: number | null
  clientId: number | null
  statusId: number | null
  guestName: string
  roomNumber: number
  roomType: string
  statusName: string
  statusTone: string
  checkIn: string
  checkOut: string | null
  stayPeriodLabel: string
  reservationLabel: string
}

function getNestedId(record: Record<string, unknown> | null, key: string): number | null {
  return readNumber(readObject(record, key), 'id')
}

function mapReferenceNames(payload: unknown): Map<number, string> {
  const map = new Map<number, string>()

  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as { data?: unknown[] }).data)
      ? (payload as { data: unknown[] }).data
      : []

  for (const item of items) {
    const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : null
    const id = readNumber(record, 'id')

    if (id !== null) {
      map.set(id, readString(record, 'nombre', 'name') || `#${id}`)
    }
  }

  return map
}

export function createEmptyStayForm(): StayFormValues {
  return {
    reservaId: null,
    fechaCheckIn: '',
    fechaCheckOut: null,
    estadoEstanciaId: null,
  }
}

export function buildStayForm(stay: HotelStay): StayFormValues {
  return {
    id: stay.id,
    reservaId: stay.reservationId,
    fechaCheckIn: stay.checkIn,
    fechaCheckOut: stay.checkOut,
    estadoEstanciaId: stay.statusId,
  }
}

export function useStayManagement() {
  const { request } = useApi()
  const hotelData = useHotelData()

  const stays = ref<HotelStay[]>([])
  const stayStates = ref<StayStateOption[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const saveError = ref<string | null>(null)

  async function refresh() {
    isLoading.value = true
    error.value = null
    saveError.value = null

    try {
      const [staysPayload, stayStatesPayload] = await Promise.all([request('/estancia'), request('/estadoestancia'), hotelData.refresh()])

      const stayStateNames = mapReferenceNames(stayStatesPayload)
      const reservationsById = new Map(hotelData.reservations.value.map((reservation) => [reservation.id, reservation]))

      stayStates.value = Array.from(stayStateNames.entries()).map(([value, label]) => ({
        value,
        label,
        active: true,
      }))

      const rawStays = Array.isArray(staysPayload)
        ? staysPayload
        : staysPayload && typeof staysPayload === 'object' && 'data' in staysPayload && Array.isArray((staysPayload as { data?: unknown[] }).data)
          ? (staysPayload as { data: unknown[] }).data
          : []

      stays.value = rawStays
        .map((item) => {
          const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : null
          const id = readNumber(record, 'id') ?? 0
          const reservationId = readNumber(record, 'reservaId') ?? getNestedId(record, 'reserva')
          const reservation = reservationId !== null ? reservationsById.get(reservationId) ?? null : null
          const statusId = readNumber(record, 'estadoEstanciaId') ?? getNestedId(record, 'estadoEstancia')
          const statusName =
            ((statusId !== null ? stayStateNames.get(statusId) : null) ??
              readString(readObject(record, 'estadoEstancia'), 'nombre', 'name')) ||
            'Sin estado'
          const checkIn = readDateString(record, 'fechaCheckIn', 'fechaEntrada')
          const checkOut = readDateString(record, 'fechaCheckOut', 'fechaSalida') || null

          return {
            id,
            hotelId: reservation?.hotelId ?? getNestedId(record, 'hotel'),
            reservationId,
            roomId: reservation?.roomId ?? null,
            clientId: reservation?.clientId ?? null,
            statusId,
            guestName: reservation?.guestName || `Reserva ${reservationId ?? 'sin id'}`,
            roomNumber: reservation?.roomNumber ?? 0,
            roomType: reservation?.roomType || 'Sin tipo',
            statusName,
            statusTone: normalizeStatusTone(statusName),
            checkIn,
            checkOut,
            stayPeriodLabel: checkIn ? `${formatShortDate(checkIn)}${checkOut ? ` - ${formatShortDate(checkOut)}` : ' - En curso'}` : 'Check-in pendiente',
            reservationLabel: reservationId !== null ? `Reserva #${reservationId}` : 'Sin reserva',
          }
        })
        .filter((stay) => stay.hotelId === null || hotelData.rooms.value.some((room) => room.hotelId === stay.hotelId))
    } catch (requestError) {
      error.value = requestError instanceof Error ? requestError.message : 'No se pudieron cargar las estancias.'
    } finally {
      isLoading.value = false
    }
  }

  async function createStay(formValues: StayFormValues) {
    isSaving.value = true
    saveError.value = null

    try {
      await request('/estancia', {
        method: 'POST',
        body: JSON.stringify({
          reservaId: formValues.reservaId,
          fechaCheckIn: formValues.fechaCheckIn,
          ...(formValues.fechaCheckOut ? { fechaCheckOut: formValues.fechaCheckOut } : {}),
          estadoEstanciaId: formValues.estadoEstanciaId,
        }),
      })

      await refresh()
    } catch (requestError) {
      saveError.value = requestError instanceof Error ? requestError.message : 'No se pudo crear la estancia.'
      throw requestError
    } finally {
      isSaving.value = false
    }
  }

  async function updateStay(formValues: StayFormValues) {
    if (!formValues.id) {
      throw new Error('La estancia necesita identificador para actualizarse.')
    }

    isSaving.value = true
    saveError.value = null

    try {
      await request(`/estancia/${formValues.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          reservaId: formValues.reservaId,
          fechaCheckIn: formValues.fechaCheckIn,
          ...(formValues.fechaCheckOut ? { fechaCheckOut: formValues.fechaCheckOut } : {}),
          estadoEstanciaId: formValues.estadoEstanciaId,
        }),
      })

      await refresh()
    } catch (requestError) {
      saveError.value = requestError instanceof Error ? requestError.message : 'No se pudo actualizar la estancia.'
      throw requestError
    } finally {
      isSaving.value = false
    }
  }

  async function deleteStay(stayId: number) {
    isSaving.value = true
    saveError.value = null

    try {
      await request(`/estancia/${stayId}`, { method: 'DELETE' })
      await refresh()
    } catch (requestError) {
      saveError.value = requestError instanceof Error ? requestError.message : 'No se pudo eliminar la estancia.'
      throw requestError
    } finally {
      isSaving.value = false
    }
  }

  const reservationOptions = computed<StayOption[]>(() => {
    return hotelData.reservations.value.map((reservation) => ({
      value: reservation.id,
      label: `Reserva #${reservation.id}`,
      helper: `${reservation.guestName} · ${reservation.roomNumber}`,
    }))
  })

  const today = computed(() => {
    const nextDate = new Date()
    nextDate.setHours(0, 0, 0, 0)
    return nextDate
  })
  const todayKey = computed(() => toDateKey(today.value))
  const todayLabel = computed(() => formatFullDate(today.value))

  const checkInsToday = computed(() => stays.value.filter((stay) => stay.checkIn === todayKey.value))
  const checkOutsToday = computed(() => stays.value.filter((stay) => stay.checkOut === todayKey.value))
  const activeStays = computed(() => {
    return stays.value.filter((stay) => {
      if (!stay.checkIn) {
        return false
      }

      const currentDay = parseDate(todayKey.value)
      const checkIn = parseDate(stay.checkIn)
      const checkOut = stay.checkOut ? parseDate(stay.checkOut) : null

      if (!currentDay || !checkIn) {
        return false
      }

      if (!checkOut) {
        return currentDay >= checkIn
      }

      return currentDay >= checkIn && currentDay < checkOut
    })
  })

  const occupiedRoomsCount = computed(() => new Set(activeStays.value.map((stay) => stay.roomId).filter((roomId) => roomId !== null)).size)

  return {
    ...hotelData,
    stays,
    stayStates,
    reservationOptions,
    isLoading,
    isSaving,
    error,
    saveError,
    todayLabel,
    checkInsToday,
    checkOutsToday,
    activeStays,
    occupiedRoomsCount,
    refresh,
    createStay,
    updateStay,
    deleteStay,
  }
}