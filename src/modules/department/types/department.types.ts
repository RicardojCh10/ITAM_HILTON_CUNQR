export interface Department {
    id: number;
    name: string;
    created_at?: string;
}

export interface DepartmentListResponse {
    data: Department[];
    links: any;
    meta: any;
}

export interface CreateDepartmentPayload {
    name: string;
}   

export interface UpdateDepartmentPayload {
    name?: string;
}