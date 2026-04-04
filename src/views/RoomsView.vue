<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 class="text-5xl font-bold tracking-tight text-white">Habitaciones</h1>
          <p class="mt-3 text-2xl font-medium text-slate-400">Creacion, actualizacion y control operativo del inventario</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <Button label="Actualizar" icon="pi pi-refresh" class="hotel-outline-button" @click="refresh" />
          <Button label="Nueva habitacion" icon="pi pi-plus" class="hotel-primary-button" @click="openCreateDialog" />
        </div>
      </div>
    </div>

    <div class="grid shrink-0 gap-5 md:grid-cols-4">
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
        <div class="grid gap-4 xl:grid-cols-[1fr_220px_220px]">
          <IconField class="w-full">
            <InputIcon class="pi pi-search" />
            <InputText v-model="search" fluid placeholder="Buscar por numero, planta, tipo o estado..." class="hotel-search-input" />
          </IconField>

          <Select
            v-model="selectedTypeId"
            :options="typeFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="Filtrar por tipo"
            class="hotel-select"
          />

          <Select
            v-model="selectedStatusId"
            :options="statusFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="Filtrar por estado"
            class="hotel-select"
          />
        </div>
      </template>
    </Card>

    <Card class="hotel-card hotel-fill-card min-h-0 flex-1 overflow-hidden shadow-sm">
      <template #content>
        <div class="flex h-full min-h-0 flex-col gap-4">
          <div v-if="error || saveError" class="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {{ saveError || error }}
          </div>

          <div class="h-full min-h-0 overflow-auto">
            <DataTable :value="filteredRooms" :loading="isLoading" class="hotel-datatable" responsive-layout="scroll">
              <template #empty>
                <div class="px-6 py-12 text-center text-base text-slate-400">
                  {{ isLoading ? 'Cargando habitaciones...' : 'No hay habitaciones que coincidan con los filtros.' }}
                </div>
              </template>

              <Column header="NUMERO">
                <template #body="slotProps">
                  <div>
                    <p class="text-xl font-bold text-white">{{ slotProps.data.number }}</p>
                    <p class="mt-1 text-sm text-slate-500">Habitacion #{{ slotProps.data.id }}</p>
                  </div>
                </template>
              </Column>

              <Column header="PLANTA">
                <template #body="slotProps">
                  <span class="font-semibold text-slate-200">{{ slotProps.data.floorLabel }}</span>
                </template>
              </Column>

              <Column header="TIPO">
                <template #body="slotProps">
                  <span class="font-semibold text-slate-200">{{ slotProps.data.typeName }}</span>
                </template>
              </Column>

              <Column header="ESTADO">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.statusName" rounded :class="getStatusTagClass(slotProps.data.statusName)" />
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
          <label class="text-sm font-semibold text-slate-300">Numero</label>
          <InputText v-model="form.numero" class="hotel-input" fluid placeholder="Ej. 203" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Piso</label>
          <InputText v-model="form.piso" class="hotel-input" fluid placeholder="Ej. 2" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Planta</label>
          <InputText v-model="form.planta" class="hotel-input" fluid placeholder="Ej. Ala norte" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Tipo de habitacion</label>
          <Select
            v-model="form.tipoHabitacionId"
            :options="activeRoomTypes"
            option-label="label"
            option-value="value"
            placeholder="Selecciona tipo"
            class="hotel-select"
            fluid
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Estado</label>
          <Select
            v-model="form.estadoHabitacionId"
            :options="activeRoomStates"
            option-label="label"
            option-value="value"
            placeholder="Selecciona estado"
            class="hotel-select"
            fluid
          />
        </div>
      </div>

      <div v-if="saveError" class="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
        {{ saveError }}
      </div>

      <template #footer>
        <div class="hotel-dialog-actions flex w-full justify-end gap-3">
          <Button label="Cancelar" class="hotel-outline-button" @click="closeDialog" />
          <Button :label="isEditing ? 'Guardar cambios' : 'Crear habitacion'" :loading="isSaving" class="hotel-primary-button" @click="submitForm" />
        </div>
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

import { buildRoomForm, createEmptyRoomForm, useRoomManagement, type RoomFormValues } from '../composables/useRoomManagement'
import type { HotelRoom } from '../composables/useHotelData'

const {
  activeRoomStates,
  activeRoomTypes,
  createRoom,
  deleteRoom,
  error,
  isLoading,
  isSaving,
  refresh,
  rooms,
  roomStates,
  roomTypes,
  saveError,
  updateRoom,
} = useRoomManagement()

const search = ref('')
const selectedTypeId = ref<number | null>(null)
const selectedStatusId = ref<number | null>(null)
const isDialogOpen = ref(false)
const editingRoomId = ref<number | null>(null)
const form = reactive<RoomFormValues>(createEmptyRoomForm())

const isEditing = computed(() => editingRoomId.value !== null)
const dialogTitle = computed(() => (isEditing.value ? 'Editar habitacion' : 'Nueva habitacion'))

const summaryCards = computed(() => {
  const availableRooms = rooms.value.filter((room) => room.statusName.toLowerCase().includes('dispon')).length
  const occupiedRooms = rooms.value.filter((room) => room.statusName.toLowerCase().includes('ocup')).length

  return [
    {
      title: 'Habitaciones',
      value: `${rooms.value.length}`,
      description: 'Registros cargados desde /habitacion',
      icon: 'pi pi-building',
      badgeClass: 'bg-cyan-400/10 text-cyan-300',
    },
    {
      title: 'Disponibles',
      value: `${availableRooms}`,
      description: 'Listas para nueva asignacion',
      icon: 'pi pi-check-circle',
      badgeClass: 'bg-emerald-400/10 text-emerald-300',
    },
    {
      title: 'Ocupadas',
      value: `${occupiedRooms}`,
      description: 'Detectadas por estado operativo',
      icon: 'pi pi-users',
      badgeClass: 'bg-blue-400/10 text-blue-300',
    },
    {
      title: 'Tipos',
      value: `${roomTypes.value.length}`,
      description: 'Tipologias configuradas',
      icon: 'pi pi-sitemap',
      badgeClass: 'bg-amber-400/10 text-amber-300',
    },
  ]
})

const typeFilterOptions = computed(() => [{ label: 'Todos los tipos', value: null }, ...roomTypes.value])
const statusFilterOptions = computed(() => [{ label: 'Todos los estados', value: null }, ...roomStates.value])

const filteredRooms = computed(() => {
  const query = search.value.trim().toLowerCase()

  return rooms.value.filter((room) => {
    const matchesQuery =
      !query || [room.number, room.floorLabel, room.typeName, room.statusName].join(' ').toLowerCase().includes(query)

    const matchesType = selectedTypeId.value === null || room.typeId === selectedTypeId.value
    const matchesStatus = selectedStatusId.value === null || room.statusId === selectedStatusId.value

    return matchesQuery && matchesType && matchesStatus
  })
})

function resetForm(nextValues: RoomFormValues = createEmptyRoomForm()) {
  form.id = nextValues.id
  form.numero = nextValues.numero
  form.piso = nextValues.piso
  form.planta = nextValues.planta
  form.tipoHabitacionId = nextValues.tipoHabitacionId
  form.estadoHabitacionId = nextValues.estadoHabitacionId
}

function openCreateDialog() {
  editingRoomId.value = null
  resetForm()
  isDialogOpen.value = true
}

function openEditDialog(room: HotelRoom) {
  editingRoomId.value = room.id
  resetForm(buildRoomForm(room))
  isDialogOpen.value = true
}

function closeDialog() {
  isDialogOpen.value = false
  editingRoomId.value = null
  resetForm()
}

async function submitForm() {
  if (!form.numero.trim() || !form.piso.trim() || !form.tipoHabitacionId || !form.estadoHabitacionId) {
    return
  }

  const payload: RoomFormValues = {
    id: editingRoomId.value ?? undefined,
    numero: form.numero,
    piso: form.piso,
    planta: form.planta,
    tipoHabitacionId: form.tipoHabitacionId,
    estadoHabitacionId: form.estadoHabitacionId,
  }

  try {
    if (isEditing.value) {
      await updateRoom(payload)
    } else {
      await createRoom(payload)
    }

    closeDialog()
  } catch {
    return
  }
}

async function handleDelete(roomId: number) {
  if (!window.confirm('Se eliminara la habitacion seleccionada. Deseas continuar?')) {
    return
  }

  try {
    await deleteRoom(roomId)
  } catch {
    return
  }
}

function getStatusTagClass(statusName: string) {
  const normalizedStatus = statusName.toLowerCase()

  if (normalizedStatus.includes('dispon')) {
    return 'hotel-tag-success'
  }

  if (normalizedStatus.includes('ocup')) {
    return 'hotel-tag-info'
  }

  return 'hotel-tag-neutral'
}

onMounted(() => {
  refresh()
})
</script>