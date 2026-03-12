export interface PropertyLite {
    id: number;
    name: string;
    code: string;
}

export interface PositionLite {
    id: number;
    name: string;
    department_id: number;
    department?: {
        id: number;
        name: string;
    };
    default_permissions?: { id: number; name: string; platform_id: number; }[];
}

export interface MemberCorporateInfo {
    position: string | null;
    department: string | null;
    onq_id: string | null;
}

export interface MemberDetails {
    phone?: string | null;
    notes?: string | null;
}

export interface MemberPlatformPermission {
    id: number;
    name: string;
    platform_id: number;
    platform_name: string | null;
    is_override: boolean;
    granted_by: number | null;
}

export interface MemberAssetLite {
    id: number;
    brand: string | null;
    model: string | null;
    category_name: string;
}

export interface Member {
    id: number;
    property_id: number;
    position_id: number | null; // Nuevo campo clave
    
    property?: PropertyLite; 
    position_details?: PositionLite; // Objeto anidado del resource
    platform_permissions?: MemberPlatformPermission[];
    assets?: MemberAssetLite[];
    
    tm_id: string | null;
    hilton_id: string | null;
    
    name: string;
    last_name: string;
    full_name: string; 
    
    email: string | null;
    status: string; // PENDING_IT, ACTIVO, BAJA, TERMINADO
    
    // Las 4 Fechas del Ciclo de Vida
    hire_date: string | null;       // RH Inicio
    termination_date: string | null;// RH Fin
    admission_date: string | null;  // IT Inicio
    hire_end_date: string | null;   // IT Fin

    corporate_info: MemberCorporateInfo; 
    
    details: MemberDetails | null;
    created_at: string | null;
}

// Payload para Crear/Editar
export interface CreateMemberPayload {
    property_id: number;
    position_id?: number | null; // Ahora enviamos ID, no texto
    
    tm_id?: string;
    hilton_id?: string;
    
    name: string;
    last_name: string;
    email?: string;
    onq_id?: string;
    
    // El backend calcula el status, pero podemos enviarlo si forzamos
    status?: string; 
    
    // Fechas
    hire_date?: string | null; 
    termination_date?: string | null;
    admission_date?: string | null;
    hire_end_date?: string | null;

    details?: {
        phone?: string;
        notes?: string;
    };
}

export interface MemberListResponse {
    data: Member[];
    meta?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
}

export interface SimpleStatsResponse {
    total_members: number;
    active: number;
    pending_it: number;
    offboarding: number;
}
