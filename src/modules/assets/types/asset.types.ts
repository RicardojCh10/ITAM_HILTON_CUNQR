export interface AssetSpecs {
    ram?: string | null;
    storage?: string | null;
    processor?: string | null;
    imei?: string | null;
    sim?: string | null;
    plan?: string | null;
    carrier?: string | null;
    phone_number?: string | null;
    description?: string | null;
}

export interface AssetMemberLite {
    member_id: number;
    tm_id?: string;
    name: string;
    last_name: string;
    full_name: string;
    position?: string;
    department?: string;
}

export interface AssetAccessory {
    id: number;
    type: string;
    brand: string | null;
    serial_number: string | null;
}

export interface AssetCategory {
    id: number;
    name: string;
    prefix: string;
    icon: string | null;
}


export interface AssetProvider {
    provider_id: number;
    name: string;
    tax_id?: string;
    email?: string;
    phone?: string;
    contact_name?: string;
}

export interface Asset {
    id: number;
    location: {
        property_id: number;
        property_name: string;
    };
    category: AssetCategory;

    batch_id: number;
    assigned_to?: AssetMemberLite | null;
    provider?: AssetProvider | null;
    info: {
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
    price: number | null;
    dates: {
        purchase: string | null;
        warranty: string | null;
    };
    accessories?: AssetAccessory[];
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
    category_id: number; 
    quantity: number;   
    price?: number | null;

    member_id?: number | null;
    provider_id?: number | null;
    brand?: string | null;
    model?: string | null;

    serials?: string[];
    accessories_base?: { type: string; brand?: string }[];
    
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
