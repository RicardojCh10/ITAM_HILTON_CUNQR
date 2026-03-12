export interface Category {
    id: number;
    name: string;
    slug: string;
    prefix: string;
    icon: string | null;
    is_serialized: boolean;
    has_network_fields: boolean;
    created_at: string;
}

export interface CategoryListResponse {
    data: Category[];
    links: any;
    meta: any;
}

export interface CreateCategoryPayload {
    name: string;
    slug?: string;
    prefix: string;
    icon?: string | null;
    is_serialized: boolean;
    has_network_fields: boolean;
}   

export interface UpdateCategoryPayload {
    name?: string;
    slug?: string;
    prefix?: string;
    icon?: string | null;
    is_serialized?: boolean;
    has_network_fields?: boolean;
}

