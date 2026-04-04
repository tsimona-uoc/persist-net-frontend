<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <h1 class="text-5xl font-bold tracking-tight text-white">Planning / Calendario</h1>
      <p class="mt-3 text-2xl font-medium text-slate-400">Vista interactiva de ocupacion tipo Gantt</p>
    </div>

    <Card class="hotel-card shrink-0 shadow-sm">
      <template #content>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-3">
            <Button icon="pi pi-angle-left" text rounded severity="secondary" />
            <Button label="Hoy" class="hotel-primary-button" />
            <Button icon="pi pi-angle-right" text rounded severity="secondary" />
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
                <p class="mt-1 text-base text-slate-500">mar</p>
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
import { computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'

import { parseDate, toDateKey } from '../lib/backend'
import { useHotelData } from '../composables/useHotelData'

const legends = [
  { label: 'Confirmada', className: 'bg-emerald-500' },
  { label: 'Check-in', className: 'bg-blue-500' },
  { label: 'No-Show', className: 'bg-rose-500' },
]

const { error, isLoading, reservations, rooms, refresh } = useHotelData()

const today = new Date()
today.setHours(0, 0, 0, 0)

const days = computed(() => {
  return Array.from({ length: 14 }, (_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - 3 + index)

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

const planningBookings = computed(() => {
  const visibleStart = days.value[0]?.date
  const visibleEnd = days.value.at(-1)?.date

  if (!visibleStart || !visibleEnd) {
    return []
  }

  const visibleEndPlusOne = new Date(visibleEnd)
  visibleEndPlusOne.setDate(visibleEndPlusOne.getDate() + 1)

  return reservations.value.flatMap((reservation) => {
    const startDate = parseDate(reservation.checkIn)
    const endDate = parseDate(reservation.checkOut)

    if (!startDate || !endDate || reservation.roomId === null) {
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
    const statusName = reservation.statusName.toLowerCase()

    return [
      {
        id: reservation.id,
        roomId: reservation.roomId,
        guest: reservation.guestName,
        startKey: toDateKey(visibleBookingStart),
        span,
        className: statusName.includes('no-show') ? 'bg-rose-500' : statusName.includes('check') ? 'bg-blue-500' : 'bg-emerald-500',
      },
    ]
  })
})

function getBookings(roomId: number, dayKey: string) {
  return planningBookings.value.filter((booking) => booking.roomId === roomId && booking.startKey === dayKey)
}

onMounted(() => {
  refresh()
})
</script>