<template>
	<div v-if="isProtectedRoute" class="hotel-shell h-screen overflow-hidden text-slate-100">
		<header class="hotel-topbar flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
			<div class="flex items-center gap-3 text-sm text-white/80">
				<span class="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold tracking-[0.2em] text-white">PERSIST.NET - Hotel Management System</span>
			</div>


			<div class="flex items-center gap-3">
				<div class="hidden min-w-[260px] xl:block">
					<Select
						:model-value="selectedHotelId"
						@update:model-value="handleHotelChange"
						:options="hotels"
						option-label="name"
						option-value="id"
						placeholder="Selecciona hotel"
						class="hotel-select hotel-header-select"
						:loading="isHotelsLoading"
					/>
				</div>
				
				<Button
					type="button"
					label="Cerrar sesion"
					icon="pi pi-sign-out"
					class="hotel-logout-button"
					@click="handleLogout"
				/>
			</div>
		</header>

		<div class="flex h-[calc(100vh-64px)] min-h-0 flex-col lg:flex-row">
			<aside class="hotel-sidebar flex w-full shrink-0 flex-col overflow-y-auto border-r border-white/10 lg:w-[280px]">
				<div class="flex items-center gap-4 border-b border-white/10 px-7 py-8">
					<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-2xl text-cyan-300">
						<i class="pi pi-building"></i>
					</div>
					<div>
						<p class="text-4 font-semibold text-white">{{ selectedHotel?.name ?? 'Seleccion de hotel' }}</p>
						<p class="mt-1 text-sm text-slate-400">{{ selectedHotel?.subtitle || hotelError || 'Selecciona el hotel operativo actual' }}</p>
					</div>
				</div>

				<nav class="flex-1 space-y-2 px-4 py-5">
					<RouterLink
						v-for="item in navigationItems"
						:key="item.to"
						:to="item.to"
						class="hotel-nav-item flex items-center gap-3 rounded-2xl px-5 py-4 text-lg font-semibold text-slate-300 transition"
						:class="route.path === item.to ? 'hotel-nav-item-active' : 'hover:bg-white/5 hover:text-white'"
					>
						<i :class="['pi text-lg', item.icon]"></i>
						<span>{{ item.label }}</span>
					</RouterLink>
				</nav>

				<div class="border-t border-white/10 px-5 py-6 text-sm text-slate-400">
					<p class="font-semibold text-slate-100">Usuario: {{ displayUser }}</p>
					<p class="mt-1">Turno: Manana</p>
				</div>
			</aside>

			<main class="hotel-main flex min-h-0 flex-1 overflow-hidden px-4 py-6 sm:px-8 lg:px-9">
				<div class="hotel-route-view flex min-h-0 w-full flex-1 overflow-hidden">
					<RouterView />
				</div>
			</main>
		</div>
	</div>

	<div v-else class="min-h-screen bg-slate-950 text-slate-50">
		<div class="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
			<main class="flex-1 py-8">
				<RouterView />
			</main>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import { useAuth } from './composables/useAuth'
import { useHotelContext } from './composables/useHotelContext'

const route = useRoute()
const router = useRouter()
const { session, logout } = useAuth()
const { error: hotelError, hotels, isLoading: isHotelsLoading, refreshHotels, selectedHotel, selectedHotelId, setSelectedHotelId } = useHotelContext()

const isProtectedRoute = computed(() => route.meta.requiresAuth === true)
const displayUser = computed(() => session.value?.email ?? 'Admin')

const navigationItems = [
	{ label: 'Dashboard', to: '/dashboard', icon: 'pi-th-large' },
	{ label: 'Planning', to: '/planning', icon: 'pi-calendar' },
	{ label: 'Habitaciones', to: '/habitaciones', icon: 'pi-home' },
	{ label: 'Clientes', to: '/clientes', icon: 'pi-users' },
	{ label: 'Reservas', to: '/reservas', icon: 'pi-bookmark' },
	{ label: 'Estancias', to: '/estancias', icon: 'pi-briefcase' },
	{ label: 'Facturacion', to: '/facturacion', icon: 'pi-credit-card' },
	{ label: 'Parametros', to: '/parametros', icon: 'pi-cog' },
]

function handleLogout() {
	logout()
	router.push('/login')
}

function handleHotelChange(nextHotelId: number | null) {
	setSelectedHotelId(nextHotelId)
}

onMounted(() => {
	if (isProtectedRoute.value && !hotels.value.length) {
		refreshHotels()
	}
})

watch(isProtectedRoute, (nextValue) => {
	if (nextValue && !hotels.value.length) {
		refreshHotels()
	}
})
</script>