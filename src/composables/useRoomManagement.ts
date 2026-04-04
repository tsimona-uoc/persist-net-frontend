import { computed, ref } from 'vue'

import { extractCollection, readBoolean, readNumber, readString } from '../lib/backend'
import { useApi } from './useApi'
import { useHotelData, type HotelRoom } from './useHotelData'
import { useHotelContext } from './useHotelContext'

export interface RoomCatalogOption {
  label: string
  value: number
  helper?: string
  active: boolean
}

export interface RoomFormValues {
  id?: number
  numero: string
  piso: string
  planta: string
  tipoHabitacionId: number | null
  estadoHabitacionId: number | null
}

export function createEmptyRoomForm(): RoomFormValues {
  return {
    numero: '',
    piso: '',
    planta: '',
    tipoHabitacionId: null,
    estadoHabitacionId: null,
  }
}

export function buildRoomForm(room: HotelRoom): RoomFormValues {
  return {
    id: room.id,
    numero: room.number,
    piso: room.floorNumber !== null ? String(room.floorNumber) : '',
    planta: room.floor,
    tipoHabitacionId: room.typeId,
    estadoHabitacionId: room.statusId,
  }
}

function buildRoomPayload(formValues: RoomFormValues, hotelId: number) {
  const floorNumber = Number(formValues.piso.trim())
  const normalizedFloorNumber = Number.isFinite(floorNumber) ? floorNumber : 0
  const floorLabel = formValues.planta.trim()
  const normalizedFloorLabel = floorLabel || String(normalizedFloorNumber)
  const payload: Record<string, unknown> = {
    numero: formValues.numero.trim(),
    piso: normalizedFloorNumber,
    hotelId,
    tipoHabitacionId: formValues.tipoHabitacionId,
    estadoHabitacionId: formValues.estadoHabitacionId,
    planta: normalizedFloorLabel,
  }

  if (formValues.id) {
    payload.id = formValues.id
  }

  return payload
}

export function useRoomManagement() {
  const { request } = useApi()
  const hotelData = useHotelData()
  const { selectedHotelId } = useHotelContext()

  const roomTypes = ref<RoomCatalogOption[]>([])
  const roomStates = ref<RoomCatalogOption[]>([])
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)

  async function refresh() {
    saveError.value = null

    await Promise.all([hotelData.refresh(), loadCatalogs()])
  }

  async function loadCatalogs() {
    const [roomTypesPayload, roomStatesPayload] = await Promise.all([request('/tipohabitacion'), request('/estadohabitacion')])

    roomTypes.value = extractCollection(roomTypesPayload).map((item) => {
      const capacity = readNumber(item, 'capacidad')

      return {
        value: readNumber(item, 'id') ?? 0,
        label: readString(item, 'nombre', 'name') || 'Tipo sin nombre',
        helper: capacity !== null ? `Capacidad ${capacity} pax` : undefined,
        active: readBoolean(item, 'activo', 'active') || !('activo' in item),
      }
    })

    roomStates.value = extractCollection(roomStatesPayload).map((item) => ({
      value: readNumber(item, 'id') ?? 0,
      label: readString(item, 'nombre', 'name') || 'Estado sin nombre',
      helper: readString(item, 'descripcion', 'description') || undefined,
      active: readBoolean(item, 'activo', 'active') || !('activo' in item),
    }))
  }

  async function createRoom(formValues: RoomFormValues) {
    if (selectedHotelId.value === null) {
      const nextError = 'Selecciona un hotel antes de crear habitaciones.'
      saveError.value = nextError
      throw new Error(nextError)
    }

    isSaving.value = true
    saveError.value = null

    try {
      await request('/habitacion', {
        method: 'POST',
        body: JSON.stringify(buildRoomPayload(formValues, selectedHotelId.value)),
      })

      await hotelData.refresh()
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'No se pudo crear la habitacion.'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateRoom(formValues: RoomFormValues) {
    if (!formValues.id) {
      throw new Error('La habitacion necesita identificador para actualizarse.')
    }

    if (selectedHotelId.value === null) {
      const nextError = 'Selecciona un hotel antes de modificar habitaciones.'
      saveError.value = nextError
      throw new Error(nextError)
    }

    isSaving.value = true
    saveError.value = null

    try {
      await request(`/habitacion/${formValues.id}`, {
        method: 'PUT',
        body: JSON.stringify(buildRoomPayload(formValues, selectedHotelId.value)),
      })

      await hotelData.refresh()
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'No se pudo actualizar la habitacion.'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function deleteRoom(roomId: number) {
    isSaving.value = true
    saveError.value = null

    try {
      await request(`/habitacion/${roomId}`, {
        method: 'DELETE',
      })

      await hotelData.refresh()
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'No se pudo eliminar la habitacion.'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  const activeRoomTypes = computed(() => roomTypes.value.filter((type) => type.active))
  const activeRoomStates = computed(() => roomStates.value.filter((state) => state.active))

  return {
    ...hotelData,
    roomTypes,
    roomStates,
    activeRoomTypes,
    activeRoomStates,
    isSaving,
    saveError,
    refresh,
    createRoom,
    updateRoom,
    deleteRoom,
  }
}