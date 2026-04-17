<template>
  <section class="flex h-full min-h-0 flex-col gap-6 text-slate-100">
    <div class="shrink-0 flex items-end justify-between rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-sm">
      <div>
        <h1 class="text-4xl font-bold tracking-tight text-white">Cuenta de la Estancia</h1>
        <div class="mt-3 flex items-center gap-3">
          <p class="text-xl font-medium text-slate-300">{{ clientName || 'Cargando huésped...' }}</p>
          <span v-if="clientVip" class="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-bold text-amber-300 ring-1 ring-amber-500/50">
            <i class="pi pi-star-fill mr-1 text-xs"></i> Cliente VIP
          </span>
        </div>
      </div>
      <div class="text-right">
        <p class="text-lg font-medium text-slate-400">Saldo Pendiente</p>
        <p class="text-5xl font-bold tracking-tight transition-colors" :class="saldoPendiente > 0 ? 'text-rose-400' : 'text-emerald-400'">
          {{ formatCurrency(saldoPendiente) }}
        </p>
        <Button 
          v-if="isPaid && totalCargos > 0" 
          label="Realizar Check-out" 
          icon="pi pi-check-circle" 
          class="hotel-success-button mt-4 w-full" 
          @click="handleCheckout"
        />
      </div>
    </div>

    <div class="grid min-h-0 flex-1 gap-6 overflow-y-auto pr-1 xl:grid-cols-2">
      
      <Card class="hotel-card shadow-sm flex flex-col min-h-[500px]">
        <template #title>
          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <i class="pi pi-shopping-cart text-2xl text-cyan-300"></i>
              <span class="text-2xl font-bold text-white">Cargos y Consumos</span>
            </div>
            <span class="text-2xl font-bold text-white">{{ formatCurrency(totalCargos) }}</span>
          </div>
        </template>
        <template #content>
          <div class="flex-1 overflow-y-auto">
            <DataTable :value="lines" class="hotel-datatable" responsive-layout="scroll">
              <template #empty>
                <div class="p-4 text-center text-slate-400">No hay cargos registrados en esta cuenta.</div>
              </template>
              <Column field="fecha" header="Fecha">
                <template #body="{ data }">{{ formatShortDate(data.fecha) }}</template>
              </Column>
              <Column field="concepto" header="Concepto" />
              <Column field="monto" header="Importe" class="text-right font-medium">
                <template #body="{ data }">
                  <span :class="data.monto < 0 ? 'text-emerald-400' : ''">{{ formatCurrency(data.monto) }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
          <div class="mt-6 flex gap-3 border-t border-white/10 pt-6">
            <Button label="Añadir Cargo" icon="pi pi-plus" class="flex-1" @click="showChargeDialog = true" />
            <Button 
              v-if="clientVip && totalCargos > 0" 
              label="Aplicar 10% Dto VIP" 
              icon="pi pi-star" 
              severity="warn"
              outlined
              @click="applyVipDiscount" 
            />
          </div>
        </template>
      </Card>

      <Card class="hotel-card shadow-sm flex flex-col min-h-[500px]">
        <template #title>
          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <i class="pi pi-wallet text-2xl text-emerald-400"></i>
              <span class="text-2xl font-bold text-white">Pagos Realizados</span>
            </div>
            <span class="text-2xl font-bold text-emerald-400">{{ formatCurrency(totalPagos) }}</span>
          </div>
        </template>
        <template #content>
          <div class="flex-1 overflow-y-auto">
            <DataTable :value="payments" class="hotel-datatable" responsive-layout="scroll">
              <template #empty>
                <div class="p-4 text-center text-slate-400">Aún no se han recibido pagos.</div>
              </template>
              <Column field="fecha" header="Fecha">
                <template #body="{ data }">{{ formatShortDate(data.fecha) }}</template>
              </Column>
              <Column field="metodoNombre" header="Método" />
              <Column field="monto" header="Importe" class="text-right font-medium text-emerald-400">
                <template #body="{ data }">{{ formatCurrency(data.monto) }}</template>
              </Column>
            </DataTable>
          </div>
          <div class="mt-6 flex border-t border-white/10 pt-6">
            <Button 
              label="Registrar Pago" 
              icon="pi pi-money-bill" 
              class="hotel-success-button w-full" 
              :disabled="saldoPendiente <= 0"
              @click="openPaymentDialog" 
            />
          </div>
        </template>
      </Card>
    </div>

    <Dialog v-model:visible="showChargeDialog" modal header="Añadir Consumo / Cargo" :style="{ width: '400px' }" class="hotel-dialog">
      <div class="flex flex-col gap-4 py-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-300">Servicio Extra (Opcional)</label>
          <Select 
            v-model="selectedService" 
            :options="extraServices" 
            optionLabel="name" 
            placeholder="Selecciona un servicio" 
            class="w-full"
            @change="onServiceSelect"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-300">Concepto Manual</label>
          <InputText v-model="newCharge.concepto" placeholder="Ej: Minibar - Coca Cola" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-300">Importe (€)</label>
          <InputNumber v-model="newCharge.monto" mode="currency" currency="EUR" locale="es-ES" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" outlined severity="secondary" @click="showChargeDialog = false" />
        <Button label="Añadir Cargo" @click="submitCharge" :disabled="!newCharge.concepto || newCharge.monto === 0" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showPaymentDialog" modal header="Registrar Pago" :style="{ width: '400px' }" class="hotel-dialog">
      <div class="flex flex-col gap-4 py-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-300">Método de Pago</label>
          <Select 
            v-model="newPayment.metodoId" 
            :options="paymentMethods" 
            optionLabel="name" 
            optionValue="id"
            placeholder="Selecciona método" 
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-300">Importe a Pagar (€)</label>
          <InputNumber v-model="newPayment.monto" mode="currency" currency="EUR" locale="es-ES" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" outlined severity="secondary" @click="showPaymentDialog = false" />
        <Button label="Registrar Pago" class="hotel-success-button" @click="submitPayment" :disabled="!newPayment.metodoId || newPayment.monto <= 0" />
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'

import { formatCurrency, formatShortDate } from '../lib/backend'
import { useStayFolio, type ExtraServiceOption } from '../composables/useStayFolio'

const route = useRoute()
const router = useRouter()
const stayId = Number(route.params.id) 

const {
  clientName, clientVip, lines, payments, totalCargos, totalPagos, saldoPendiente, isPaid,
  extraServices, paymentMethods, loadFolio, addCharge, addPayment
} = useStayFolio()

const showChargeDialog = ref(false)
const showPaymentDialog = ref(false)

const selectedService = ref<ExtraServiceOption | null>(null)
const newCharge = ref({ concepto: '', monto: 0 })
const newPayment = ref({ metodoId: null as number | null, monto: 0 })

onMounted(() => {
  if (stayId) {
    loadFolio(stayId)
  }
})

function onServiceSelect() {
  if (selectedService.value) {
    newCharge.value.concepto = selectedService.value.name
    newCharge.value.monto = selectedService.value.price
  }
}

async function submitCharge() {
  await addCharge(newCharge.value.concepto, newCharge.value.monto)
  showChargeDialog.value = false
  newCharge.value = { concepto: '', monto: 0 }
  selectedService.value = null
}

async function applyVipDiscount() {
  const discountAmount = totalCargos.value * 0.10
  await addCharge('Descuento de Fidelidad VIP (10%)', -discountAmount)
}

function openPaymentDialog() {
  newPayment.value.monto = saldoPendiente.value
  showPaymentDialog.value = true
}

async function submitPayment() {
  if (newPayment.value.metodoId) {
    await addPayment(newPayment.value.metodoId, newPayment.value.monto)
    showPaymentDialog.value = false
    newPayment.value = { metodoId: null, monto: 0 }
  }
}

async function handleCheckout() {
  if (confirm('¿Estás seguro de que deseas liquidar esta cuenta y realizar el check-out?')) {
    
    alert('Check-out realizado con éxito.')
    router.push('/estancias')
  }
}
</script>