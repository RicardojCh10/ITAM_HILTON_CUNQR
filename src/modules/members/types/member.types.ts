
export interface PropertyLite {
    id: number;
    name: string;
    code: string;
}

export interface MemberDetails {
    phone?: string | null;
    notes?: string | null;
    hiring_date?: string | null;
}

export interface Member {
    id: number;
    property_id: number;
    property?: PropertyLite; 
    tm_id: string | null;
    name: string;
    email: string | null;
    
    position?: string | null;
    department?: string | null;
    onq_id?: string | null;
    corporate_info?: {
        position: string | null;
        department: string | null;
        onq_id: string | null;
    };

    status: string;
    details: MemberDetails | null; // Objeto JSON decodificado
    created_at?: string;
}

export interface MemberListResponse {
    data: Member[];
    links: any;
    meta: any;
}

export interface CreateMemberPayload {
    property_id: number;
    tm_id?: string;
    name: string;
    email?: string;
    position?: string;
    department?: string;
    onq_id?: string;
    status?: string;
    details?: MemberDetails; 
}