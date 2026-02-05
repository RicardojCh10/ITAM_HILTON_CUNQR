export interface ProviderContact {
    phone?: string;
    email?: string;
}

export interface ProviderRepresentative {
    name?: string;
    position?: string;
    phone?: string;
    email?: string;
}

// Lo que recibes del API (Resource)
export interface Provider {
    id: number;
    name: string;      // Comercial
    legal_name?: string;
    tax_id?: string;   // RFC
    address?: string;
    website?: string;
    
    // Objetos anidados del Resource
    company_contact: ProviderContact;
    representative: ProviderRepresentative;

    assets_count?: number;
    created_at?: string;
}

// Lo que envías al API (Request plano)
export interface ProviderPayload {
    name: string;
    legal_name?: string;
    tax_id?: string;
    address?: string;
    
    phone?: string;
    email?: string;
    website?: string;
    
    contact_name?: string;
    contact_position?: string;
    contact_phone?: string;
    contact_email?: string;
}

export interface ProviderListResponse {
    data: Provider[];
    meta: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
}