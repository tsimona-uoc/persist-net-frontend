<template>
  <section class="flex h-full min-h-0 flex-col gap-8 text-slate-100">
    <div class="shrink-0">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 class="text-5xl font-bold tracking-tight text-white">Opciones del sistema</h1>
          <p class="mt-3 text-2xl font-medium text-slate-400">Gestion operativa de parametros y catalogos configurados en backend</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <Button label="Recargar catalogos" icon="pi pi-refresh" class="hotel-outline-button" @click="refresh" />
          <Button label="Nuevo parametro" icon="pi pi-plus" class="hotel-primary-button" @click="openCreateDialog" />
        </div>
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
          <p class="mt-5 text-3xl font-bold text-white">CRUD activo</p>
          <p class="mt-2 text-base text-slate-500">Alta, edicion y baja sobre catalogos soportados</p>
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
          <div v-if="error || saveError" class="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {{ saveError || error }}
          </div>

          <div class="shrink-0 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <h2 class="text-3xl font-bold text-white">{{ selectedSection?.title ?? 'Sin seccion' }}</h2>
            <div class="xl:text-right">
              <p class="text-base text-slate-400">{{ selectedSection?.description }}</p>
              <p class="mt-2 text-sm text-slate-500">{{ selectedSection?.items.length ?? 0 }} elementos en esta seccion</p>
            </div>
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

              <Column v-for="field in dateColumns" :key="field.key" :header="field.label.toUpperCase()">
                <template #body="slotProps">
                  <span class="text-slate-300">{{ getDateValue(slotProps.data, field) || 'Sin fecha' }}</span>
                </template>
              </Column>

              <Column v-if="hasExtraColumn" :header="selectedSectionKey === 'services' ? 'PRECIO' : 'DETALLE'">
                <template #body="slotProps">
                  <span class="text-slate-400">{{ slotProps.data.extra || 'Sin detalle adicional' }}</span>
                </template>
              </Column>

              <Column v-if="hasActiveColumn" header="ACTIVO">
                <template #body="slotProps">
                  <Tag v-if="typeof slotProps.data.active === 'boolean'" :value="slotProps.data.active ? 'Activo' : 'Inactivo'" rounded :class="slotProps.data.active ? 'hotel-tag-success' : 'hotel-tag-neutral'" />
                  <span v-else class="text-slate-500">N/D</span>
                </template>
              </Column>
              <Column header="ACCIONES">
                <template #body="slotProps">
                  <div class="flex gap-2">
                    <Button icon="pi pi-pencil" class="hotel-outline-button hotel-icon-button" @click="openEditDialog(slotProps.data)" />
                    <Button icon="pi pi-trash" class="hotel-danger-button hotel-icon-button" :loading="isSaving && deletingItemId === slotProps.data.id" @click="handleDelete(slotProps.data)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </template>
    </Card>

    <Dialog v-model:visible="isDialogOpen" modal :style="{ width: 'min(94vw, 900px)' }" class="hotel-dialog" :header="dialogTitle">
      <div class="hotel-dialog-form grid gap-5 md:grid-cols-2">
        <template v-for="field in selectedSection?.fields ?? []" :key="field.key">
          <div v-if="field.type !== 'textarea'" class="space-y-2">
            <label class="text-sm font-semibold text-slate-300">{{ field.label }}</label>

            <InputText
              v-if="field.type === 'text' || field.type === 'number' || field.type === 'date'"
              :model-value="getTextFieldValue(field.key)"
              @update:model-value="setTextFieldValue(field.key, $event ?? '')"
              :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
              class="hotel-input"
              fluid
            />

            <Select
              v-else
              :model-value="formValues[field.key]"
              @update:model-value="setFieldValue(field.key, $event)"
              :options="getOptions(field)"
              option-label="label"
              option-value="value"
              :placeholder="`Selecciona ${field.label.toLowerCase()}`"
              class="hotel-select"
              fluid
            />
          </div>

          <div v-else class="space-y-2 md:col-span-2">
            <label class="text-sm font-semibold text-slate-300">{{ field.label }}</label>
            <Textarea
              :model-value="getTextFieldValue(field.key)"
              @update:model-value="setTextFieldValue(field.key, $event ?? '')"
              rows="4"
              auto-resize
              class="hotel-textarea"
              fluid
            />
          </div>
        </template>
      </div>

      <div v-if="saveError" class="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
        {{ saveError }}
      </div>

      <template #footer>
        <div class="hotel-dialog-actions flex w-full justify-end gap-3">
          <Button label="Cancelar" class="hotel-outline-button" @click="closeDialog" />
          <Button :label="editingItemId ? 'Guardar cambios' : 'Crear parametro'" :loading="isSaving" class="hotel-primary-button" @click="submitDialog" />
        </div>
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'

import { readDateString } from '../lib/backend'
import { useSystemCatalogs, type CatalogField, type CatalogFormValues, type SystemCatalogItem } from '../composables/useSystemCatalogs'

const { createDraft, deleteItem, error, getFieldOptions, isLoading, isSaving, refresh, saveError, saveItem, sections, totalItems } = useSystemCatalogs()
const selectedSectionKey = ref<string>('')
const isDialogOpen = ref(false)
const editingItemId = ref<number | null>(null)
const deletingItemId = ref<number | null>(null)
const formValues = reactive<CatalogFormValues>({})

const selectedSection = computed(() => {
  return sections.value.find((section) => section.key === selectedSectionKey.value) ?? sections.value[0] ?? null
})

const dateColumns = computed(() => {
  return (selectedSection.value?.fields ?? []).filter((field) => field.type === 'date')
})

const hasActiveColumn = computed(() => {
  return (selectedSection.value?.fields ?? []).some((field) => field.type === 'boolean')
})

const hasExtraColumn = computed(() => {
  return ['rates', 'services'].includes(selectedSection.value?.key ?? '')
})

const dialogTitle = computed(() => {
  return editingItemId.value ? `Editar ${selectedSection.value?.title ?? 'parametro'}` : `Nuevo ${selectedSection.value?.title ?? 'parametro'}`
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

function openCreateDialog() {
  if (!selectedSection.value) {
    return
  }

  editingItemId.value = null
  resetDialogForm()
  isDialogOpen.value = true
}

function openEditDialog(item: SystemCatalogItem) {
  if (!selectedSection.value) {
    return
  }

  editingItemId.value = item.id
  resetDialogForm(item)
  isDialogOpen.value = true
}

function closeDialog() {
  isDialogOpen.value = false
  editingItemId.value = null
  resetDialogForm()
}

function resetDialogForm(item?: SystemCatalogItem | null) {
  const nextValues = selectedSection.value ? createDraft(selectedSection.value.key, item) : {}

  Object.keys(formValues).forEach((key) => {
    delete formValues[key]
  })

  Object.assign(formValues, nextValues)
}

function getTextFieldValue(fieldKey: string) {
  const value = formValues[fieldKey]

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return ''
}

function setTextFieldValue(fieldKey: string, value: string) {
  formValues[fieldKey] = value
}

function setFieldValue(fieldKey: string, value: string | number | boolean | null) {
  formValues[fieldKey] = value
}

function getOptions(field: CatalogField) {
  return getFieldOptions(field)
}

function getDateValue(item: SystemCatalogItem, field: CatalogField) {
  return readDateString(item.raw, field.apiKey)
}

async function submitDialog() {
  if (!selectedSection.value) {
    return
  }

  if (!isFormValid()) {
    return
  }

  try {
    await saveItem(selectedSection.value.key, { ...formValues }, editingItemId.value ?? undefined)
    closeDialog()
  } catch {
    return
  }
}

async function handleDelete(item: SystemCatalogItem) {
  if (!selectedSection.value) {
    return
  }

  if (!window.confirm(`Se eliminara el parametro ${item.name}. Deseas continuar?`)) {
    return
  }

  deletingItemId.value = item.id

  try {
    await deleteItem(selectedSection.value.key, item.id)
  } catch {
    return
  } finally {
    deletingItemId.value = null
  }
}

function isFormValid() {
  const fields = selectedSection.value?.fields ?? []

  return fields.every((field) => {
    if (!field.required) {
      return true
    }

    const value = formValues[field.key]

    if (field.type === 'select') {
      return typeof value === 'number' && Number.isFinite(value)
    }

    if (field.type === 'boolean') {
      return typeof value === 'boolean'
    }

    return String(value ?? '').trim().length > 0
  })
}

watch(selectedSectionKey, () => {
  if (isDialogOpen.value) {
    resetDialogForm()
  }
})
</script>