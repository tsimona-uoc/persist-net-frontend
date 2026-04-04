import { computed, ref } from 'vue'

import { extractCity, extractCollection, readNumber, readString } from '../lib/backend'
import { useApi } from './useApi'

const SELECTED_HOTEL_STORAGE_KEY = 'persist-net-selected-hotel-id'

export interface HotelOption {
  id: number
  name: string
  subtitle: string
}

const hotels = ref<HotelOption[]>([])
const selectedHotelId = ref<number | null>(readStoredHotelId())
const isLoading = ref(false)
const error = ref<string | null>(null)

function readStoredHotelId(): number | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(SELECTED_HOTEL_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  const parsedValue = Number(rawValue)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

function persistSelectedHotelId(value: number | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (value === null) {
    window.localStorage.removeItem(SELECTED_HOTEL_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(SELECTED_HOTEL_STORAGE_KEY, String(value))
}

function normalizeHotelOptions(payload: unknown): HotelOption[] {
  return extractCollection(payload).map((item) => {
    const id = readNumber(item, 'id') ?? 0
    const name = readString(item, 'nombre', 'name') || `Hotel ${id}`
    const address = readString(item, 'direccion', 'address')
    const city = readString(item, 'ciudad', 'city') || extractCity(address)

    return {
      id,
      name,
      subtitle: [city, address].filter(Boolean).join(' · '),
    }
  })
}

export function useHotelContext() {
  const { request } = useApi()

  async function refreshHotels() {
    isLoading.value = true
    error.value = null

    try {
      const hotelsPayload = await request('/hotel')
      hotels.value = normalizeHotelOptions(hotelsPayload)

      const hasSelectedHotel = selectedHotelId.value !== null && hotels.value.some((hotel) => hotel.id === selectedHotelId.value)

      if (!hasSelectedHotel) {
        selectedHotelId.value = hotels.value[0]?.id ?? null
        persistSelectedHotelId(selectedHotelId.value)
      }
    } catch (requestError) {
      error.value = requestError instanceof Error ? requestError.message : 'No se pudieron cargar los hoteles.'
    } finally {
      isLoading.value = false
    }
  }

  function setSelectedHotelId(nextHotelId: number | null) {
    selectedHotelId.value = nextHotelId
    persistSelectedHotelId(nextHotelId)
  }

  return {
    hotels,
    selectedHotelId,
    selectedHotel: computed(() => hotels.value.find((hotel) => hotel.id === selectedHotelId.value) ?? null),
    isLoading,
    error,
    refreshHotels,
    setSelectedHotelId,
  }
}