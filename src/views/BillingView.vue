<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <h1 class="text-5xl font-bold tracking-tight text-white">Facturacion / TPV</h1>
      <p class="mt-3 text-2xl font-medium text-slate-400">Gestion de cargos y consumos</p>
    </div>

    <div class="grid min-h-0 flex-1 gap-6 overflow-y-auto pr-1 xl:grid-cols-[0.34fr_0.66fr]">
      <div class="space-y-6">
        <Card class="hotel-card shadow-sm">
          <template #title>
            <span class="text-3xl font-bold text-white">Reservas Activas</span>
          </template>
          <template #content>
            <div class="space-y-4">
              <button
                v-for="reservation in reservations"
                :key="reservation.guest"
                type="button"
                class="w-full rounded-3xl border px-5 py-5 text-left transition"
                :class="selectedReservation.guest === reservation.guest ? 'border-cyan-400 bg-cyan-400/10 shadow-sm' : 'border-white/10 bg-slate-900/70 hover:border-cyan-500/50'"
                @click="selectedReservation = reservation"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-2xl font-bold text-white">{{ reservation.guest }}</p>
                    <p class="mt-1 text-xl text-slate-300">Hab. {{ reservation.room }}</p>
                    <p class="mt-4 text-lg text-slate-400">{{ reservation.guests }} huesped(es)</p>
                  </div>
                  <i v-if="selectedReservation.guest === reservation.guest" class="pi pi-check text-2xl text-cyan-300"></i>
                </div>
              </button>
            </div>
          </template>
        </Card>

        <Card class="hotel-card shadow-sm">
          <template #title>
            <span class="text-3xl font-bold text-white">Consumos Rapidos</span>
          </template>
          <template #content>
            <div class="grid gap-4 sm:grid-cols-2">
              <button
                v-for="item in consumptions"
                :key="item.name"
                type="button"
                class="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4 text-left transition hover:border-cyan-500/50"
              >
                <div>
                  <p class="text-xl font-semibold text-white">{{ item.name }}</p>
                  <p class="mt-1 text-lg text-slate-400">{{ item.price }}</p>
                </div>
                <i class="pi pi-plus text-slate-500"></i>
              </button>
            </div>
          </template>
        </Card>
      </div>

      <Card class="hotel-card shadow-sm">
        <template #title>
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <i class="pi pi-credit-card text-2xl text-cyan-300"></i>
              <span class="text-3xl font-bold text-white">Factura</span>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-white">{{ selectedReservation.guest }}</p>
              <p class="mt-1 text-xl text-slate-400">Habitacion {{ selectedReservation.room }}</p>
            </div>
          </div>
        </template>
        <template #content>
          <DataTable :value="invoiceItems" class="hotel-datatable hotel-billing-table" responsive-layout="scroll">
            <Column field="concept" header="CONCEPTO" />
            <Column field="quantity" header="CANTIDAD" />
            <Column field="price" header="PRECIO UNIT." />
            <Column field="total" header="TOTAL" />
            <Column header="ACCION">
              <template #body>
                <Button icon="pi pi-trash" text severity="danger" rounded aria-label="Eliminar" />
              </template>
            </Column>
          </DataTable>

          <div class="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
            <span class="text-3xl font-bold text-white">TOTAL</span>
            <span class="text-5xl font-bold tracking-tight text-white">{{ invoiceTotal }} &euro;</span>
          </div>

          <div class="mt-6 flex flex-col gap-4 sm:flex-row">
            <Button label="Confirmar Cobro" class="hotel-success-button flex-1" />
            <Button label="Imprimir" outlined class="hotel-outline-button sm:w-44" />
          </div>
        </template>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'

const reservations = [
  { guest: 'Juan Garcia Lopez', room: '101', guests: 1 },
  { guest: 'Maria Fernandez Silva', room: '103', guests: 2 },
]

const consumptions = [
  { name: 'Desayuno', price: 'EUR12.00' },
  { name: 'Minibar', price: 'EUR8.00' },
  { name: 'Parking', price: 'EUR15.00' },
  { name: 'Lavanderia', price: 'EUR10.00' },
]

const selectedReservation = ref(reservations[0])

const invoiceItems = [
  { concept: 'Alojamiento', quantity: 3, price: 'EUR75.00', total: 'EUR225.00' },
  { concept: 'Desayuno', quantity: 3, price: 'EUR12.00', total: 'EUR36.00' },
  { concept: 'Minibar', quantity: 2, price: 'EUR8.00', total: 'EUR16.00' },
]

const invoiceTotal = computed(() => '277.00')
</script>