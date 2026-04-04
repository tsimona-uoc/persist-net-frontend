<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 class="text-5xl font-bold tracking-tight text-white">Opciones del sistema</h1>
          <p class="mt-3 text-2xl font-medium text-slate-400">Consulta de parametros y catalogos configurados en backend</p>
        </div>

        <Button label="Recargar catalogos" icon="pi pi-refresh" class="hotel-outline-button" @click="refresh" />
      </div>
    </div>

    <div class="grid shrink-0 gap-5 md:grid-cols-4">
      <Card class="hotel-card shadow-sm">
        <template #content>
          <p class="text-xl font-semibold text-slate-300">Catalogos</p>
          <p class="mt-5 text-5xl font-bold text-white">{{ sections.length }}</p>
          <p class="mt-2 text-base text-slate-500">Secciones detectadas en la API</p>
        </template>
      </Card>

      <Card class="hotel-card shadow-sm">
        <template #content>
          <p class="text-xl font-semibold text-slate-300">Elementos</p>
          <p class="mt-5 text-5xl font-bold text-white">{{ totalItems }}</p>
          <p class="mt-2 text-base text-slate-500">Parametros leidos de backend</p>
        </template>
      </Card>

      <Card class="hotel-card shadow-sm">
        <template #content>
          <p class="text-xl font-semibold text-slate-300">Estado</p>
          <p class="mt-5 text-3xl font-bold text-white">{{ isLoading ? 'Sincronizando' : 'Actualizado' }}</p>
          <p class="mt-2 text-base text-slate-500">Consulta sobre endpoints parametrizados</p>
        </template>
      </Card>

      <Card class="hotel-card shadow-sm">
        <template #content>
          <p class="text-xl font-semibold text-slate-300">Panel</p>
          <p class="mt-5 text-3xl font-bold text-white">Solo lectura</p>
          <p class="mt-2 text-base text-slate-500">Sin tocar backend ni inventar contratos</p>
        </template>
      </Card>
    </div>

    <Card class="hotel-card shrink-0 shadow-sm">
      <template #content>
        <div class="grid gap-3 xl:grid-cols-4">
          <Button
            v-for="section in sections"
            :key="section.key"
            :label="section.title"
            class="hotel-tab-button"
            :class="selectedSectionKey === section.key ? 'hotel-tab-button-active' : ''"
            @click="selectedSectionKey = section.key"
          />
        </div>
      </template>
    </Card>

    <Card class="hotel-card hotel-fill-card min-h-0 flex-1 overflow-hidden shadow-sm">
      <template #content>
        <div class="flex h-full min-h-0 flex-col gap-4">
          <div v-if="error" class="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {{ error }}
          </div>

          <div class="shrink-0">
            <h2 class="text-3xl font-bold text-white">{{ selectedSection?.title ?? 'Sin seccion' }}</h2>
            <p class="mt-2 text-base text-slate-400">{{ selectedSection?.description }}</p>
          </div>

          <div class="h-full min-h-0 overflow-auto">
            <DataTable :value="selectedSection?.items ?? []" :loading="isLoading" class="hotel-datatable" responsive-layout="scroll">
              <template #empty>
                <div class="px-6 py-12 text-center text-base text-slate-400">
                  {{ isLoading ? 'Cargando parametros...' : 'No hay elementos disponibles en esta seccion.' }}
                </div>
              </template>

              <Column field="id" header="ID" />
              <Column field="name" header="NOMBRE" />
              <Column field="description" header="DESCRIPCION" />
              <Column header="DETALLE">
                <template #body="slotProps">
                  <span class="text-slate-400">{{ slotProps.data.extra || 'Sin detalle adicional' }}</span>
                </template>
              </Column>
              <Column header="ACTIVO">
                <template #body="slotProps">
                  <Tag v-if="typeof slotProps.data.active === 'boolean'" :value="slotProps.data.active ? 'Activo' : 'Inactivo'" rounded :class="slotProps.data.active ? 'hotel-tag-success' : 'hotel-tag-neutral'" />
                  <span v-else class="text-slate-500">N/D</span>
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
import { computed, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'

import { useSystemCatalogs } from '../composables/useSystemCatalogs'

const { error, isLoading, refresh, sections, totalItems } = useSystemCatalogs()
const selectedSectionKey = ref<string>('')

const selectedSection = computed(() => {
  return sections.value.find((section) => section.key === selectedSectionKey.value) ?? sections.value[0] ?? null
})

watch(
  sections,
  (nextSections) => {
    if (nextSections.length === 0) {
      selectedSectionKey.value = ''
      return
    }

    if (!nextSections.some((section) => section.key === selectedSectionKey.value)) {
      selectedSectionKey.value = nextSections[0].key
    }
  },
  { immediate: true },
)

onMounted(() => {
  refresh()
})
</script>