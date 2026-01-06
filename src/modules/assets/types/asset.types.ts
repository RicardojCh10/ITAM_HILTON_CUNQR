export interface AssetSpecs {
    ram?: string | null;
    storage?: string | null;
    processor?: string | null;
}

export interface Asset {
    id: number;
    location: {
        property_id: number;
        property_name: string;
    };
    assigned_to: {
        member_id: number | null;
        name: string | null;
        email: string | null;
        department: string | null;
    } | null;
    info: {
        category: string;
        brand: string | null;
        model: string | null;
        serial_number: string | null;
        hilton_name: string | null;
    };
    network: {
        mac_address: string | null;
        ip_address: string | null;
    };
    status: string;
    dates: {
        purchase: string | null;
        warranty: string | null;
    };
    specs: AssetSpecs | null;
    created_at: string;
}

export interface AssetListResponse {
    data: Asset[];
    meta: any;
    links: any;
}

// Payload para Crear/Editar

export interface CreateAssetPayload {
    property_id: number;
    member_id?: number | null; 
    category: string;
    brand?: string | null;    
    model?: string | null;    
    serial_number?: string | null;
    hilton_name?: string | null;
    
    // RED 
    mac_address?: string | null; 
    ip_address?: string | null;
    
    status: string;
    
    // FECHAS
    purchase_date?: string | null;
    warranty_expiry?: string | null;
    
    specs?: AssetSpecs;
}
