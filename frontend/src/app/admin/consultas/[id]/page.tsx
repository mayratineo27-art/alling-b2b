"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Consulta {
  id: string;
  state: string;
  customer_id?: string;
  assigned_seller_id?: string;
  consultant_note?: string;
  updated_at?: string;
}

export default function AdminConsultaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const fuId = params?.id ?? "";

  const { user } = useAuth();
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [sellers, setSellers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [assigning, setAssigning] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchConsulta = useCallback(() => {
    setLoading(true);
    apiClient.get("/consultas").then((res) => {
      const found = res.data.find((c: Consulta) => c.id === fuId);
      setConsulta(found ?? null);
    }).catch(() => setConsulta(null)).finally(() => setLoading(false));
  }, [fuId]);

  useEffect(() => {
    fetchConsulta();
    
    // Fetch sellers list
    apiClient.get("/admin/usuarios")
      .then((res) => {
        const sellersList = res.data.filter((u: any) => u.role === "SELLER");
        setSellers(sellersList);
      })
      .catch(() => {});
  }, [fetchConsulta]);

  const handleAssignSeller = async (sellerId: string) => {
    setAssigning(true);
    try {
      await apiClient.post(`/admin/consultas/${fuId}/asignar`, { seller_id: sellerId || null });
      showToast("Consulta asignada exitosamente");
      fetchConsulta();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al asignar la consulta");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <button onClick={() => router.push("/admin/consultas")} className="text-sm text-[var(--alling-metadata)] hover:text-[var(--alling-text)] mb-2">
              ← Volver a consultas
            </button>
            <h1 className="text-2xl font-bold text-[var(--alling-text)]">Detalle de Consulta</h1>
            <p className="text-sm text-[var(--alling-metadata)] font-mono">#{fuId.slice(0, 16)}</p>
          </div>

          {toast && <div className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm">{toast}</div>}
          {loading && <p className="text-[var(--alling-metadata)]">Cargando...</p>}

          {!loading && !consulta && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
              Consulta no encontrada.
            </div>
          )}

          {!loading && consulta && (
            <>
              <div className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm space-y-3">
                <h2 className="text-base font-semibold text-[var(--alling-text)]">Información de Asignación (Gobernanza)</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[var(--alling-metadata)]">Estado</dt>
                    <dd className="font-medium text-[var(--alling-text)]">{consulta.state}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--alling-metadata)]">Asignar a Vendedor</dt>
                    <dd className="font-medium text-[var(--alling-text)] mt-1">
                      <select
                        disabled={assigning}
                        value={consulta.assigned_seller_id ?? ""}
                        onChange={(e) => handleAssignSeller(e.target.value)}
                        className="w-full border border-[var(--alling-border)] rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[var(--alling-primary)] outline-none"
                      >
                        <option value="">Sin asignar</option>
                        {sellers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.email})
                          </option>
                        ))}
                      </select>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--alling-metadata)]">Actualizado</dt>
                    <dd className="text-[var(--alling-text)]">
                      {consulta.updated_at ? new Date(consulta.updated_at).toLocaleString("es-PE") : "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              {consulta.state === "RESUELTA" && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-700">
                  ✅ Esta consulta fue resuelta por el vendedor asignado.
                  {consulta.consultant_note && (
                    <p className="mt-2 text-green-800 font-medium">{consulta.consultant_note}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
