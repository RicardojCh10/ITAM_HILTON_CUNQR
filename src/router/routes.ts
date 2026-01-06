import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  // Redirección raíz
  {
    path: '/',
    redirect: '/dashboard'
  },

  // Módulo de Autenticación (Layout Independiente)
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      guestOnly: true
    }
  },

  // Módulo de Dashboard (Layout Principal con Children)
  {
    path: '/dashboard',
    // IMPORTANTE: Este componente ahora solo debe contener el Header y un <RouterView />
    component: () => import('@/modules/dashboard/views/DashboardLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        // Ruta: /dashboard
        path: '',
        name: 'Dashboard',
        component: () => import('@/modules/dashboard/views/WidgetsView.vue'),
        meta: {
          title: 'Panel Principal'
        }
      },
      {
        // Ruta: /dashboard/users
        path: 'users',
        name: 'UserList',
        component: () => import('@/modules/users/views/UserListView.vue'),
        meta: {
          title: 'Gestión de Usuarios',
          roles: ['admin'] // Preparado para control de roles futuro
        }
      },
      {
        // Ruta: /dashboard/properties
        path: 'properties',
        name: 'PropertyList',
        component: () => import('@/modules/properties/views/PropertyListView.vue'),
        meta: {
          title: 'Gestión de Propiedades',
          roles: ['admin']
        }
      },
      {
        // Ruta: /dashboard/members
        path: 'members',
        name: 'MemberList',
        component: () => import('@/modules/members/views/MemberListView.vue'),
        meta: {
          title: 'Gestión de Miembros',
          roles: ['admin']
        }
      },
      {
        path: 'members/:id', 
        name: 'MemberDetail',
        component: () => import('@/modules/members/views/MemberDetailView.vue'),
        meta: { title: 'Detalles del Miembro' }
      },
      // Ruta: /dashboard/assets
      {
        path: 'assets',
        name: 'AssetList',
        component: () => import('@/modules/assets/views/AssetListView.vue'),
        meta: {
          title: 'Gestión de Activos',
          roles: ['admin']
        }
      },
      // {
      //   path: 'assets/:id',
      //   name: 'AssetDetail',
      //   component: () => import('@/modules/assets/views/AssetDetailView.vue'),
      //   meta: { title: 'Detalles del Activo' }
      // },

    ]
  },

  // Catch-all (404)
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];