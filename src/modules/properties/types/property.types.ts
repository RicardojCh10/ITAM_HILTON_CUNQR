export interface Property {
  id: number;
  name: string;
  code: string;       
  created_at?: string; 
}

export interface PropertyListResponse {
  data: Property[];
  links: any;
  meta: any;
}

export interface CreatePropertyPayload {
  name: string;
  code: string;
}

export interface UpdatePropertyPayload {
  name?: string;
  code?: string;
}