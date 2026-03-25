// src/services/api.ts
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('gjb_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('gjb_token');
          localStorage.removeItem('gjb_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, auth: boolean = false): Promise<T> {
    return this.api.get(url);
  }

  async post<T = any>(url: string, data?: any, auth: boolean = false): Promise<T> {
    return this.api.post(url, data);
  }

  async put<T = any>(url: string, data?: any, auth: boolean = false): Promise<T> {
    return this.api.put(url, data);
  }

  async delete<T = any>(url: string, auth: boolean = false): Promise<T> {
    return this.api.delete(url);
  }

  async request<T = any>(method: string, url: string, data?: any, auth: boolean = false): Promise<T> {
    const config: AxiosRequestConfig = {
      method,
      url,
      data,
    };
    return this.api(config);
  }
}

const api = new ApiService();
export default api;