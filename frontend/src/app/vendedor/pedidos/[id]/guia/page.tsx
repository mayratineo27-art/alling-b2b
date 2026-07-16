"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import SellerLayout from "@/components/seller/SellerLayout";
import apiClient from "@/lib/api";

interface GuiaResponse {
  order_id: string;
  tracking_code: string;
  weight_kg: number;
  packages_count: number;
  notes?: string;
  generated_at: string;
  message: string;
}

export default function GenerarGuiaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";

  const [form, setForm] = useState({ weight_kg: "", packages_count: "1", notes: "" });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<GuiaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(form.weight_kg);
    const packages = parseInt(form.packages_count);
    if (!weight || weight <= 0) { setError("El peso debe ser mayor a 0"); return; }
    if (!packages || packages < 1) { setError("Se requiere al menos 1 bulto"); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await apiClient.post(`/seller/pedidos/${orderId}/guia`, {
        weight_kg: weight,
        packages_count: packages,
        notes: form.notes || undefined,
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Error al generar la guía");
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <ProtectedRoute requiredRole="SELLER">
        <SellerLayout>
          <div className="max-w-md mx-auto mt-8 bg-white rounded-md border border-[var(--alling-border)] p-8 shadow-sm text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-[var(--alling-text)]">Guía generada</h2>
            <div className="bg-gray-50 rounded-md p-4 text-left space-y-2 text-sm">
              <p><span className="font-medium text-[var(--alling-text)]">Código de seguimiento:</span>{" "}
                <span className="font-mono text-[var(--alling-primary)] text-base">{result.tracking_code}</span>
              </p>
              <p><span className="font-medium text-[var(--alling-text)]">Peso:</span> {result.weight_kg} kg</p>
              <p><span className="font-medium text-[var(--alling-text)]">Bultos:</span> {result.packages_count}</p>
              {result.notes && (
                <p><span className="font-medium text-[var(--alling-text)]">Notas:</span> {result.notes}</p>
              )}
            </div>
            <button
              onClick={() => router.push("/vendedor/pedidos")}
              className="bg-[var(--alling-primary)] text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-[var(--alling-primary-hover)] transition-colors"
            >
              Volver a pedidos
            </button>
          </div>
        </SellerLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="SELLER">
      <SellerLayout>
        <div className="max-w-md mx-auto mt-4 space-y-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-[var(--alling-metadata)] hover:text-[var(--alling-text)] mb-2">
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-[var(--alling-text)]">Generar Guía de Envío</h1>
            <p className="text-sm text-[var(--alling-metadata)]">Pedido #{orderId.slice(0, 8)}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--alling-text)] mb-1">
                Peso total (kg) *
              </label>
              <input
                type="number" step="0.1" min="0.1" required
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                placeholder="ej. 2.5"
                className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--alling-text)] mb-1">
                Número de bultos *
              </label>
              <input
                type="number" min="1" required
                value={form.packages_count}
                onChange={(e) => setForm({ ...form, packages_count: e.target.value })}
                className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--alling-text)] mb-1">
                Observaciones
              </label>
              <textarea
                rows={3} placeholder="Frágil, mantener vertical, etc."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none resize-none"
              />
            </div>
            <button
              type="submit" disabled={saving}
              className="w-full bg-[var(--alling-primary)] text-white py-2 rounded-md text-sm font-medium hover:bg-[var(--alling-primary-hover)] disabled:opacity-50 transition-colors"
            >
              {saving ? "Generando guía..." : "Confirmar y generar guía"}
            </button>
          </form>
        </div>
      </SellerLayout>
    </ProtectedRoute>
  );
}
