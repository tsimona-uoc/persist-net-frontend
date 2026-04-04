import { computed, ref } from 'vue'

import { extractCollection, readBoolean, readDateString, readNumber, readString } from '../lib/backend'
import { useApi } from './useApi'

export interface SystemCatalogItem {
  id: number
  name: string
  description: string
  active?: boolean
  extra?: string
}

export interface CatalogSection {
  key: string
  title: string
  endpoint: string
  description: string
  items: SystemCatalogItem[]
}

export function useSystemCatalogs() {
  const { request } = useApi()
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const sections = ref<CatalogSection[]>([])

  async function refresh() {
    isLoading.value = true
    error.value = null

    try {
      const catalogDefinitions = [
        { key: 'roomTypes', title: 'Tipos de habitacion', endpoint: '/tipohabitacion', description: 'Configuracion de tipologias y capacidades de habitaciones.' },
        { key: 'roomStates', title: 'Estados de habitacion', endpoint: '/estadohabitacion', description: 'Estados operativos parametrizados para las habitaciones.' },
        { key: 'reservationStates', title: 'Estados de reserva', endpoint: '/estadoreserva', description: 'Estados funcionales del ciclo de reserva.' },
        { key: 'regimens', title: 'Regimenes', endpoint: '/regimen', description: 'Planes de alojamiento configurados en el sistema.' },
        { key: 'paymentMethods', title: 'Metodos de pago', endpoint: '/metodopago', description: 'Canales y metodos de cobro parametrizados.' },
        { key: 'seasons', title: 'Temporadas', endpoint: '/temporada', description: 'Temporadas para reglas de precio y disponibilidad.' },
        { key: 'rates', title: 'Tarifas', endpoint: '/tarifa', description: 'Tarifas configuradas por temporada, regimen y tipo de habitacion.' },
        { key: 'services', title: 'Servicios extra', endpoint: '/servicioextra', description: 'Catalogo de servicios adicionales consumibles.' },
      ] as const

      const payloads = await Promise.all(catalogDefinitions.map((definition) => request(definition.endpoint)))

      sections.value = catalogDefinitions.map((definition, index) => ({
        ...definition,
        items: extractCollection(payloads[index]).map((item) => ({
          id: readNumber(item, 'id') ?? 0,
          name: readString(item, 'nombre', 'name') || `Elemento ${readNumber(item, 'id') ?? 0}`,
          description: readString(item, 'descripcion', 'description') || 'Sin descripcion',
          active: readBoolean(item, 'activo', 'active'),
          extra: buildExtraLine(definition.key, item),
        })),
      }))
    } catch (requestError) {
      error.value = requestError instanceof Error ? requestError.message : 'No se pudieron cargar los parametros del sistema.'
    } finally {
      isLoading.value = false
    }
  }

  const totalItems = computed(() => {
    return sections.value.reduce((total, section) => total + section.items.length, 0)
  })

  return {
    sections,
    totalItems,
    isLoading,
    error,
    refresh,
  }
}

function buildExtraLine(key: string, item: Record<string, unknown>): string {
  if (key === 'seasons') {
    const startDate = readDateString(item, 'fechaInicio')
    const endDate = readDateString(item, 'fechaFin')
    return startDate && endDate ? `${startDate} -> ${endDate}` : ''
  }

  if (key === 'rates') {
    const price = readNumber(item, 'precioNoche')
    const roomTypeId = readNumber(item, 'tipoHabitacionId')
    const regimenId = readNumber(item, 'regimenId')
    return [
      roomTypeId !== null ? `Tipo #${roomTypeId}` : '',
      regimenId !== null ? `Regimen #${regimenId}` : '',
      price !== null ? `${price.toFixed(2)} €/noche` : '',
    ].filter(Boolean).join(' · ')
  }

  if (key === 'roomTypes') {
    const capacity = readNumber(item, 'capacidad')
    return capacity !== null ? `Capacidad ${capacity} pax` : ''
  }

  if (key === 'services') {
    const price = readNumber(item, 'precioServicio')
    return price !== null ? `${price.toFixed(2)} €` : ''
  }

  return ''
}