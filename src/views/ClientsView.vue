<template>
  <section class="flex h-full min-h-0 min-w-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 class="text-5xl font-bold tracking-tight text-white">Clientes</h1>
          <p class="mt-3 text-2xl font-medium text-slate-400">Gestion de clientes del hotel</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <Button label="Actualizar" icon="pi pi-refresh" class="hotel-outline-button" @click="refresh" />
          <Button label="Nuevo cliente" icon="pi pi-plus" class="hotel-primary-button" @click="openCreateDialog" />
        </div>
      </div>
    </div>

    <div class="grid shrink-0 gap-5 md:grid-cols-3">
      <Card v-for="card in summaryCards" :key="card.title" class="hotel-card shadow-sm">
        <template #content>
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xl font-semibold text-slate-300">{{ card.title }}</p>
              <p class="mt-5 text-5xl font-bold tracking-tight text-white">{{ card.value }}</p>
              <p class="mt-2 text-base text-slate-500">{{ card.description }}</p>
            </div>
            <div :class="['flex h-14 w-14 items-center justify-center rounded-2xl text-xl', card.badgeClass]">
              <i :class="card.icon"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card class="hotel-card shrink-0 shadow-sm">
      <template #content>
        <IconField class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="search"
            fluid
            placeholder="Buscar por nombre, apellidos, email o DNI..."
            class="hotel-search-input"
          />
        </IconField>
      </template>
    </Card>

    <Card class="hotel-card hotel-fill-card min-h-0 flex-1 overflow-hidden shadow-sm">
      <template #content>
        <div class="flex h-full min-h-0 flex-col gap-4">
          <div v-if="error || saveError" class="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {{ saveError || error }}
          </div>

          <div class="h-full min-h-0 overflow-auto">
            <DataTable :value="filteredClients" :loading="isLoading" class="hotel-datatable" responsive-layout="scroll">
              <template #empty>
                <div class="px-6 py-12 text-center text-base text-slate-400">
                  {{ isLoading ? 'Cargando clientes...' : 'No hay clientes disponibles en la API.' }}
                </div>
              </template>

              <Column header="CLIENTE">
                <template #body="slotProps">
                  <div class="flex items-center gap-3 py-1">
                    <Avatar icon="pi pi-user" shape="circle" class="hotel-avatar" />
                    <div>
                  <div class="flex items-center gap-2">
                    <p class="text-base font-bold text-white">{{ slotProps.data.nombre || slotProps.data.name }}</p>
                    <Tag v-if="slotProps.data.vip === true || slotProps.data.Vip === true" value="VIP" class="!px-2 !py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300" rounded />
                  </div>
                      <p class="text-sm text-slate-500">ID: {{ slotProps.data.id }}</p>
                    </div>
                  </div>
                </template>
              </Column>
              <Column field="email" header="EMAIL">
                <template #body="slotProps">
                  <div class="flex items-center gap-2 text-sm text-slate-300">
                    <i class="pi pi-envelope"></i>
                    <span>{{ slotProps.data.email }}</span>
                  </div>
                </template>
              </Column>
              <Column field="phone" header="TELEFONO">
                <template #body="slotProps">
                  <div class="flex items-center gap-2 text-sm text-slate-300">
                    <i class="pi pi-phone"></i>
                    <span>{{ slotProps.data.phone }}</span>
                  </div>
                </template>
              </Column>
          <Column header="DNI">
            <template #body="slotProps"><span class="text-slate-300">{{ slotProps.data.documentacion || slotProps.data.dni || 'N/D' }}</span></template>
          </Column>
          <Column header="CIUDAD">
            <template #body="slotProps"><span class="text-slate-300">{{ slotProps.data.ciudad || slotProps.data.city || 'Sin ciudad' }}</span></template>
          </Column>
              <Column header="DIRECCION">
                <template #body="slotProps">
              <span class="text-slate-400">{{ slotProps.data.direccion || slotProps.data.address || 'Sin direccion' }}</span>
                </template>
              </Column>
              <Column header="ACCIONES">
                <template #body="slotProps">
                  <div class="flex gap-2">
                    <Button icon="pi pi-pencil" class="hotel-outline-button hotel-icon-button" @click="openEditDialog(slotProps.data)" />
                    <Button icon="pi pi-trash" class="hotel-danger-button hotel-icon-button" @click="handleDelete(slotProps.data.id)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </template>
    </Card>

    <Dialog v-model:visible="isDialogOpen" modal :style="{ width: 'min(92vw, 760px)' }" class="hotel-dialog" :header="dialogTitle">
      <div class="hotel-dialog-form grid gap-5 md:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Nombre</label>
          <InputText v-model="form.nombre" class="hotel-input" fluid placeholder="Ej. Juan" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Apellidos</label>
          <InputText v-model="form.apellido" class="hotel-input" fluid placeholder="Ej. Perez" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Email</label>
          <InputText v-model="form.email" class="hotel-input" fluid placeholder="Ej. juan@correo.com" type="email" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Teléfono</label>
          <InputText v-model="form.telefono" class="hotel-input" fluid placeholder="Ej. 600 000 000" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">DNI / Pasaporte</label>
          <InputText v-model="form.documentacion" class="hotel-input" fluid placeholder="Ej. 12345678A" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Ciudad</label>
          <InputText v-model="form.ciudad" class="hotel-input" fluid placeholder="Ej. Madrid" />
        </div>
        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-semibold text-slate-300">Dirección</label>
          <InputText v-model="form.direccion" class="hotel-input" fluid placeholder="Ej. Calle Principal 123" />
        </div>
        <div class="flex items-center gap-3 md:col-span-2 mt-2">
          <Checkbox v-model="form.vip" inputId="vip" :binary="true" />
          <label for="vip" class="cursor-pointer text-sm font-medium text-slate-300">Marcar como Cliente VIP</label>
        </div>
      </div>

      <div v-if="saveError" class="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
        {{ saveError }}
      </div>

      <template #footer>
        <div class="hotel-dialog-actions flex w-full justify-end gap-3">
          <Button label="Cancelar" class="hotel-outline-button" @click="closeDialog" />
          <Button :label="isEditing ? 'Guardar cambios' : 'Crear cliente'" :loading="isSaving" class="hotel-primary-button" @click="submitForm" />
        </div>
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'

import { useHotelData } from '../composables/useHotelData'
import { buildClientForm, createEmptyClientForm, useClientManagement, type ClientFormValues } from '../composables/useClientManagement'

const search = ref('')
const { clients, error, isLoading, refresh } = useHotelData()
const { deleteClient, isSaving, saveClient, saveError } = useClientManagement()

const isDialogOpen = ref(false)
const editingClientId = ref<number | null>(null)
const form = reactive<ClientFormValues>(createEmptyClientForm())

const isEditing = computed(() => editingClientId.value !== null)
const dialogTitle = computed(() => (isEditing.value ? 'Editar cliente' : 'Nuevo cliente'))

const summaryCards = computed(() => {
  const vipClients = clients.value.filter((c: any) => c.vip === true || c.Vip === true).length
  const normalClients = clients.value.length - vipClients

  return [
    {
      title: 'Total Clientes',
      value: `${clients.value.length}`,
      description: 'Registrados en la base de datos',
      icon: 'pi pi-users',
      badgeClass: 'bg-blue-400/10 text-blue-300',
    },
    {
      title: 'Clientes Normales',
      value: `${normalClients}`,
      description: 'Tarifa estándar',
      icon: 'pi pi-user',
      badgeClass: 'bg-emerald-400/10 text-emerald-300',
    },
    {
      title: 'Clientes VIP',
      value: `${vipClients}`,
      description: 'Trato preferencial',
      icon: 'pi pi-star',
      badgeClass: 'bg-amber-400/10 text-amber-300',
    }
  ]
})

const filteredClients = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return clients.value
  }

  return clients.value.filter((client: any) => {
    return [client.name, client.nombre, client.apellido, client.email, client.phone, client.telefono, client.dni, client.documentacion, client.city, client.ciudad, client.address, client.direccion].some((value) =>
      (value || '').toString().toLowerCase().includes(query),
    )
  })
})

function resetForm(nextValues: ClientFormValues = createEmptyClientForm()) {
  form.id = nextValues.id
  form.nombre = nextValues.nombre
  form.apellido = nextValues.apellido
  form.email = nextValues.email
  form.telefono = nextValues.telefono
  form.documentacion = nextValues.documentacion
  form.ciudad = nextValues.ciudad
  form.direccion = nextValues.direccion
  form.vip = nextValues.vip
}

function openCreateDialog() {
  editingClientId.value = null
  resetForm()
  isDialogOpen.value = true
}

function openEditDialog(client: any) {
  editingClientId.value = client.id
  resetForm(buildClientForm(client))
  isDialogOpen.value = true
}

function closeDialog() {
  isDialogOpen.value = false
  editingClientId.value = null
  resetForm()
}

async function submitForm() {
  if (!form.nombre || !form.documentacion) return

  try {
    await saveClient({ ...form, id: editingClientId.value ?? undefined })
    closeDialog()
  } catch {
    return
  }
}

async function handleDelete(clientId: number) {
  if (!window.confirm('¿Se eliminará el cliente seleccionado. Deseas continuar?')) return
  try { await deleteClient(clientId) } catch { return }
}

onMounted(() => {
  refresh()
})
</script>