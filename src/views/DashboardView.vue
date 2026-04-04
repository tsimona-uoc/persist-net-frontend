<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <h1 class="text-5xl font-bold tracking-tight text-white">Dashboard</h1>
      <p class="mt-3 text-2xl font-medium text-slate-400">Lunes, 9 de Marzo de 2026</p>
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
              <span class="text-3xl font-bold text-white">Llegadas de Hoy</span>
            </div>
            <RouterLink to="/planning" class="text-lg font-semibold text-cyan-300 hover:text-cyan-200">Ver Planning <i class="pi pi-arrow-right"></i></RouterLink>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <article
              v-for="arrival in arrivals"
              :key="arrival.guest"
              class="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-5"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 class="text-2xl font-bold text-white">{{ arrival.guest }}</h3>
                  <p class="mt-1 text-xl text-slate-400">Habitacion {{ arrival.room }} · {{ arrival.type }}</p>
                  <p class="mt-4 text-xl text-slate-400">{{ arrival.guests }} huesped(es) · {{ arrival.price }}/noche</p>
                  <p v-if="arrival.note" class="mt-3 text-lg italic text-slate-500">{{ arrival.note }}</p>
                </div>
                <Tag severity="success" :value="arrival.status" rounded class="hotel-tag-success" />
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
              <span class="text-3xl font-bold text-white">Salidas de Hoy</span>
            </div>
            <RouterLink to="/facturacion" class="text-lg font-semibold text-cyan-300 hover:text-cyan-200">Ver Facturacion <i class="pi pi-arrow-right"></i></RouterLink>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <article
              v-for="departure in departures"
              :key="departure.guest"
              class="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-5"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 class="text-2xl font-bold text-white">{{ departure.guest }}</h3>
                  <p class="mt-1 text-xl text-slate-400">Habitacion {{ departure.room }} · {{ departure.type }}</p>
                  <p class="mt-4 text-xl text-slate-400">{{ departure.guests }} huesped(es) · {{ departure.price }}/noche</p>
                </div>
                <Tag severity="info" :value="departure.status" rounded class="hotel-tag-info" />
              </div>
            </article>
          </div>
        </template>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { RouterLink } from 'vue-router'

const summaryCards = [
  {
    title: 'Ocupacion',
    value: '4 / 12',
    description: 'Habitaciones ocupadas',
    icon: 'pi pi-chart-bar',
    badgeClass: 'bg-blue-50 text-blue-500',
  },
  {
    title: 'Llegadas Hoy',
    value: '2',
    description: 'Reservas pendientes',
    icon: 'pi pi-sign-in',
    badgeClass: 'bg-emerald-50 text-emerald-500',
  },
  {
    title: 'Salidas Hoy',
    value: '1',
    description: 'Check-outs pendientes',
    icon: 'pi pi-sign-out',
    badgeClass: 'bg-orange-50 text-orange-500',
  },
  {
    title: 'No-Shows',
    value: '1',
    description: 'Sin presentarse',
    icon: 'pi pi-times-circle',
    badgeClass: 'bg-rose-50 text-rose-500',
  },
]

const arrivals = [
  {
    guest: 'Pedro Martinez Ruiz',
    room: '202',
    type: 'doble',
    guests: '2',
    price: 'EUR95',
    status: 'Confirmada',
    note: 'Familia con ninos',
  },
  {
    guest: 'Ana Lopez Perez',
    room: '203',
    type: 'familiar',
    guests: '4',
    price: 'EUR140',
    status: 'Confirmada',
    note: 'Check-in previsto a las 17:00',
  },
]

const departures = [
  {
    guest: 'Juan Garcia Lopez',
    room: '101',
    type: 'individual',
    guests: '1',
    price: 'EUR75',
    status: 'Check-in',
  },
]
</script>