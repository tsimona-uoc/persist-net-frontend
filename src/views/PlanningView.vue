<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <h1 class="text-5xl font-bold tracking-tight text-white">Planning / Calendario</h1>
      <p class="mt-3 text-2xl font-medium text-slate-400">Vista combinada de reservas y estancias con prioridad operativa de estancia</p>
    </div>

    <Card class="hotel-card shrink-0 shadow-sm">
      <template #content>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap items-center gap-3">
            <Button icon="pi pi-angle-left" class="hotel-outline-button hotel-icon-button" @click="goToPreviousRange" />
            <Button label="Hoy" class="hotel-primary-button" @click="goToToday" />
            <Button icon="pi pi-angle-right" class="hotel-outline-button hotel-icon-button" @click="goToNextRange" />
            <div class="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
              {{ visibleRangeLabel }}
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-5 text-lg text-slate-400">
            <div v-for="legend in legends" :key="legend.label" class="flex items-center gap-3">
              <span :class="['h-5 w-5 rounded-md', legend.className]"></span>
              <span>{{ legend.label }}</span>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Card class="hotel-card hotel-fill-card min-h-0 flex-1 overflow-hidden shadow-sm">
      <template #content>
        <div class="h-full min-h-0 overflow-auto">
          <div v-if="error" class="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {{ error }}
          </div>

          <div v-else-if="isLoading" class="flex h-full items-center justify-center text-slate-400">
            Cargando planning desde la API...
          </div>

          <div v-else class="planning-grid min-w-[980px]">
            <div class="planning-room-header border-b border-r border-white/10 bg-slate-900 p-4 text-3xl font-bold text-white">
              Habitacion
            </div>

            <template v-for="day in days" :key="day.dayNumber">
              <div :class="['planning-day-header border-b border-r border-white/10 p-4 text-center', day.isToday ? 'planning-today-column' : 'bg-slate-900']">
                <p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{{ day.weekday }}</p>
                <p class="mt-1 text-3xl font-bold text-white">{{ day.dayNumber }}</p>
                <p class="mt-1 text-base text-slate-500">{{ day.monthLabel }}</p>
              </div>
            </template>

            <template v-for="room in rooms" :key="room.number">
              <div class="border-b border-r border-white/10 bg-slate-900 p-4">
                <p class="text-3xl font-bold text-white">{{ room.number }}</p>
                <p class="mt-1 text-xl text-slate-400">{{ room.typeName }}</p>
                <p :class="['mt-2 text-lg font-semibold capitalize', room.statusTone]">{{ room.statusName }}</p>
              </div>

              <div
                v-for="day in days"
                :key="`${room.id}-${day.dayKey}`"
                :class="['relative border-b border-r border-white/10 p-2', day.isToday ? 'planning-today-column' : 'bg-slate-950']"
              >
                <div
                  v-for="booking in getBookings(room.id, day.dayKey)"
                  :key="booking.id"
                  :class="['planning-booking', booking.className]"
                  :style="{ width: `${booking.span * 100}%` }"
                >
                  {{ booking.guest }}
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'

import { useStayManagement } from '../composables/useStayManagement'
import { parseDate, toDateKey } from '../lib/backend'

const PLANNING_RANGE_DAYS = 14
const TODAY_OFFSET = 3

const legends = [
  { label: 'Reserva', className: 'bg-emerald-500' },
  { label: 'Estancia en curso', className: 'bg-blue-500' },
  { label: 'Estancia cerrada', className: 'bg-slate-500' },
]

const { error, isLoading, refresh, reservations, rooms, stays } = useStayManagement()

const today = new Date()
today.setHours(0, 0, 0, 0)

const rangeStart = ref(createRangeStart(today))

const days = computed(() => {
  return Array.from({ length: PLANNING_RANGE_DAYS }, (_, index) => {
    const day = new Date(rangeStart.value)
    day.setDate(rangeStart.value.getDate() + index)

    return {
      dayKey: toDateKey(day),
      weekday: new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(day),
      dayNumber: day.getDate(),
      monthLabel: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(day),
      isToday: toDateKey(day) === toDateKey(today),
      date: day,
    }
  })
})

const visibleRangeLabel = computed(() => {
  const start = days.value[0]?.date
  const end = days.value.at(-1)?.date

  if (!start || !end) {
    return ''
  }

  const formatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  })

  return `${formatter.format(start)} - ${formatter.format(end)}`
})

function toInclusiveEnd(date: Date) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + 1)
  return nextDate
}

const planningBookings = computed(() => {
  const visibleStart = days.value[0]?.date
  const visibleEnd = days.value.at(-1)?.date

  if (!visibleStart || !visibleEnd) {
    return []
  }

  const visibleEndPlusOne = new Date(visibleEnd)
  visibleEndPlusOne.setDate(visibleEndPlusOne.getDate() + 1)

  const staysByReservationId = new Map(
    stays.value.filter((stay) => stay.reservationId !== null).map((stay) => [stay.reservationId as number, stay]),
  )

  const reservationBookings = reservations.value.flatMap((reservation) => {
    if (staysByReservationId.has(reservation.id)) {
      return []
    }

    const startDate = parseDate(reservation.checkIn)
    const endDate = parseDate(reservation.checkOut)
    const endDateInclusive = endDate ? toInclusiveEnd(endDate) : null

    if (!startDate || !endDateInclusive || reservation.roomId === null) {
      return []
    }

    if (endDateInclusive <= visibleStart || startDate >= visibleEndPlusOne) {
      return []
    }

    const visibleBookingStart = startDate < visibleStart ? visibleStart : startDate
    const visibleBookingEnd = endDateInclusive > visibleEndPlusOne ? visibleEndPlusOne : endDateInclusive
    const span = Math.max(
      1,
      Math.ceil((visibleBookingEnd.getTime() - visibleBookingStart.getTime()) / (1000 * 60 * 60 * 24)),
    )

    return [
      {
        id: `reservation-${reservation.id}`,
        roomId: reservation.roomId,
        guest: reservation.guestName,
        startKey: toDateKey(visibleBookingStart),
        span,
        className: 'bg-emerald-500',
      },
    ]
  })

  const stayBookings = stays.value.flatMap((stay) => {
    const startDate = parseDate(stay.checkIn)
    const reservationEndDate = stay.reservationId !== null ? parseDate(reservations.value.find((reservation) => reservation.id === stay.reservationId)?.checkOut ?? '') : null
    const rawEndDate = stay.checkOut ? parseDate(stay.checkOut) : reservationEndDate
    const endDate = rawEndDate ? toInclusiveEnd(rawEndDate) : visibleEndPlusOne

    if (!startDate || !endDate || stay.roomId === null) {
      return []
    }

    if (endDate <= visibleStart || startDate >= visibleEndPlusOne) {
      return []
    }

    const visibleBookingStart = startDate < visibleStart ? visibleStart : startDate
    const visibleBookingEnd = endDate > visibleEndPlusOne ? visibleEndPlusOne : endDate
    const span = Math.max(
      1,
      Math.ceil((visibleBookingEnd.getTime() - visibleBookingStart.getTime()) / (1000 * 60 * 60 * 24)),
    )
    const statusName = stay.statusName.toLowerCase()

    return [
      {
        id: `stay-${stay.id}`,
        roomId: stay.roomId,
        guest: stay.guestName,
        startKey: toDateKey(visibleBookingStart),
        span,
        className: statusName.includes('cerr') || statusName.includes('final') ? 'bg-slate-500' : statusName.includes('check') || statusName.includes('act') ? 'bg-blue-500' : 'bg-emerald-500',
      },
    ]
  })

  return [...reservationBookings, ...stayBookings]
})

function getBookings(roomId: number, dayKey: string) {
  return planningBookings.value.filter((booking) => booking.roomId === roomId && booking.startKey === dayKey)
}

function createRangeStart(baseDate: Date) {
  const nextStart = new Date(baseDate)
  nextStart.setHours(0, 0, 0, 0)
  nextStart.setDate(baseDate.getDate() - TODAY_OFFSET)
  return nextStart
}

function goToPreviousRange() {
  const nextStart = new Date(rangeStart.value)
  nextStart.setDate(nextStart.getDate() - PLANNING_RANGE_DAYS)
  rangeStart.value = nextStart
}

function goToNextRange() {
  const nextStart = new Date(rangeStart.value)
  nextStart.setDate(nextStart.getDate() + PLANNING_RANGE_DAYS)
  rangeStart.value = nextStart
}

function goToToday() {
  rangeStart.value = createRangeStart(today)
}

onMounted(() => {
  refresh()
})
</script>