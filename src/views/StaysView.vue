<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 class="text-5xl font-bold tracking-tight text-white">Estancias</h1>
          <p class="mt-3 text-2xl font-medium text-slate-400">Gestion operativa de check-in, check-out y estados de estancia</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <Button label="Actualizar" icon="pi pi-refresh" class="hotel-outline-button" @click="refresh" />
          <Button label="Nueva estancia" icon="pi pi-plus" class="hotel-primary-button" @click="openCreateDialog" />
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
            <InputText v-model="search" fluid placeholder="Buscar por huesped, habitacion o estado..." class="hotel-search-input" />
          </IconField>

          <Select
            v-model="selectedStatusId"
            :options="statusFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="Filtrar por estado"
            class="hotel-select"
          />

          <Select
            v-model="selectedRoomId"
            :options="roomFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="Filtrar por habitacion"
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
            <DataTable :value="filteredStays" :loading="isLoading" class="hotel-datatable" responsive-layout="scroll">
              <template #empty>
                <div class="px-6 py-12 text-center text-base text-slate-400">
                  {{ isLoading ? 'Cargando estancias...' : 'No hay estancias que coincidan con los filtros.' }}
                </div>
              </template>

              <Column header="RESERVA">
                <template #body="slotProps">
                  <div>
                    <p class="text-xl font-bold text-white">{{ slotProps.data.reservationLabel }}</p>
                    <p class="mt-1 text-sm text-slate-500">Estancia #{{ slotProps.data.id }}</p>
                  </div>
                </template>
              </Column>

              <Column header="HUESPED">
                <template #body="slotProps">
                  <div>
                    <p class="font-semibold text-slate-200">{{ slotProps.data.guestName }}</p>
                    <p class="text-sm text-slate-500">Habitacion {{ slotProps.data.roomNumber }} · {{ slotProps.data.roomType }}</p>
                  </div>
                </template>
              </Column>

              <Column header="PERIODO ESTANCIA">
                <template #body="slotProps">
                  <div>
                    <p class="font-semibold text-slate-200">{{ slotProps.data.stayPeriodLabel }}</p>
                    <p class="text-sm text-slate-500">Check-in {{ slotProps.data.checkIn || '--' }} · Check-out {{ slotProps.data.checkOut || 'Pendiente' }}</p>
                  </div>
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
                    <Button label="Ver cuenta" icon="pi pi-file-invoice" class="hotel-outline-button" @click="goToFolio(slotProps.data.id)" />
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

    <Dialog v-model:visible="isDialogOpen" modal :style="{ width: 'min(92vw, 840px)' }" class="hotel-dialog" :header="dialogTitle">
      <div class="hotel-dialog-form grid gap-5 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-semibold text-slate-300">Reserva</label>
          <Select v-model="form.reservaId" :options="reservationOptions" option-label="label" option-value="value" placeholder="Selecciona reserva" class="hotel-select" fluid />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Fecha de check-in</label>
          <DatePicker v-model="checkInDate" input-id="stay-checkin" date-format="dd/mm/yy" show-icon icon-display="input" show-button-bar class="hotel-datepicker" fluid />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Fecha de check-out</label>
          <DatePicker v-model="checkOutDate" input-id="stay-checkout" date-format="dd/mm/yy" show-icon icon-display="input" show-button-bar class="hotel-datepicker" fluid />
          <p class="text-xs text-slate-500">Opcional mientras la estancia siga en curso.</p>
        </div>

        <div class="space-y-2 md:col-span-2">
          <label class="text-sm font-semibold text-slate-300">Estado de estancia</label>
          <Select v-model="form.estadoEstanciaId" :options="stayStates" option-label="label" option-value="value" placeholder="Selecciona estado" class="hotel-select" fluid />
        </div>
      </div>

      <div v-if="saveError" class="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
        {{ saveError }}
      </div>

      <template #footer>
        <div class="hotel-dialog-actions flex w-full justify-end gap-3">
          <Button label="Cancelar" class="hotel-outline-button" @click="closeDialog" />
          <Button :label="isEditing ? 'Guardar cambios' : 'Crear estancia'" :loading="isSaving" class="hotel-primary-button" @click="submitForm" />
        </div>
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

import { buildStayForm, createEmptyStayForm, useStayManagement, type HotelStay, type StayFormValues } from '../composables/useStayManagement'

const {
  checkInsToday,
  checkOutsToday,
  createStay,
  deleteStay,
  error,
  isLoading,
  isSaving,
  occupiedRoomsCount,
  refresh,
  reservationOptions,
  rooms,
  saveError,
  stayStates,
  stays,
  updateStay,
} = useStayManagement()

const router = useRouter()
const search = ref('')
const selectedStatusId = ref<number | null>(null)
const selectedRoomId = ref<number | null>(null)
const isDialogOpen = ref(false)
const editingStayId = ref<number | null>(null)
const form = reactive<StayFormValues>(createEmptyStayForm())
const checkInDate = ref<Date | null>(null)
const checkOutDate = ref<Date | null>(null)

const isEditing = computed(() => editingStayId.value !== null)
const dialogTitle = computed(() => (isEditing.value ? 'Editar estancia' : 'Nueva estancia'))

const summaryCards = computed(() => [
  {
    title: 'Estancias',
    value: `${stays.value.length}`,
    description: 'Registros cargados desde /estancia',
    icon: 'pi pi-briefcase',
    badgeClass: 'bg-cyan-400/10 text-cyan-300',
  },
  {
    title: 'Check-in Hoy',
    value: `${checkInsToday.value.length}`,
    description: 'Entradas reales registradas hoy',
    icon: 'pi pi-sign-in',
    badgeClass: 'bg-emerald-400/10 text-emerald-300',
  },
  {
    title: 'Check-out Hoy',
    value: `${checkOutsToday.value.length}`,
    description: 'Salidas reales registradas hoy',
    icon: 'pi pi-sign-out',
    badgeClass: 'bg-orange-400/10 text-orange-300',
  },
  {
    title: 'Ocupacion Actual',
    value: `${occupiedRoomsCount.value} / ${rooms.value.length || 0}`,
    description: 'Habitaciones con estancia activa',
    icon: 'pi pi-building',
    badgeClass: 'bg-blue-400/10 text-blue-300',
  },
])

const statusFilterOptions = computed(() => [{ label: 'Todos los estados', value: null }, ...stayStates.value])
const roomFilterOptions = computed(() => [
  { label: 'Todas las habitaciones', value: null },
  ...rooms.value.map((room) => ({ value: room.id, label: String(room.number) })),
])

const filteredStays = computed(() => {
  const query = search.value.trim().toLowerCase()

  return stays.value.filter((stay) => {
    const matchesQuery =
      !query || [stay.guestName, String(stay.roomNumber), stay.roomType, stay.statusName, stay.reservationLabel].join(' ').toLowerCase().includes(query)

    const matchesStatus = selectedStatusId.value === null || stay.statusId === selectedStatusId.value
    const matchesRoom = selectedRoomId.value === null || stay.roomId === selectedRoomId.value

    return matchesQuery && matchesStatus && matchesRoom
  })
})

function parseApiDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return null
  }

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

function formatApiDate(value: Date | null) {
  if (!value) {
    return ''
  }

  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function resetForm(nextValues: StayFormValues = createEmptyStayForm()) {
  form.id = nextValues.id
  form.reservaId = nextValues.reservaId
  form.fechaCheckIn = nextValues.fechaCheckIn
  form.fechaCheckOut = nextValues.fechaCheckOut
  form.estadoEstanciaId = nextValues.estadoEstanciaId
  checkInDate.value = parseApiDate(nextValues.fechaCheckIn)
  checkOutDate.value = parseApiDate(nextValues.fechaCheckOut)
}

function openCreateDialog() {
  editingStayId.value = null
  resetForm()
  isDialogOpen.value = true
}

function openEditDialog(stay: HotelStay) {
  editingStayId.value = stay.id
  resetForm(buildStayForm(stay))
  isDialogOpen.value = true
}

function closeDialog() {
  isDialogOpen.value = false
  editingStayId.value = null
  resetForm()
}

function goToFolio(stayId: number) {
  router.push(`/estancias/${stayId}/folio`)
}

async function submitForm() {
  if (!form.reservaId || !form.fechaCheckIn || !form.estadoEstanciaId) {
    return
  }

  const payload: StayFormValues = {
    id: editingStayId.value ?? undefined,
    reservaId: form.reservaId,
    fechaCheckIn: form.fechaCheckIn,
    fechaCheckOut: form.fechaCheckOut || null,
    estadoEstanciaId: form.estadoEstanciaId,
  }

  try {
    if (isEditing.value) {
      await updateStay(payload)
    } else {
      await createStay(payload)
    }

    closeDialog()
  } catch {
    return
  }
}

async function handleDelete(stayId: number) {
  if (!window.confirm('Se eliminara la estancia seleccionada. Deseas continuar?')) {
    return
  }

  try {
    await deleteStay(stayId)
  } catch {
    return
  }
}

function getStatusTagClass(statusName: string) {
  const normalizedStatus = statusName.toLowerCase()

  if (normalizedStatus.includes('act') || normalizedStatus.includes('check')) {
    return 'hotel-tag-info'
  }

  if (normalizedStatus.includes('cerr') || normalizedStatus.includes('final')) {
    return 'hotel-tag-neutral'
  }

  return 'hotel-tag-success'
}

watch(checkInDate, (value) => {
  form.fechaCheckIn = formatApiDate(value)
})

watch(checkOutDate, (value) => {
  form.fechaCheckOut = value ? formatApiDate(value) : null
})

onMounted(() => {
  refresh()
})
</script>