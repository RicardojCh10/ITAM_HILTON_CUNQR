import axios, {type AxiosInstance, type AxiosRequestConfig, type AxiosResponse} from "axios";

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

class HttpClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL ,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    // Interceptor de Request: Inyectar Token si existe
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor de Response: Manejo global de errores (ej. 401)
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Lógica opcional: Redirigir a login o limpiar storage
          console.warn('Sesión expirada o no autorizada');
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos genéricos tipados
  public get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  public post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  // AGREGADO: Método PUT para actualizaciones completas
  public put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  // AGREGADO: Método PATCH para actualizaciones parciales (Opcional, pero recomendado tenerlo)
  public patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }

  // AGREGADO: Método DELETE para eliminaciones
  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }
}

export const httpClient = new HttpClient();
