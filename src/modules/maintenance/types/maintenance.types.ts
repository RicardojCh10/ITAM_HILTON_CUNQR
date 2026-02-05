export type EventType = 'repair' | 'inspection' | 'upgrade' | 'warranty' | 'damage' | 'license';

export interface CurrentHolder {
    id: number;
    full_name: string;
    department: string;
    position?: string; 
}

export interface MaintenanceLog {
    id: number;
    event_type: EventType;
    asset: {
        id: number;
        hilton_name: string;
        serial_number: string;
        category: string;
        location?: { property_name: string };
        
    };
    // Aquí está la clave para la columna "Asignado A"
    current_holder?: CurrentHolder | null; 
    
    reporter?: {
        id: number;
        full_name: string;
        email: string;
    };
    details: {
        title: string;
        description: string;
        cost: number;
    };
    dates: {
        event_date: string; // YYYY-MM-DD
        created_at: string;
    };
}

export interface MaintenanceListResponse {
    data: MaintenanceLog[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

export interface CreateMaintenancePayload {
    asset_id: number;
    event_type: string;
    title: string;
    description: string;
    cost: number;
    event_date?: string | null; // YYYY-MM-DD
}