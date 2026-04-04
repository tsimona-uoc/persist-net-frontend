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
        <div class="h-full min-h-0 overflow-auto">
        <DataTable :value="filteredClients" class="hotel-datatable" responsive-layout="scroll">
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
          <Column header="ACCIONES">
            <template #body>
              <Button label="Ver Ficha" class="hotel-primary-button hotel-small-button" />
            </template>
          </Column>
        </DataTable>
        </div>
      </template>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'

const search = ref('')

const clients = [
  { id: 1, name: 'Juan Garcia Lopez', email: 'juan.garcia@email.com', phone: '+34 612 345 678', dni: '12345678A', city: 'Madrid' },
  { id: 2, name: 'Maria Fernandez Silva', email: 'maria.fernandez@email.com', phone: '+34 623 456 789', dni: '23456789B', city: 'Barcelona' },
  { id: 3, name: 'Pedro Martinez Ruiz', email: 'pedro.martinez@email.com', phone: '+34 634 567 890', dni: '34567890C', city: 'Valencia' },
  { id: 4, name: 'Ana Lopez Perez', email: 'ana.lopez@email.com', phone: '+34 645 678 901', dni: '45678901D', city: 'Sevilla' },
  { id: 5, name: 'Carlos Sanchez Moreno', email: 'carlos.sanchez@email.com', phone: '+34 656 789 012', dni: '56789012E', city: 'Bilbao' },
]

const filteredClients = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return clients
  }

  return clients.filter((client) => {
    return [client.name, client.email, client.phone, client.dni, client.city].some((value) =>
      value.toLowerCase().includes(query),
    )
  })
})
</script>