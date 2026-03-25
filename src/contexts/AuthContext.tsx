// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import api from "../services/api";
import type { User, RegisterData, ApiResponse } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("gjb_token"),
  );

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem("gjb_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await api.post<ApiResponse>("/api/login", {
        email,
        password,
      });
      if (data.token && data.user) {
        localStorage.setItem("gjb_token", data.token);
        localStorage.setItem("gjb_user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (
    data: RegisterData,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post<ApiResponse>("/api/register", data);
      if (response.token && response.user) {
        localStorage.setItem("gjb_token", response.token);
        localStorage.setItem("gjb_user", JSON.stringify(response.user));
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: response.error || "Registration failed" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = (): void => {
    localStorage.removeItem("gjb_token");
    localStorage.removeItem("gjb_user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<User>): void => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      localStorage.setItem("gjb_user", JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
