import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5500";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("gjb_token");
          localStorage.removeItem("gjb_user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthHeader(auth: boolean) {
    if (!auth) return {};
    const token = localStorage.getItem("gjb_token");

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }

  async get<T = any>(url: string, auth = false): Promise<T> {
    return this.api.get(url, {
      headers: this.getAuthHeader(auth),
    });
  }

  async post<T = any>(
    url: string,
    data?: any,
    auth = false
  ): Promise<T> {
    return this.api.post(url, data, {
      headers: this.getAuthHeader(auth),
    });
  }

  async put<T = any>(
    url: string,
    data?: any,
    auth = false
  ): Promise<T> {
    return this.api.put(url, data, {
      headers: this.getAuthHeader(auth),
    });
  }

  async delete<T = any>(url: string, auth = false): Promise<T> {
    return this.api.delete(url, {
      headers: this.getAuthHeader(auth),
    });
  }

  async request<T = any>(
    method: string,
    url: string,
    data?: any,
    auth = false
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      method,
      url,
      data,
      headers: this.getAuthHeader(auth),
    };

    return this.api(config);
  }
}

const api = new ApiService();
export default api;