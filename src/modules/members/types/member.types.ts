export interface PropertyLite {
    id: number;
    name: string;
    code: string;
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

export interface Member {
    id: number;
    property_id: number;
    
    property?: PropertyLite; 
    
    tm_id: string | null;
    hilton_id: string | null;
    
    name: string;
    last_name: string;
    full_name: string; // Computed del backend
    
    email: string | null;
    status: string;
    
    hire_date: string | null;
    termination_date: string | null;

    corporate_info: MemberCorporateInfo; 
    
    details: MemberDetails | null;
    created_at: string | null;
}

export interface CreateMemberPayload {
    property_id: number;
    
    tm_id?: string;
    hilton_id?: string;
    
    name: string;
    last_name: string;
    
    email?: string;
    
    position?: string;
    department?: string;
    onq_id?: string;
    
    status?: string;
    hire_date?: string | null; // Formato YYYY-MM-DD
    termination_date?: string | null; // Formato YYYY-MM-DD

    details?: {
        phone?: string;
        notes?: string;
    };
}

// 4. Respuesta de Paginación
export interface MemberListResponse {
    data: Member[];
    meta?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
}

export interface StatsResponse {
    period: { start: string; end: string };
    stats: { altas: number; bajas: number; difference: number };
}