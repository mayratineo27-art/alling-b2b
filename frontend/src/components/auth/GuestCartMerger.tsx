"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";

/**
 * @sdd-rf RF-AUT-007
 * @sdd-module MOD-AUT-01
 * Ejecuta la fusión GUEST→CUSTOMER UNA SOLA VEZ cuando la sesión ya es válida.
 * NO se dispara dentro de login(), sino tras confirmar /auth/me exitoso.
 */
export function GuestCartMerger() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const mergeAttemptedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (mergeAttemptedRef.current) return;

    const attemptMerge = async () => {
      mergeAttemptedRef.current = true;
      try {
        await apiClient.post("/formatos/merge");
        console.info("[Merge RF-AUT-007] Carrito GUEST fusionado exitosamente");
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 409) {
          console.info("[Merge RF-AUT-007] Fusión omitida o ya realizada (404/409):", error.message);
          return;
        }
        console.warn("[Merge RF-AUT-007] Error no crítico durante la fusión:", error.message);
      }
    };

    attemptMerge();
  }, [user, isAuthenticated, isLoading]);

  return null;
}
