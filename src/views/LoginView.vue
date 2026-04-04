<template>
  <section class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
    <div class="space-y-5">
      <span class="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
        Ruta /login
      </span>
      <h2 class="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        Accede a la plataforma de gestion hotelera para supervisar reservas, huespedes y operativa diaria.
      </h2>
      <p class="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
        Centraliza check-in, check-out, disponibilidad de habitaciones, incidencias y facturacion desde un unico panel preparado para el equipo de recepcion y administracion.
      </p>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-2 block text-sm font-medium text-slate-200" for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model="form.email"
            placeholder="usuario@empresa.com"
            class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-50 outline-none transition focus:border-cyan-300"
            autocomplete="email"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-200" for="password">Password</label>
          <input
            id="password"
            type="password"
            v-model="form.password"
            placeholder="••••••••"
            class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-50 outline-none transition focus:border-cyan-300"
            autocomplete="current-password"
            :disabled="isLoading"
          />
        </div>

        <p v-if="error" class="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {{ error }}
        </p>

        <button
          type="submit"
          class="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/60"
          :disabled="isSubmitDisabled"
        >
          {{ isLoading ? 'Validando acceso...' : 'Entrar al dashboard' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuth } from '../composables/useAuth'

const form = reactive({
  email: '',
  password: '',
})

const route = useRoute()
const router = useRouter()
const { login, error, isLoading, clearError } = useAuth()

const isSubmitDisabled = computed(() => {
  return isLoading.value || !form.email.trim() || !form.password.trim()
})

const redirectTarget = computed(() => {
  return typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
})

async function handleSubmit() {
  clearError()

  try {
    await login({
      email: form.email.trim(),
      password: form.password,
    })

    await router.replace(redirectTarget.value)
  } catch {
    return
  }
}
</script>