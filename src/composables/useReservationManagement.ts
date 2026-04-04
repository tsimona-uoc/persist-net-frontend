import { computed, ref } from 'vue'

import { extractCollection, readNumber, readString } from '../lib/backend'
import { useApi } from './useApi'
import { useHotelData, type HotelReservation } from './useHotelData'

export interface ReservationOption {
  label: string
  value: number
  helper?: string
}

export interface ReservationFormValues {
  id?: number
  clienteId: number | null
  habitacionId: number | null
  fechaEntrada: string
  fechaSalida: string
  estadoReservaId: number | null
  regimenId: number | null
}

export interface ReservationStateOption extends ReservationOption {
  active: boolean
}

function toDateInputValue(value: string): string {
  return value ? value.slice(0, 10) : ''
}

export function createEmptyReservationForm(): ReservationFormValues {
  return {
    clienteId: null,
    habitacionId: null,
    fechaEntrada: '',
    fechaSalida: '',
    estadoReservaId: null,
    regimenId: null,
  }
}

export function buildReservationForm(reservation: HotelReservation): ReservationFormValues {
  return {
    id: reservation.id,
    clienteId: reservation.clientId,
    habitacionId: reservation.roomId,
    fechaEntrada: toDateInputValue(reservation.checkIn),
    fechaSalida: toDateInputValue(reservation.checkOut),
    estadoReservaId: reservation.statusId,
    regimenId: reservation.regimenId,
  }
}

export function useReservationManagement() {
  const { request } = useApi()
  const hotelData = useHotelData()

  const reservationStates = ref<ReservationStateOption[]>([])
  const regimens = ref<ReservationOption[]>([])
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)

  async function refresh() {
    saveError.value = null

    await Promise.all([
      hotelData.refresh(),
      loadReservationCatalogs(),
    ])
  }

  async function loadReservationCatalogs() {
    const [reservationStatesPayload, regimensPayload] = await Promise.all([
      request('/estadoreserva'),
      request('/regimen'),
    ])

    reservationStates.value = extractCollection(reservationStatesPayload).map((item) => ({
      value: readNumber(item, 'id') ?? 0,
      label: readString(item, 'nombre', 'name') || 'Estado sin nombre',
      helper: readString(item, 'descripcion', 'description') || undefined,
      active: Boolean(item && typeof item === 'object' && 'activo' in item ? item.activo : true),
    }))

    regimens.value = extractCollection(regimensPayload).map((item) => ({
      value: readNumber(item, 'id') ?? 0,
      label: readString(item, 'nombre', 'name') || 'Regimen sin nombre',
      helper: readString(item, 'descripcion', 'description') || undefined,
    }))
  }

  async function createReservation(formValues: ReservationFormValues) {
    isSaving.value = true
    saveError.value = null

    try {
      await request('/reserva', {
        method: 'POST',
        body: JSON.stringify({
          clienteId: formValues.clienteId,
          habitacionId: formValues.habitacionId,
          fechaEntrada: formValues.fechaEntrada,
          fechaSalida: formValues.fechaSalida,
          estadoReservaId: formValues.estadoReservaId,
        }),
      })

      await hotelData.refresh()
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'No se pudo crear la reserva.'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateReservation(formValues: ReservationFormValues) {
    if (!formValues.id) {
      throw new Error('La reserva necesita identificador para actualizarse.')
    }

    isSaving.value = true
    saveError.value = null

    try {
      await request(`/reserva/${formValues.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          id: formValues.id,
          clienteId: formValues.clienteId,
          habitacionId: formValues.habitacionId,
          fechaEntrada: formValues.fechaEntrada,
          fechaSalida: formValues.fechaSalida,
          regimenId: formValues.regimenId,
          estadoReservaId: formValues.estadoReservaId,
        }),
      })

      await hotelData.refresh()
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'No se pudo actualizar la reserva.'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function deleteReservation(reservationId: number) {
    isSaving.value = true
    saveError.value = null

    try {
      await request(`/reserva/${reservationId}`, {
        method: 'DELETE',
      })

      await hotelData.refresh()
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'No se pudo eliminar la reserva.'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  const clientOptions = computed<ReservationOption[]>(() => {
    return hotelData.clients.value.map((client) => ({
      value: client.id,
      label: client.name,
      helper: client.dni,
    }))
  })

  const roomOptions = computed<ReservationOption[]>(() => {
    return hotelData.rooms.value.map((room) => ({
      value: room.id,
      label: `Hab. ${room.number}`,
      helper: `${room.typeName} · ${room.statusName}`,
    }))
  })

  return {
    ...hotelData,
    reservationStates,
    regimens,
    clientOptions,
    roomOptions,
    isSaving,
    saveError,
    refresh,
    createReservation,
    updateReservation,
    deleteReservation,
  }
}