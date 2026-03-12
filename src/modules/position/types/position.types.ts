export interface PositionDefaultPermission {
    id: number;
    name: string;
    platform_id: number;
    platform_name: string | null;
}

export interface Position {
    id: number;
    department_id: number;
    name: string;
    created_at?: string;

    department?: {
        id: number;
        name: string;
    };

    default_permissions?: PositionDefaultPermission[];
}

export interface PositionListResponse {
    data: Position[];
    links: any;
    meta: any;
}

export interface CreatePositionPayload {
    department_id: number;
    name: string;
    default_permissions?: number[];
}

export interface UpdatePositionPayload {
    department_id?: number;
    name?: string;
    default_permissions?: number[];
}