export interface User {
  id: number;
  name: string;
  last_name?: string;
  full_name: string; // Computed del backend
  email: string;
  role: string;
  
  property?: {
    id: number;
    name: string;
  } | null;

  property_id?: number | null;
  created_at?: string;
}

export interface CreateUserPayload {
  name: string;
  last_name?: string;
  email: string;
  role: string;
  password: string; 
  property_id?: number | null;
}

export interface UpdateUserPayload {
  name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  password?: string; 
  property_id?: number | null;
}

export interface UserListResponse {
  data: User[];
  links: any;
  meta: any;
}