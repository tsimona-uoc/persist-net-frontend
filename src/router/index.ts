import { createRouter, createWebHistory } from 'vue-router'

import { useAuth } from '../composables/useAuth'
import BillingView from '../views/BillingView.vue'
import ClientsView from '../views/ClientsView.vue'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import PlanningView from '../views/PlanningView.vue'
import ReservationsView from '../views/ReservationsView.vue'
import RoomsView from '../views/RoomsView.vue'
import SystemSettingsView from '../views/SystemSettingsView.vue'

const { isAuthenticated } = useAuth()

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: () => (isAuthenticated.value ? '/dashboard' : '/login'),
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        requiresAuth: true,
        section: 'dashboard',
      },
    },
    {
      path: '/planning',
      name: 'planning',
      component: PlanningView,
      meta: {
        requiresAuth: true,
        section: 'planning',
      },
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: ClientsView,
      meta: {
        requiresAuth: true,
        section: 'clientes',
      },
    },
    {
      path: '/habitaciones',
      name: 'habitaciones',
      component: RoomsView,
      meta: {
        requiresAuth: true,
        section: 'habitaciones',
      },
    },
    {
      path: '/reservas',
      name: 'reservas',
      component: ReservationsView,
      meta: {
        requiresAuth: true,
        section: 'reservas',
      },
    },
    {
      path: '/facturacion',
      name: 'facturacion',
      component: BillingView,
      meta: {
        requiresAuth: true,
        section: 'facturacion',
      },
    },
    {
      path: '/parametros',
      name: 'parametros',
      component: SystemSettingsView,
      meta: {
        requiresAuth: true,
        section: 'parametros',
      },
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return {
      name: 'dashboard',
    }
  }
})

export default router