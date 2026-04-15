import { ref } from 'vue'
import { useHotelData } from './useHotelData'
import { useApi } from './useApi'

export interface ClientFormValues {
  id?: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  documentacion: string
  ciudad: string
  direccion: string
  vip: boolean
}

export function createEmptyClientForm(): ClientFormValues {
  return {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    documentacion: '',
    ciudad: '',
    direccion: '',
    vip: false,
  }
}

export function buildClientForm(client: any): ClientFormValues {
  return {
    id: client.id,
    nombre: client.nombre || client.name || '',
    apellido: client.apellido || '',
    email: client.email?.startsWith('Sin ') ? '' : (client.email || ''),
    telefono: client.telefono || (client.phone?.startsWith('Sin ') ? '' : client.phone) || '',
    documentacion: client.documentacion || (client.dni?.startsWith('Sin ') ? '' : client.dni) || '',
    ciudad: client.ciudad || client.city || '',
    direccion: client.direccion || client.address || '',
    vip: client.vip ?? client.Vip ?? false,
  }
}

export function useClientManagement() {
  const { refresh } = useHotelData()
  const { request } = useApi()
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)

  async function saveClient(payload: ClientFormValues) {
    isSaving.value = true
    saveError.value = null

    try {
      const isEditing = payload.id !== undefined
      const endpoint = isEditing ? `/cliente/${payload.id}` : `/cliente`
      const method = isEditing ? 'PUT' : 'POST'

      await request(endpoint, {
        method,
        body: JSON.stringify(payload)
      })

      await refresh()
    } catch (err: any) {
      saveError.value = err.message || 'Error de conexión con la API.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteClient(id: number) {
    isSaving.value = true
    saveError.value = null

    try {
      await request(`/cliente/${id}`, { method: 'DELETE' })

      await refresh()
    } catch (err: any) {
      saveError.value = err.message || 'Error de conexión con la API.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  return { isSaving, saveError, saveClient, deleteClient }
}