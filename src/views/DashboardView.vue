<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <h1 class="text-5xl font-bold tracking-tight text-white">Dashboard</h1>
      <p class="mt-3 text-2xl font-medium text-slate-400">{{ todayLabel }}</p>
    </div>

    <div class="grid shrink-0 gap-5 xl:grid-cols-4 md:grid-cols-2">
      <Card v-for="card in summaryCards" :key="card.title" class="hotel-card shadow-sm">
        <template #content>
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xl font-semibold text-slate-300">{{ card.title }}</p>
              <p class="mt-6 text-5xl font-bold tracking-tight text-white">{{ card.value }}</p>
              <p class="mt-3 text-xl text-slate-400">{{ card.description }}</p>
            </div>
            <div :class="['flex h-14 w-14 items-center justify-center rounded-2xl text-xl', card.badgeClass]">
              <i :class="card.icon"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <div class="grid min-h-0 flex-1 gap-6 overflow-y-auto pr-1 xl:grid-cols-2">
      <Card class="hotel-card hotel-panel shadow-sm">
        <template #title>
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 text-emerald-600">
              <i class="pi pi-sign-in text-xl"></i>
              <span class="text-3xl font-bold text-white">Check-in de Hoy</span>
            </div>
            <RouterLink to="/estancias" class="text-lg font-semibold text-cyan-300 hover:text-cyan-200">Ver Estancias <i class="pi pi-arrow-right"></i></RouterLink>
          </div>
        </template>
        <template #content>
          <div v-if="error" class="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {{ error }}
          </div>

          <div v-else-if="isLoading" class="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-10 text-center text-slate-400">
            Cargando llegadas desde la API...
          </div>

          <div v-else-if="checkInsToday.length === 0" class="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-10 text-center text-slate-400">
            No hay check-ins registrados para hoy.
          </div>

          <div v-else class="space-y-4">
            <article
              v-for="stay in checkInsToday"
              :key="stay.id"
              class="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-5"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 class="text-2xl font-bold text-white">{{ stay.guestName }}</h3>
                  <p class="mt-1 text-xl text-slate-400">Habitacion {{ stay.roomNumber }} · {{ stay.roomType }}</p>
                  <p class="mt-4 text-xl text-slate-400">Estancia {{ stay.stayPeriodLabel }}</p>
                  <p class="mt-3 text-lg italic text-slate-500">{{ stay.reservationLabel }}</p>
                </div>
                <Tag severity="success" :value="stay.statusName" rounded class="hotel-tag-success" />
              </div>
            </article>
          </div>
        </template>
      </Card>

      <Card class="hotel-card hotel-panel shadow-sm">
        <template #title>
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 text-orange-500">
              <i class="pi pi-sign-out text-xl"></i>
              <span class="text-3xl font-bold text-white">Check-out de Hoy</span>
            </div>
            <RouterLink to="/facturacion" class="text-lg font-semibold text-cyan-300 hover:text-cyan-200">Ver Facturacion <i class="pi pi-arrow-right"></i></RouterLink>
          </div>
        </template>
        <template #content>
          <div v-if="error" class="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {{ error }}
          </div>

          <div v-else-if="isLoading" class="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-10 text-center text-slate-400">
            Cargando salidas desde la API...
          </div>

          <div v-else-if="checkOutsToday.length === 0" class="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-10 text-center text-slate-400">
            No hay check-outs registrados para hoy.
          </div>

          <div v-else class="space-y-4">
            <article
              v-for="stay in checkOutsToday"
              :key="stay.id"
              class="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-5"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 class="text-2xl font-bold text-white">{{ stay.guestName }}</h3>
                  <p class="mt-1 text-xl text-slate-400">Habitacion {{ stay.roomNumber }} · {{ stay.roomType }}</p>
                  <p class="mt-4 text-xl text-slate-400">Estancia {{ stay.stayPeriodLabel }}</p>
                  <p class="mt-3 text-lg italic text-slate-500">{{ stay.reservationLabel }}</p>
                </div>
                <Tag severity="info" :value="stay.statusName" rounded class="hotel-tag-info" />
              </div>
            </article>
          </div>
        </template>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { RouterLink } from 'vue-router'

import { useHotelData } from '../composables/useHotelData'
import { useStayManagement } from '../composables/useStayManagement'

const { noShowsToday, refresh: refreshReservations } = useHotelData()
const { checkInsToday, checkOutsToday, error, isLoading, occupiedRoomsCount, refresh, rooms, todayLabel } = useStayManagement()

const summaryCards = computed(() => [
  {
    title: 'Ocupacion',
    value: `${occupiedRoomsCount.value} / ${rooms.value.length || 0}`,
    description: 'Habitaciones con estancia activa hoy',
    icon: 'pi pi-chart-bar',
    badgeClass: 'bg-blue-50 text-blue-500',
  },
  {
    title: 'Check-in Hoy',
    value: `${checkInsToday.value.length}`,
    description: 'Estancias con entrada real hoy',
    icon: 'pi pi-sign-in',
    badgeClass: 'bg-emerald-50 text-emerald-500',
  },
  {
    title: 'Check-out Hoy',
    value: `${checkOutsToday.value.length}`,
    description: 'Estancias con salida real hoy',
    icon: 'pi pi-sign-out',
    badgeClass: 'bg-orange-50 text-orange-500',
  },
  {
    title: 'No-Shows',
    value: `${noShowsToday.value.length}`,
    description: 'Reservas marcadas como no-show',
    icon: 'pi pi-times-circle',
    badgeClass: 'bg-rose-50 text-rose-500',
  },
])

onMounted(() => {
  refresh()
  refreshReservations()
})
</script>