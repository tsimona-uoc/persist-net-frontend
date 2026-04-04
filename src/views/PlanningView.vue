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
          <div class="planning-grid min-w-[980px]">
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
                <p class="mt-1 text-xl text-slate-400">{{ room.type }}</p>
                <p :class="['mt-2 text-lg font-semibold capitalize', room.statusClass]">{{ room.status }}</p>
              </div>

              <div
                v-for="day in days"
                :key="`${room.number}-${day.dayNumber}`"
                :class="['relative border-b border-r border-white/10 p-2', day.isToday ? 'planning-today-column' : 'bg-slate-950']"
              >
                <div
                  v-for="booking in getBookings(room.number, day.dayNumber)"
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
import Button from 'primevue/button'
import Card from 'primevue/card'

const legends = [
  { label: 'Confirmada', className: 'bg-emerald-500' },
  { label: 'Check-in', className: 'bg-blue-500' },
  { label: 'No-Show', className: 'bg-rose-500' },
]

const days = [
  { weekday: 'Vie', dayNumber: 6, isToday: false },
  { weekday: 'Sab', dayNumber: 7, isToday: false },
  { weekday: 'Dom', dayNumber: 8, isToday: false },
  { weekday: 'Lun', dayNumber: 9, isToday: true },
  { weekday: 'Mar', dayNumber: 10, isToday: false },
  { weekday: 'Mie', dayNumber: 11, isToday: false },
  { weekday: 'Jue', dayNumber: 12, isToday: false },
  { weekday: 'Vie', dayNumber: 13, isToday: false },
  { weekday: 'Sab', dayNumber: 14, isToday: false },
  { weekday: 'Dom', dayNumber: 15, isToday: false },
  { weekday: 'Lun', dayNumber: 16, isToday: false },
  { weekday: 'Mar', dayNumber: 17, isToday: false },
  { weekday: 'Mie', dayNumber: 18, isToday: false },
  { weekday: 'Jue', dayNumber: 19, isToday: false },
]

const rooms = [
  { number: '101', type: 'Individual', status: 'ocupada', statusClass: 'text-blue-500' },
  { number: '102', type: 'Doble', status: 'disponible', statusClass: 'text-emerald-500' },
  { number: '103', type: 'Doble', status: 'ocupada', statusClass: 'text-blue-500' },
  { number: '104', type: 'Suite', status: 'limpieza', statusClass: 'text-amber-500' },
]

const bookings = [
  { id: 'b1', room: '101', startDay: 6, guest: 'Juan Garcia Lopez', span: 3, className: 'bg-blue-500' },
  { id: 'b2', room: '103', startDay: 8, guest: 'Maria Fernandez Silva', span: 4, className: 'bg-blue-500' },
  { id: 'b3', room: '104', startDay: 9, guest: 'Carlos...', span: 1, className: 'bg-rose-500' },
]

function getBookings(roomNumber: string, dayNumber: number) {
  return bookings.filter((booking) => booking.room === roomNumber && booking.startDay === dayNumber)
}
</script>