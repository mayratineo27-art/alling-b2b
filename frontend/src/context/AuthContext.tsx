"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";

interface User {
  id: string;
  email: string;
  name?: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCustomer: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (tokenId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiClient.get("/auth/me");
      setUser(response.data);
      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setUser(null);
        return false;
      }
      console.warn("[Auth] Error verificando sesión:", error.message);
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await verifySession();
      setIsLoading(false);
    };
    initAuth();
  }, [verifySession]);

  /**
   * Determina la ruta de redirección correcta según el rol del usuario.
   * - CUSTOMER  → /dashboard
   * - ADMIN     → /admin/usuarios (panel principal de administración)
   * - SELLER    → /vendedor/pedidos (panel de operaciones del vendedor)
   * @sdd-rf RF-AUT-001
   */
  const getRedirectPath = (role: string): string => {
    if (role === "ADMIN") return "/admin/usuarios";
    if (role === "SELLER") return "/vendedor/pedidos";
    return "/dashboard";
  };

  /**
   * @sdd-rf RF-AUT-007
   * Realiza el login de usuario, valida la sesión llamando a /auth/me y actualiza el estado.
   * Redirige a la ruta correcta según el rol, SOLO tras confirmar la sesión activa.
   * NO ejecuta la fusión de carrito aquí (separación de responsabilidades).
   */
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      await apiClient.post("/auth/login", credentials);
      const response = await apiClient.get("/auth/me");
      const userData = response.data as User;
      setUser(userData);
      router.push(getRedirectPath(userData.role));
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * @sdd-rf RF-AUT-007
   * Realiza login con Google OAuth, valida la sesión llamando a /auth/me y actualiza el estado.
   * Redirige a la ruta correcta según el rol, SOLO tras confirmar la sesión activa.
   * NO ejecuta la fusión de carrito aquí (separación de responsabilidades).
   */
  const loginWithGoogle = useCallback(async (tokenId: string) => {
    setIsLoading(true);

    console.log("[AuthContext] loginWithGoogle() invocado");
    console.log("[AuthContext] tokenId recibido, longitud:", tokenId?.length);
    console.log("[AuthContext] payload que se enviará a POST /api/auth/google:", {
      token: tokenId ? `${tokenId.slice(0, 20)}...` : tokenId,
    });
    console.log("[AuthContext] apiClient config -> baseURL:", apiClient.defaults.baseURL, "withCredentials:", apiClient.defaults.withCredentials);

    try {
      const authResponse = await apiClient.post("/auth/google", { token: tokenId });
      console.log("[AuthContext] POST /auth/google OK -> status:", authResponse.status, "data:", authResponse.data);

      const response = await apiClient.get("/auth/me");
      console.log("[AuthContext] GET /auth/me OK -> status:", response.status, "data:", response.data);

      const userData = response.data as User;
      setUser(userData);
      router.push(getRedirectPath(userData.role));
    } catch (error: any) {
      console.error("[AuthContext] Fallo en loginWithGoogle");
      console.error("[AuthContext] error.message:", error.message);
      console.error("[AuthContext] status HTTP:", error.response?.status);
      console.error("[AuthContext] error.response.data (detalle del backend):", error.response?.data);
      console.error("[AuthContext] headers de la respuesta:", error.response?.headers);
      console.error("[AuthContext] request que falló:", {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        withCredentials: error.config?.withCredentials,
      });
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try { await apiClient.post("/auth/logout"); } catch {}
    setUser(null);
    router.push("/");
  }, [router]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    return await verifySession();
  }, [verifySession]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      isCustomer: user?.role === "CUSTOMER",
      isSeller: user?.role === "SELLER",
      isAdmin: user?.role === "ADMIN",
      login,
      loginWithGoogle,
      logout,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return context;
}
