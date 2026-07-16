"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/lib/api";

interface Config {
  quote_validity_days: number;
  default_stock_min_threshold: number;
}

export default function AdminConfiguracionPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ quote_validity_days: 7, default_stock_min_threshold: 5 });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    apiClient.get("/admin/configuracion")
      .then((res) => {
        setConfig(res.data);
        setForm({
          quote_validity_days: res.data.quote_validity_days ?? 7,
          default_stock_min_threshold: res.data.default_stock_min_threshold ?? 5,
        });
      })
      .catch(() => showToast("Error al cargar configuración"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quote_validity_days < 1) {
      showToast("Los días de vigencia deben ser al menos 1");
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.put("/admin/configuracion", form);
      setConfig(res.data.config);
      showToast("Configuración guardada");
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await apiClient.post("/admin/exportar");
      showToast(`Exportación completada: ${JSON.stringify(res.data.records)} registros`);
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al exportar (¿MFA requerido?)");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-[var(--alling-text)]">Configuración del Sistema</h1>

          {toast && (
            <div className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm">{toast}</div>
          )}

          {loading && <p className="text-[var(--alling-metadata)]">Cargando configuración...</p>}

          {!loading && (
            <form onSubmit={handleSave} className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-[var(--alling-text)]">Parámetros de negocio</h2>

              <div>
                <label className="block text-sm font-medium text-[var(--alling-text)] mb-1">
                  Días de vigencia de cotización (≥ 1)
                </label>
                <input
                  type="number" min={1} required
                  value={form.quote_validity_days}
                  onChange={(e) => setForm({ ...form, quote_validity_days: parseInt(e.target.value) || 1 })}
                  className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                />
                <p className="text-xs text-[var(--alling-metadata)] mt-1">
                  Actualmente: <strong>{config?.quote_validity_days ?? "—"} días</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--alling-text)] mb-1">
                  Umbral mínimo de stock por defecto
                </label>
                <input
                  type="number" min={0}
                  value={form.default_stock_min_threshold}
                  onChange={(e) => setForm({ ...form, default_stock_min_threshold: parseInt(e.target.value) || 0 })}
                  className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit" disabled={saving}
                  className="bg-[var(--alling-primary)] text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-[var(--alling-primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Guardando..." : "Guardar configuración"}
                </button>
              </div>
            </form>
          )}

          {/* Exportación de datos (RF-ADM-008) */}
          <div className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm space-y-3">
            <h2 className="text-base font-semibold text-[var(--alling-text)]">Exportación de datos</h2>
            <p className="text-sm text-[var(--alling-metadata)]">
              Exporta usuarios y pedidos en formato JSON. Requiere re-autenticación MFA.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-700">
              ⚠️ Esta operación queda registrada en el AuditLog inmutable (RN-ADM-002).
            </div>
            <button
              onClick={handleExport} disabled={exporting}
              className="bg-[var(--alling-text)] text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-80 disabled:opacity-50 transition-colors"
            >
              {exporting ? "Exportando..." : "Exportar datos"}
            </button>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
