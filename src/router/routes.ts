import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: { 
      requiresAuth: false,
      guestOnly: true 
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/modules/dashboard/views/DashboardLayout.vue'), 
    meta: { 
      requiresAuth: true // Esta ruta está protegida
    },
    children: [
      // Aquí irían las sub-rutas del dashboard (ej. Habitaciones, Reservas)
    ]
  },
  // Catch-all para 404
//   {
//     path: '/:pathMatch(.*)*',
//     redirect: '/dashboard'
//   }
];