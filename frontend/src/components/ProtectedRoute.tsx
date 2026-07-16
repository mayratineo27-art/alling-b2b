"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AllowedRole = "CUSTOMER" | "ADMIN" | "SELLER" | "any";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Rol mínimo requerido para acceder a esta ruta. Por defecto: 'any' (cualquier usuario autenticado) */
  requiredRole?: AllowedRole;
}

export default function ProtectedRoute({ children, requiredRole = "any" }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Sin sesión → redirigir al login correcto según qué tipo de ruta protege
    if (!isAuthenticated) {
      const isStaffRoute = requiredRole === "ADMIN" || requiredRole === "SELLER";
      router.push(isStaffRoute ? "/admin/login" : "/auth/login");
      return;
    }

    // Con sesión pero rol insuficiente → redirigir según el rol real del usuario
    if (requiredRole !== "any" && user?.role) {
      // ADMIN tiene acceso a todo (es superusuario)
      if (user.role === "ADMIN") return;

      if (user.role !== requiredRole) {
        // Redirigir al panel correspondiente al rol real del usuario
        if (user.role === "SELLER") router.push("/vendedor/pedidos");
        else if (user.role === "CUSTOMER") router.push("/dashboard");
        else router.push("/");
      }
    }
  }, [isAuthenticated, user, isLoading, router, requiredRole]);

  // Estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-600 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-500 font-medium">Autenticando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
