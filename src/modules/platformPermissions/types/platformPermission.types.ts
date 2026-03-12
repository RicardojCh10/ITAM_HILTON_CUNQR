export interface PlatformPermission {
    id: number;
    platform_id: number;
    name: string;
    description?: string | null;
    platform_name?: string; // Opcional, si viene en el Resource
}

export interface CreatePlatformPermissionPayload {
    platform_id: number;
    name: string;
    description?: string | null;
}

export interface UpdatePlatformPermissionPayload {
    platform_id: number; // Se suele enviar para mantener consistencia, aunque no cambie
    name: string;
    description?: string | null;
}