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
            <span class="text-3xl font-bold text-white">Facturas registradas</span>
          </template>
          <template #content>
            <div v-if="error" class="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {{ error }}
            </div>

            <div v-else-if="isLoading" class="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-10 text-center text-slate-400">
              Cargando facturas...
            </div>

            <div v-else-if="invoices.length === 0" class="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-10 text-center text-slate-400">
              No hay facturas disponibles en backend.
            </div>

            <div v-else class="space-y-4">
              <button
                v-for="invoice in invoices"
                :key="invoice.id"
                type="button"
                class="w-full rounded-3xl border px-5 py-5 text-left transition"
                :class="selectedInvoice?.id === invoice.id ? 'border-cyan-400 bg-cyan-400/10 shadow-sm' : 'border-white/10 bg-slate-900/70 hover:border-cyan-500/50'"
                @click="selectedInvoiceId = invoice.id"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-2xl font-bold text-white">{{ invoice.clientName }}</p>
                    <p class="mt-1 text-xl text-slate-300">Hab. {{ invoice.roomNumber }}</p>
                    <p class="mt-4 text-lg text-slate-400">Factura #{{ invoice.id }} · {{ invoice.totalLabel }}</p>
                  </div>
                  <i v-if="selectedInvoice?.id === invoice.id" class="pi pi-check text-2xl text-cyan-300"></i>
                </div>
              </button>
            </div>
          </template>
        </Card>

        <Card class="hotel-card shadow-sm">
          <template #title>
            <span class="text-3xl font-bold text-white">Metodos de pago</span>
          </template>
          <template #content>
            <div class="grid gap-4 sm:grid-cols-2">
              <button
                v-for="method in paymentMethods"
                :key="method.id"
                type="button"
                class="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4 text-left transition hover:border-cyan-500/50"
              >
                <div>
                  <p class="text-xl font-semibold text-white">{{ method.name }}</p>
                  <p class="mt-1 text-lg text-slate-400">{{ method.description }}</p>
                </div>
                <i class="pi pi-wallet text-slate-500"></i>
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
              <span class="text-3xl font-bold text-white">Pagos de factura</span>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-white">{{ selectedInvoice?.clientName ?? 'Sin factura' }}</p>
              <p class="mt-1 text-xl text-slate-400">Factura #{{ selectedInvoice?.id ?? '--' }} · Habitacion {{ selectedInvoice?.roomNumber ?? '---' }}</p>
            </div>
          </div>
        </template>
        <template #content>
          <DataTable :value="selectedInvoicePayments" :loading="isLoading" class="hotel-datatable hotel-billing-table" responsive-layout="scroll">
            <template #empty>
              <div class="px-6 py-12 text-center text-base text-slate-400">
                {{ selectedInvoice ? 'No hay pagos registrados para esta factura.' : 'Selecciona una factura para ver sus pagos.' }}
              </div>
            </template>
            <Column field="paymentDate" header="FECHA" />
            <Column field="methodName" header="METODO" />
            <Column field="amountLabel" header="IMPORTE" />
          </DataTable>

          <div class="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
            <span class="text-3xl font-bold text-white">TOTAL</span>
            <span class="text-5xl font-bold tracking-tight text-white">{{ selectedInvoice?.totalLabel ?? '0,00 €' }}</span>
          </div>

          <div class="mt-6 flex flex-col gap-4 sm:flex-row">
            <Button label="Actualizar datos" class="hotel-success-button flex-1" @click="refresh" />
            <Button label="Imprimir" outlined class="hotel-outline-button sm:w-44" disabled />
          </div>
        </template>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'

import { useBillingData } from '../composables/useBillingData'

const { error, invoices, isLoading, paymentMethods, payments, refresh } = useBillingData()
const selectedInvoiceId = ref<number | null>(null)

const selectedInvoice = computed(() => {
  return invoices.value.find((invoice) => invoice.id === selectedInvoiceId.value) ?? null
})

const selectedInvoicePayments = computed(() => {
  if (!selectedInvoice.value) {
    return []
  }

  return payments.value.filter((payment) => payment.invoiceId === selectedInvoice.value?.id)
})

watch(
  invoices,
  (nextInvoices) => {
    if (nextInvoices.length === 0) {
      selectedInvoiceId.value = null
      return
    }

    if (!nextInvoices.some((invoice) => invoice.id === selectedInvoiceId.value)) {
      selectedInvoiceId.value = nextInvoices[0].id
    }
  },
  { immediate: true },
)

onMounted(() => {
  refresh()
})
</script>