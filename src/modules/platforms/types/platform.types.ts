export interface PlatformPermissionBase {
    id: number;
    name: string;
    description?: string | null;
}

export interface Platform {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    permissions?: PlatformPermissionBase[];
}

export interface PlatformListResponse {
    data: Platform[];
    links: any;
    meta: any;
}

export interface CreatePlatformPayload {
    name: string;
    description?: string;
    is_active?: boolean;
}

export interface UpdatePlatformPayload {
    name?: string;
    description?: string;
    is_active?: boolean;
}
