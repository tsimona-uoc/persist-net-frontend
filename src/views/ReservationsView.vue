<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 class="text-5xl font-bold tracking-tight text-white">Reservas</h1>
          <p class="mt-3 text-2xl font-medium text-slate-400">Alta, edicion y control operativo de reservas</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <Button label="Actualizar" icon="pi pi-refresh" class="hotel-outline-button" @click="refresh" />
          <Button label="Nueva reserva" icon="pi pi-plus" class="hotel-primary-button" @click="openCreateDialog" />
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
            <InputText v-model="search" fluid placeholder="Buscar por cliente, habitacion o estado..." class="hotel-search-input" />
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
            <DataTable :value="filteredReservations" :loading="isLoading" class="hotel-datatable" responsive-layout="scroll">
              <template #empty>
                <div class="px-6 py-12 text-center text-base text-slate-400">
                  {{ isLoading ? 'Cargando reservas...' : 'No hay reservas que coincidan con los filtros.' }}
                </div>
              </template>

              <Column header="CLIENTE">
                <template #body="slotProps">
                  <div>
                    <p class="text-xl font-bold text-white">{{ slotProps.data.guestName }}</p>
                    <p class="mt-1 text-sm text-slate-500">Reserva #{{ slotProps.data.id }}</p>
                  </div>
                </template>
              </Column>

              <Column header="HABITACION">
                <template #body="slotProps">
                  <div>
                    <p class="font-semibold text-slate-200">{{ slotProps.data.roomNumber }}</p>
                    <p class="text-sm text-slate-500">{{ slotProps.data.roomType }}</p>
                  </div>
                </template>
              </Column>

              <Column header="ESTANCIA">
                <template #body="slotProps">
                  <div>
                    <p class="font-semibold text-slate-200">{{ slotProps.data.stayLabel }}</p>
                    <p class="text-sm text-slate-500">Entrada {{ slotProps.data.checkIn || '--' }}</p>
                  </div>
                </template>
              </Column>

              <Column header="ESTADO">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.statusName" rounded :class="getStatusTagClass(slotProps.data.statusName)" />
                </template>
              </Column>

              <Column header="IMPORTE">
                <template #body="slotProps">
                  <span class="font-semibold text-slate-200">{{ slotProps.data.totalLabel }}</span>
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

    <Dialog v-model:visible="isDialogOpen" modal :style="{ width: 'min(92vw, 840px)' }" class="hotel-dialog" :header="dialogTitle">
      <div class="hotel-dialog-form grid gap-5 md:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Cliente</label>
          <Select v-model="form.clienteId" :options="clientOptions" option-label="label" option-value="value" placeholder="Selecciona cliente" class="hotel-select" fluid />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Habitacion</label>
          <Select v-model="form.habitacionId" :options="roomOptions" option-label="label" option-value="value" placeholder="Selecciona habitacion" class="hotel-select" fluid />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Fecha de entrada</label>
          <DatePicker
            v-model="checkInDate"
            input-id="reservation-checkin"
            date-format="dd/mm/yy"
            show-icon
            icon-display="input"
            show-button-bar
            class="hotel-datepicker"
            fluid
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Fecha de salida</label>
          <DatePicker
            v-model="checkOutDate"
            input-id="reservation-checkout"
            date-format="dd/mm/yy"
            show-icon
            icon-display="input"
            show-button-bar
            class="hotel-datepicker"
            fluid
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Estado de reserva</label>
          <Select v-model="form.estadoReservaId" :options="reservationStates" option-label="label" option-value="value" placeholder="Selecciona estado" class="hotel-select" fluid />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-300">Regimen</label>
          <Select v-model="form.regimenId" :options="regimens" option-label="label" option-value="value" placeholder="Selecciona regimen" class="hotel-select" fluid />
        </div>
      </div>

      <div v-if="saveError" class="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
        {{ saveError }}
      </div>

      <template #footer>
        <div class="hotel-dialog-actions flex w-full justify-end gap-3">
          <Button label="Cancelar" class="hotel-outline-button" @click="closeDialog" />
          <Button :label="isEditing ? 'Guardar cambios' : 'Crear reserva'" :loading="isSaving" class="hotel-primary-button" @click="submitForm" />
        </div>
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
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

import {
  buildReservationForm,
  createEmptyReservationForm,
  useReservationManagement,
  type ReservationFormValues,
} from '../composables/useReservationManagement'
import type { HotelReservation } from '../composables/useHotelData'

const {
  clientOptions,
  createReservation,
  deleteReservation,
  error,
  isLoading,
  isSaving,
  refresh,
  regimens,
  reservationStates,
  reservations,
  roomOptions,
  rooms,
  saveError,
  updateReservation,
} = useReservationManagement()

const search = ref('')
const selectedStatusId = ref<number | null>(null)
const selectedRoomId = ref<number | null>(null)
const isDialogOpen = ref(false)
const editingReservationId = ref<number | null>(null)
const form = reactive<ReservationFormValues>(createEmptyReservationForm())
const checkInDate = ref<Date | null>(null)
const checkOutDate = ref<Date | null>(null)

const isEditing = computed(() => editingReservationId.value !== null)
const dialogTitle = computed(() => (isEditing.value ? 'Editar reserva' : 'Nueva reserva'))

const summaryCards = computed(() => [
  {
    title: 'Reservas',
    value: `${reservations.value.length}`,
    description: 'Registros cargados desde /reserva',
    icon: 'pi pi-bookmark',
    badgeClass: 'bg-cyan-400/10 text-cyan-300',
  },
  {
    title: 'Habitaciones',
    value: `${rooms.value.length}`,
    description: 'Disponibles para asignacion',
    icon: 'pi pi-building',
    badgeClass: 'bg-blue-400/10 text-blue-300',
  },
  {
    title: 'Estados',
    value: `${reservationStates.value.length}`,
    description: 'Estados de reserva parametrizados',
    icon: 'pi pi-tags',
    badgeClass: 'bg-emerald-400/10 text-emerald-300',
  },
  {
    title: 'Regimenes',
    value: `${regimens.value.length}`,
    description: 'Configuraciones disponibles',
    icon: 'pi pi-sliders-h',
    badgeClass: 'bg-amber-400/10 text-amber-300',
  },
])

const statusFilterOptions = computed(() => [{ label: 'Todos los estados', value: null }, ...reservationStates.value])
const roomFilterOptions = computed(() => [{ label: 'Todas las habitaciones', value: null }, ...roomOptions.value])

const filteredReservations = computed(() => {
  const query = search.value.trim().toLowerCase()

  return reservations.value.filter((reservation) => {
    const matchesQuery =
      !query ||
      [reservation.guestName, reservation.roomNumber, reservation.roomType, reservation.statusName]
        .join(' ')
        .toLowerCase()
        .includes(query)

    const matchesStatus = selectedStatusId.value === null || reservation.statusId === selectedStatusId.value
    const matchesRoom = selectedRoomId.value === null || reservation.roomId === selectedRoomId.value

    return matchesQuery && matchesStatus && matchesRoom
  })
})

function resetForm(nextValues: ReservationFormValues = createEmptyReservationForm()) {
  form.id = nextValues.id
  form.clienteId = nextValues.clienteId
  form.habitacionId = nextValues.habitacionId
  form.fechaEntrada = nextValues.fechaEntrada
  form.fechaSalida = nextValues.fechaSalida
  form.estadoReservaId = nextValues.estadoReservaId
  form.regimenId = nextValues.regimenId
  checkInDate.value = parseApiDate(nextValues.fechaEntrada)
  checkOutDate.value = parseApiDate(nextValues.fechaSalida)
}

function openCreateDialog() {
  editingReservationId.value = null
  resetForm()
  isDialogOpen.value = true
}

function openEditDialog(reservation: HotelReservation) {
  editingReservationId.value = reservation.id
  resetForm(buildReservationForm(reservation))
  isDialogOpen.value = true
}

function closeDialog() {
  isDialogOpen.value = false
  editingReservationId.value = null
  resetForm()
}

async function submitForm() {
  if (!form.clienteId || !form.habitacionId || !form.fechaEntrada || !form.fechaSalida || !form.estadoReservaId) {
    return
  }

  const payload: ReservationFormValues = {
    id: editingReservationId.value ?? undefined,
    clienteId: form.clienteId,
    habitacionId: form.habitacionId,
    fechaEntrada: form.fechaEntrada,
    fechaSalida: form.fechaSalida,
    estadoReservaId: form.estadoReservaId,
    regimenId: form.regimenId,
  }

  try {
    if (isEditing.value) {
      await updateReservation(payload)
    } else {
      await createReservation(payload)
    }

    closeDialog()
  } catch {
    return
  }
}

async function handleDelete(reservationId: number) {
  if (!window.confirm('Se eliminara la reserva seleccionada. Deseas continuar?')) {
    return
  }

  try {
    await deleteReservation(reservationId)
  } catch {
    return
  }
}

function getStatusTagClass(statusName: string) {
  const normalizedStatus = statusName.toLowerCase()

  if (normalizedStatus.includes('confirm')) {
    return 'hotel-tag-success'
  }

  if (normalizedStatus.includes('check')) {
    return 'hotel-tag-info'
  }

  return 'hotel-tag-neutral'
}

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

watch(checkInDate, (value) => {
  form.fechaEntrada = formatApiDate(value)
})

watch(checkOutDate, (value) => {
  form.fechaSalida = formatApiDate(value)
})

onMounted(() => {
  refresh()
})
</script>