<template>
  <section class="flex h-full min-h-0 min-w-0 flex-col gap-8 text-slate-100">
    <!-- Encabezado -->
    <div class="shrink-0">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 class="text-5xl font-bold tracking-tight text-white">Odoo</h1>
          <p class="mt-3 text-2xl font-medium text-slate-400">Exportación e Importación de datos maestros y transaccionales</p>
        </div>
      </div>
    </div>

    <!-- Tarjetas Informativas de Entidades -->
    <div class="grid shrink-0 gap-5 md:grid-cols-3">
      <Card class="hotel-card shadow-sm">
        <template #content>
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xl font-semibold text-slate-300">Clientes</p>
              <p class="mt-2 text-sm text-slate-500">Mapeado a <span class="font-mono text-cyan-400">res.partner</span></p>
            </div>
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl text-xl bg-blue-400/10 text-blue-300">
              <i class="pi pi-users"></i>
            </div>
          </div>
        </template>
      </Card>
      <Card class="hotel-card shadow-sm">
        <template #content>
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xl font-semibold text-slate-300">Reservas</p>
              <p class="mt-2 text-sm text-slate-500">Mapeado a <span class="font-mono text-cyan-400">hotel.reserva</span></p>
            </div>
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl text-xl bg-purple-400/10 text-purple-300">
              <i class="pi pi-calendar"></i>
            </div>
          </div>
        </template>
      </Card>
      <Card class="hotel-card shadow-sm">
        <template #content>
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xl font-semibold text-slate-300">Facturas</p>
              <p class="mt-2 text-sm text-slate-500">Mapeado a <span class="font-mono text-cyan-400">hotel.factura</span></p>
            </div>
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl text-xl bg-emerald-400/10 text-emerald-300">
              <i class="pi pi-file"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Formulario Principal -->
    <Card class="hotel-card hotel-fill-card min-h-0 flex-1 overflow-hidden shadow-sm">
      <template #content>
        <div class="flex h-full min-h-0 flex-col gap-6 max-w-4xl pt-2">
          <div>
            <h2 class="text-2xl font-semibold text-white">Parámetros del Lote</h2>
            <p class="text-slate-400 mt-2 text-sm">Configura las opciones para agrupar los registros generados en el archivo XML.</p>
          </div>
          
          <form @submit.prevent="exportToOdoo" class="grid gap-6 md:grid-cols-2">
            <div class="space-y-2 md:col-span-2">
              <label for="nombreLote" class="text-sm font-semibold text-slate-300">
                Nombre del Lote / Referencia <span class="text-cyan-400">*</span>
              </label>
              <InputText id="nombreLote" v-model="form.nombreLote" required placeholder="Ej: Lote_Odoo_2026" class="hotel-input w-full" />
              <p class="text-xs text-slate-500 mt-1.5">Identificador único para agrupar y auditar los registros en el ERP.</p>
            </div>

            <div class="space-y-2">
              <label for="fechaInicio" class="text-sm font-semibold text-slate-300">Fecha de Inicio (Opcional)</label>
              <InputText id="fechaInicio" v-model="form.fechaInicio" type="date" class="hotel-input w-full" />
            </div>
            <div class="space-y-2">
              <label for="fechaFin" class="text-sm font-semibold text-slate-300">Fecha de Fin (Opcional)</label>
              <InputText id="fechaFin" v-model="form.fechaFin" type="date" class="hotel-input w-full" />
            </div>

            <div class="pt-6 md:col-span-2">
              <Button type="submit" :loading="isLoading" label="Generar Archivo XML" icon="pi pi-file-export" class="hotel-primary-button w-full sm:w-auto px-8 py-3" />
            </div>
          </form>

          <!-- Mensajes de Feedback -->
          <div v-if="successMessage" class="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100 animate-fade-in">
            <p class="font-medium flex items-center gap-3 text-lg"><i class="pi pi-check-circle text-emerald-400 text-xl"></i> {{ successMessage }}</p>
            <div v-if="detailMessage" class="mt-4 ml-8 rounded-xl bg-slate-900/50 border border-emerald-400/10 p-4 font-mono text-sm text-emerald-300/80 whitespace-pre-wrap">{{ detailMessage }}</div>
          </div>

          <div v-if="errorMessage" class="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-100 animate-fade-in">
            <p class="font-medium flex items-center gap-3 text-lg"><i class="pi pi-exclamation-circle text-rose-400 text-xl"></i> Error en la Exportación</p>
            <p class="text-sm mt-2 ml-8 opacity-90">{{ errorMessage }}</p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Formulario de Importación -->
    <Card class="hotel-card hotel-fill-card min-h-0 flex-1 overflow-hidden shadow-sm">
      <template #content>
        <div class="flex h-full min-h-0 flex-col gap-6 max-w-4xl pt-2">
          <div>
            <h2 class="text-2xl font-semibold text-white">Importar desde Odoo</h2>
            <p class="text-slate-400 mt-2 text-sm">Sube un archivo XML generado en Odoo para importar o actualizar los registros en HotelSOL.</p>
          </div>
          
          <form @submit.prevent="importFromOdoo" class="grid gap-6 md:grid-cols-2">
            <div class="space-y-2 md:col-span-2">
              <label class="text-sm font-semibold text-slate-300">Archivo XML <span class="text-cyan-400">*</span></label>
              <input type="file" accept=".xml" @change="handleFileChange" required class="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-400/10 file:text-cyan-400 hover:file:bg-cyan-400/20 cursor-pointer border border-white/10 rounded-md bg-slate-900/50" />
            </div>

            <div class="pt-2 md:col-span-2">
              <Button type="submit" :loading="isImportLoading" :disabled="!selectedFile" label="Importar Archivo XML" icon="pi pi-cloud-download" class="hotel-outline-button w-full sm:w-auto px-8 py-3" />
            </div>
          </form>

          <!-- Mensajes de Feedback Importación -->
          <div v-if="importSuccessMessage" class="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100 animate-fade-in">
            <p class="font-medium flex items-center gap-3 text-lg"><i class="pi pi-check-circle text-emerald-400 text-xl"></i> Importación Exitosa</p>
            <p class="text-sm mt-2 ml-8 opacity-90 whitespace-pre-wrap">{{ importSuccessMessage }}</p>
          </div>

          <div v-if="importErrorMessage" class="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-100 animate-fade-in">
            <p class="font-medium flex items-center gap-3 text-lg"><i class="pi pi-exclamation-circle text-rose-400 text-xl"></i> Error en la Importación</p>
            <p class="text-sm mt-2 ml-8 opacity-90">{{ importErrorMessage }}</p>
          </div>
        </div>
      </template>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const form = reactive({
  nombreLote: 'Lote_' + new Date().toISOString().split('T')[0], // Sugerencia de nombre por defecto
  fechaInicio: '',
  fechaFin: ''
});

const isLoading = ref<boolean>(false);
const successMessage = ref<string>('');
const detailMessage = ref<string>('');
const errorMessage = ref<string>('');

// Estados para la Importación
const isImportLoading = ref<boolean>(false);
const importSuccessMessage = ref<string>('');
const importErrorMessage = ref<string>('');
const selectedFile = ref<File | null>(null);

const API_URL = 'https://localhost:7151/api';

const exportToOdoo = async () => {
  isLoading.value = true;
  successMessage.value = '';
  detailMessage.value = '';
  errorMessage.value = '';

  try {
    const token = localStorage.getItem('jwt_token') || '';

    const response = await fetch(`${API_URL}/exportar/odoo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        nombreLote: form.nombreLote,
        fechaInicio: form.fechaInicio ? new Date(form.fechaInicio).toISOString() : null,
        fechaFin: form.fechaFin ? new Date(form.fechaFin).toISOString() : null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error inesperado al procesar la solicitud.');
    }

    successMessage.value = data.mensaje;
    detailMessage.value = data.detalle; 
    
  } catch (error: any) {
    errorMessage.value = error.message || 'No se pudo conectar con el servidor backend.';
  } finally {
    isLoading.value = false;
  }
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  } else {
    selectedFile.value = null;
  }
};

const importFromOdoo = async () => {
  if (!selectedFile.value) return;

  isImportLoading.value = true;
  importSuccessMessage.value = '';
  importErrorMessage.value = '';

  try {
    const token = localStorage.getItem('jwt_token') || '';
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    const response = await fetch(`${API_URL}/importar/xml`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` 
        // Nota importante: NO añadimos 'Content-Type' aquí. 
        // Fetch lo pone automáticamente como 'multipart/form-data' al detectar un objeto FormData.
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al importar el archivo XML.');
    }

    // Formatear el resultado si la API devuelve estadísticas de inserción, o mensaje genérico
    importSuccessMessage.value = data.message || 'El archivo XML se ha procesado e importado correctamente en la base de datos de HotelSOL.';
    
  } catch (error: any) {
    importErrorMessage.value = error.message || 'No se pudo conectar con el servidor backend.';
  } finally {
    isImportLoading.value = false;
  }
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>