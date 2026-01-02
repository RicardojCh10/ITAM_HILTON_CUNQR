export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  
  // SOLUCIÓN ERROR 1: Definimos el objeto anidado
  property?: {
    id: number;
    name: string;
  } | null;

  property_id?: number | null;
  created_at?: string;
}

// Payload para CREAR (Password es obligatorio)
export interface CreateUserPayload {
  name: string;
  email: string;
  role: string;
  password: string; // <--- Aquí dice string, no puede ser undefined
  property_id?: number | null;
}

// Payload para ACTUALIZAR (Password es opcional)
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  password?: string; // <--- Aquí sí puede ser opcional
  property_id?: number | null;
}

// Tipado de la respuesta paginada completa (ya lo tenías, lo dejo por referencia)
export interface UserListResponse {
  data: User[];
  links: any;
  meta: any;
}