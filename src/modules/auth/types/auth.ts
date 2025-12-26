
export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    propertyId: number | null;
}

export interface LoginPayload {
    email: string;
    password: string;
}   

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
} 
