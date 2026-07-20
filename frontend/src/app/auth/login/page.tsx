"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isTestMode = typeof window !== "undefined" && window.location.search.includes("test=true");

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setLoading(true);

    console.log("[GoogleAuth] credentialResponse recibido de Google:", credentialResponse);
    console.log("[GoogleAuth] credential (JWT) presente:", !!credentialResponse?.credential);
    console.log(
      "[GoogleAuth] credential (primeros 40 chars):",
      credentialResponse?.credential?.slice(0, 40)
    );

    try {
      await loginWithGoogle(credentialResponse.credential);
      console.log("[GoogleAuth] loginWithGoogle resuelto correctamente");
    } catch (err: any) {
      console.error("[GoogleAuth] Error al autenticar con Google");
      console.error("[GoogleAuth] err.message:", err.message);
      console.error("[GoogleAuth] err.code:", err.code);
      console.error("[GoogleAuth] status HTTP:", err.response?.status);
      console.error("[GoogleAuth] response.data completo:", err.response?.data);
      console.error("[GoogleAuth] request config (url/method/withCredentials):", {
        url: err.config?.url,
        method: err.config?.method,
        withCredentials: err.config?.withCredentials,
        baseURL: err.config?.baseURL,
      });

      setError(
        err.response?.data?.detail ||
        "Error al autenticar con Google. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("No se pudo abrir el selector de cuentas de Google.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-sm ring-1 ring-black/5 overflow-hidden">
            <Image src="/alling-logo.png" alt="Alling" width={64} height={64} className="w-full h-full object-cover" priority />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Alling B2B</h1>
          <p className="text-gray-500 text-sm">Portal de compras corporativas</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Google Login */}
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-gray-500">Accede con tu cuenta corporativa</p>

          {loading ? (
            <div className="flex items-center gap-3 text-gray-500 py-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Autenticando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="320"
              />
            </div>
          )}
        </div>

        {!GOOGLE_CLIENT_ID && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            ⚠️ <strong>Dev Mode:</strong> Añade <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> en{" "}
            <code>.env.local</code> para activar el login real.
          </div>
        )}

        {/* Separator */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-xs text-gray-400">
            ¿Personal de Alling?{" "}
            <a href="/admin/login" className="text-gray-500 hover:text-gray-700 underline font-medium">
              Accede al panel administrativo
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}