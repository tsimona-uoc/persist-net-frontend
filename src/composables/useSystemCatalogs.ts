import { computed, ref } from 'vue'

import { extractCollection, readBoolean, readDateString, readNumber, readString, type UnknownRecord } from '../lib/backend'
import { useApi } from './useApi'

export interface SystemCatalogItem {
  id: number
  name: string
  description: string
  active?: boolean
  extra?: string
  raw: UnknownRecord
}

export interface CatalogFieldOption {
  label: string
  value: number | boolean
}

export interface CatalogField {
  key: string
  label: string
  apiKey: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'select'
  required?: boolean
  optionSectionKey?: string
  defaultValue?: string | number | boolean | null
}

export interface CatalogSection {
  key: string
  title: string
  endpoint: string
  description: string
  fields: CatalogField[]
  items: SystemCatalogItem[]
}

interface CatalogSectionDefinition {
  key: string
  title: string
  endpoint: string
  description: string
  fields: CatalogField[]
}

export type CatalogFormValues = Record<string, string | number | boolean | null>

const catalogDefinitions: CatalogSectionDefinition[] = [
  {
    key: 'roomTypes',
    title: 'Tipos de habitacion',
    endpoint: '/tipohabitacion',
    description: 'Configuracion de tipologias de habitaciones.',
    fields: [
      { key: 'name', label: 'Nombre', apiKey: 'nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripcion', apiKey: 'descripcion', type: 'textarea' },
    ],
  },
  {
    key: 'roomStates',
    title: 'Estados de habitacion',
    endpoint: '/estadohabitacion',
    description: 'Estados operativos parametrizados para las habitaciones.',
    fields: [
      { key: 'name', label: 'Nombre', apiKey: 'nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripcion', apiKey: 'descripcion', type: 'textarea' },
      { key: 'active', label: 'Activo', apiKey: 'activo', type: 'boolean', defaultValue: true },
    ],
  },
  {
    key: 'reservationStates',
    title: 'Estados de reserva',
    endpoint: '/estadoreserva',
    description: 'Estados funcionales del ciclo de reserva.',
    fields: [
      { key: 'name', label: 'Nombre', apiKey: 'nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripcion', apiKey: 'descripcion', type: 'textarea' },
      { key: 'active', label: 'Activo', apiKey: 'activo', type: 'boolean', defaultValue: true },
    ],
  },
  {
    key: 'regimens',
    title: 'Regimenes',
    endpoint: '/regimen',
    description: 'Planes de alojamiento configurados en el sistema.',
    fields: [
      { key: 'name', label: 'Nombre', apiKey: 'nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripcion', apiKey: 'descripcion', type: 'textarea' },
      { key: 'active', label: 'Activo', apiKey: 'activo', type: 'boolean', defaultValue: true },
    ],
  },
  {
    key: 'paymentMethods',
    title: 'Metodos de pago',
    endpoint: '/metodopago',
    description: 'Canales y metodos de cobro parametrizados.',
    fields: [
      { key: 'name', label: 'Nombre', apiKey: 'nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripcion', apiKey: 'descripcion', type: 'textarea' },
      { key: 'active', label: 'Activo', apiKey: 'activo', type: 'boolean', defaultValue: true },
    ],
  },
  {
    key: 'seasons',
    title: 'Temporadas',
    endpoint: '/temporada',
    description: 'Temporadas para reglas de precio y disponibilidad.',
    fields: [
      { key: 'name', label: 'Nombre', apiKey: 'nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripcion', apiKey: 'descripcion', type: 'textarea' },
      { key: 'startDate', label: 'Fecha inicio', apiKey: 'fechaInicio', type: 'date', required: true },
      { key: 'endDate', label: 'Fecha fin', apiKey: 'fechaFin', type: 'date', required: true },
    ],
  },
  {
    key: 'rates',
    title: 'Tarifas',
    endpoint: '/tarifa',
    description: 'Tarifas configuradas por temporada, regimen y tipo de habitacion.',
    fields: [
      { key: 'name', label: 'Nombre', apiKey: 'nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripcion', apiKey: 'descripcion', type: 'textarea' },
      { key: 'seasonId', label: 'Temporada', apiKey: 'temporadaId', type: 'select', optionSectionKey: 'seasons' },
      { key: 'roomTypeId', label: 'Tipo de habitacion', apiKey: 'tipoHabitacionId', type: 'select', optionSectionKey: 'roomTypes', required: true },
      { key: 'regimenId', label: 'Regimen', apiKey: 'regimenId', type: 'select', optionSectionKey: 'regimens', required: true },
      { key: 'price', label: 'Precio noche', apiKey: 'precioNoche', type: 'number', required: true },
      { key: 'active', label: 'Activo', apiKey: 'activo', type: 'boolean', defaultValue: true },
    ],
  },
  {
    key: 'services',
    title: 'Servicios extra',
    endpoint: '/servicioextra',
    description: 'Catalogo de servicios adicionales consumibles.',
    fields: [
      { key: 'name', label: 'Nombre', apiKey: 'nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripcion', apiKey: 'descripcion', type: 'textarea' },
      { key: 'price', label: 'Precio servicio', apiKey: 'precioServicio', type: 'number', required: true },
      { key: 'active', label: 'Activo', apiKey: 'activo', type: 'boolean', defaultValue: true },
    ],
  },
]

export function useSystemCatalogs() {
  const { request } = useApi()
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const saveError = ref<string | null>(null)
  const sections = ref<CatalogSection[]>([])

  async function refresh() {
    isLoading.value = true
    error.value = null

    try {
      const payloads = await Promise.all(catalogDefinitions.map((definition) => request(definition.endpoint)))
      const referenceMaps = buildReferenceMaps(payloads)

      sections.value = catalogDefinitions.map((definition, index) => ({
        ...definition,
        items: extractCollection(payloads[index]).map((item) => normalizeCatalogItem(definition, item, referenceMaps)),
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

  function createDraft(sectionKey: string, item?: SystemCatalogItem | null): CatalogFormValues {
    const section = sections.value.find((currentSection) => currentSection.key === sectionKey)

    if (!section) {
      return {}
    }

    return Object.fromEntries(
      section.fields.map((field) => [field.key, getFieldValue(field, item?.raw ?? null)]),
    )
  }

  function getFieldOptions(field: CatalogField): CatalogFieldOption[] {
    if (field.type === 'boolean') {
      return [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false },
      ]
    }

    if (field.type === 'select' && field.optionSectionKey) {
      const referenceSection = sections.value.find((section) => section.key === field.optionSectionKey)

      return (referenceSection?.items ?? []).map((item) => ({
        label: item.name,
        value: item.id,
      }))
    }

    return []
  }

  async function saveItem(sectionKey: string, values: CatalogFormValues, itemId?: number) {
    const section = sections.value.find((currentSection) => currentSection.key === sectionKey)

    if (!section) {
      throw new Error('No se encontro la seccion seleccionada.')
    }

    isSaving.value = true
    saveError.value = null

    try {
      const payload = buildPayload(section, values, itemId)

      await request(itemId ? `${section.endpoint}/${itemId}` : section.endpoint, {
        method: itemId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })

      await refresh()
    } catch (requestError) {
      saveError.value = requestError instanceof Error ? requestError.message : 'No se pudo guardar el parametro.'
      throw requestError
    } finally {
      isSaving.value = false
    }
  }

  async function deleteItem(sectionKey: string, itemId: number) {
    const section = sections.value.find((currentSection) => currentSection.key === sectionKey)

    if (!section) {
      throw new Error('No se encontro la seccion seleccionada.')
    }

    isSaving.value = true
    saveError.value = null

    try {
      await request(`${section.endpoint}/${itemId}`, {
        method: 'DELETE',
      })

      await refresh()
    } catch (requestError) {
      saveError.value = requestError instanceof Error ? requestError.message : 'No se pudo eliminar el parametro.'
      throw requestError
    } finally {
      isSaving.value = false
    }
  }

  return {
    sections,
    totalItems,
    isLoading,
    isSaving,
    error,
    saveError,
    refresh,
    createDraft,
    getFieldOptions,
    saveItem,
    deleteItem,
  }
}

function buildReferenceMaps(payloads: unknown[]) {
  return new Map(
    catalogDefinitions.map((definition, index) => {
      const items = extractCollection(payloads[index])
      const map = new Map<number, string>()

      for (const item of items) {
        const id = readNumber(item, 'id')

        if (id !== null) {
          map.set(id, readString(item, 'nombre', 'name') || `#${id}`)
        }
      }

      return [definition.key, map]
    }),
  )
}

function normalizeCatalogItem(
  definition: CatalogSectionDefinition,
  item: UnknownRecord,
  referenceMaps: Map<string, Map<number, string>>,
): SystemCatalogItem {
  return {
    id: readNumber(item, 'id') ?? 0,
    name: readString(item, 'nombre', 'name') || `Elemento ${readNumber(item, 'id') ?? 0}`,
    description: readString(item, 'descripcion', 'description') || 'Sin descripcion',
    active: readBoolean(item, 'activo', 'active'),
    extra: buildExtraLine(definition.key, item, referenceMaps),
    raw: item,
  }
}

function buildExtraLine(
  key: string,
  item: Record<string, unknown>,
  referenceMaps: Map<string, Map<number, string>>,
): string {
  if (key === 'rates') {
    const price = readNumber(item, 'precioNoche')
    const seasonId = readNumber(item, 'temporadaId')
    const roomTypeId = readNumber(item, 'tipoHabitacionId')
    const regimenId = readNumber(item, 'regimenId')
    return [
      seasonId !== null ? referenceMaps.get('seasons')?.get(seasonId) ?? `Temporada #${seasonId}` : '',
      roomTypeId !== null ? referenceMaps.get('roomTypes')?.get(roomTypeId) ?? `Tipo #${roomTypeId}` : '',
      regimenId !== null ? referenceMaps.get('regimens')?.get(regimenId) ?? `Regimen #${regimenId}` : '',
      price !== null ? `${price.toFixed(2)} €/noche` : '',
    ].filter(Boolean).join(' · ')
  }

  if (key === 'services') {
    const price = readNumber(item, 'precioServicio')
    return price !== null ? `${price.toFixed(2)} €` : ''
  }

  return ''
}

function getFieldValue(field: CatalogField, record: UnknownRecord | null): string | number | boolean | null {
  if (!record) {
    return field.defaultValue ?? (field.type === 'boolean' ? true : field.type === 'select' ? null : '')
  }

  if (field.type === 'number' || field.type === 'select') {
    return readNumber(record, field.apiKey)
  }

  if (field.type === 'boolean') {
    return readBoolean(record, field.apiKey)
  }

  if (field.type === 'date') {
    return readDateString(record, field.apiKey)
  }

  return readString(record, field.apiKey)
}

function buildPayload(section: CatalogSectionDefinition, values: CatalogFormValues, itemId?: number) {
  const payload: Record<string, unknown> = {}

  for (const field of section.fields) {
    const value = values[field.key]

    if (field.type === 'text' || field.type === 'textarea' || field.type === 'date') {
      const stringValue = typeof value === 'string' ? value.trim() : ''

      if (stringValue || field.required) {
        payload[field.apiKey] = stringValue
      }

      continue
    }

    if (field.type === 'number') {
      const numericValue = typeof value === 'number' ? value : Number(value)

      if (Number.isFinite(numericValue)) {
        payload[field.apiKey] = numericValue
      }

      continue
    }

    if (field.type === 'boolean') {
      payload[field.apiKey] = Boolean(value)
      continue
    }

    if (field.type === 'select') {
      const selectedValue = typeof value === 'number' ? value : Number(value)

      if (Number.isFinite(selectedValue)) {
        payload[field.apiKey] = selectedValue
      } else if (field.required) {
        payload[field.apiKey] = null
      }
    }
  }

  if (itemId) {
    payload.id = itemId
  }

  return payload
}