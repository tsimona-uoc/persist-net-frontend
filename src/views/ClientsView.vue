<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <h1 class="text-5xl font-bold tracking-tight text-white">Clientes</h1>
      <p class="mt-3 text-2xl font-medium text-slate-400">Gestion de clientes del hotel</p>
    </div>

    <Card class="hotel-card shrink-0 shadow-sm">
      <template #content>
        <IconField class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="search"
            fluid
            placeholder="Buscar por nombre, apellidos, email o DNI..."
            class="hotel-search-input"
          />
        </IconField>
      </template>
    </Card>

    <Card class="hotel-card hotel-fill-card min-h-0 flex-1 overflow-hidden shadow-sm">
      <template #content>
        <div class="flex h-full min-h-0 flex-col gap-4">
          <div v-if="error" class="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {{ error }}
          </div>

          <div class="h-full min-h-0 overflow-auto">
            <DataTable :value="filteredClients" :loading="isLoading" class="hotel-datatable" responsive-layout="scroll">
              <template #empty>
                <div class="px-6 py-12 text-center text-base text-slate-400">
                  {{ isLoading ? 'Cargando clientes...' : 'No hay clientes disponibles en la API.' }}
                </div>
              </template>

              <Column header="CLIENTE">
                <template #body="slotProps">
                  <div class="flex items-center gap-4 py-2">
                    <Avatar icon="pi pi-user" shape="circle" size="large" class="hotel-avatar" />
                    <div>
                      <p class="text-2xl font-bold text-white">{{ slotProps.data.name }}</p>
                      <p class="mt-1 text-lg text-slate-500">ID: {{ slotProps.data.id }}</p>
                    </div>
                  </div>
                </template>
              </Column>
              <Column field="email" header="EMAIL">
                <template #body="slotProps">
                  <div class="flex items-center gap-3 text-xl text-slate-300">
                    <i class="pi pi-envelope"></i>
                    <span>{{ slotProps.data.email }}</span>
                  </div>
                </template>
              </Column>
              <Column field="phone" header="TELEFONO">
                <template #body="slotProps">
                  <div class="flex items-center gap-3 text-xl text-slate-300">
                    <i class="pi pi-phone"></i>
                    <span>{{ slotProps.data.phone }}</span>
                  </div>
                </template>
              </Column>
              <Column field="dni" header="DNI" />
              <Column field="city" header="CIUDAD" />
              <Column header="DIRECCION">
                <template #body="slotProps">
                  <span class="text-slate-400">{{ slotProps.data.address || 'Sin direccion' }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </template>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Avatar from 'primevue/avatar'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'

import { useHotelData } from '../composables/useHotelData'

const search = ref('')
const { clients, error, isLoading, refresh } = useHotelData()

const filteredClients = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return clients.value
  }

  return clients.value.filter((client) => {
    return [client.name, client.email, client.phone, client.dni, client.city, client.address].some((value) =>
      value.toLowerCase().includes(query),
    )
  })
})

onMounted(() => {
  refresh()
})
</script>