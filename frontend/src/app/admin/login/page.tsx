"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Envía al endpoint de login local (email/password)
      await login({ email, password });
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Credenciales inválidas. Solo personal autorizado puede acceder."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/10">
            <Image src="/alling-logo.png" alt="Alling" width={56} height={56} className="w-full h-full object-cover" priority />
          </div>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 bg-red-900/40 text-red-400 border border-red-800 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            Acceso Restringido — Solo Personal
          </span>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-700 rounded-xl mb-4">
              <ShieldCheck className="w-7 h-7 text-gray-300" />
            </div>
            <h1 className="text-2xl font-bold text-white">Panel Administrativo</h1>
            <p className="text-gray-400 text-sm mt-1">Alling B2B — Acceso interno</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-950 text-red-400 rounded-lg text-sm border border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Correo Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-sm"
                  placeholder="admin@alling.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="admin-password"
                  type="password"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              id="admin-login-btn"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-2.5 rounded-lg transition text-sm mt-2"
            >
              {loading ? "Verificando..." : "Ingresar al Panel"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-5">
          ¿Cliente corporativo?{" "}
          <a href="/auth/login" className="text-gray-500 hover:text-gray-400 underline">
            Accede con tu cuenta Google
          </a>
        </p>
      </div>
    </div>
  );
}
