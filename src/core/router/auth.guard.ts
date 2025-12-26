import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/modules/auth/store/auth.store';

export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();
  const storedToken = localStorage.getItem('access_token');

  // CASO A: Ruta requiere autenticación
  if (to.meta.requiresAuth) {
    // 1. Si no hay token físico, expulsar inmediatamente.
    if (!storedToken) {
      return next({ name: 'Login' });
    }

    // 2. VERIFICACIÓN DE INTEGRIDAD DE DATOS (Pre-fetching)
    if (!authStore.user) {
      try {
        const success = await authStore.checkAuth();
        if (success) {
          return next(); // Datos cargados, pase.
        } else {
          return next({ name: 'Login' }); // Token inválido, fuera.
        }
      } catch (error) {
        return next({ name: 'Login' });
      }
    }

    // 3. Todo en orden
    return next();
  }

  // CASO B: Ruta para invitados (Login) pero ya existe sesión
  if (to.meta.guestOnly && storedToken) {
    // Verificamos silenciamente que la sesión sea real
    if (!authStore.user) {
        await authStore.checkAuth();
    }
    return next({ name: 'Dashboard' });
  }

  // CASO C: Rutas públicas
  return next();
}