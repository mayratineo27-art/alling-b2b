"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import SellerLayout from "@/components/seller/SellerLayout";
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

export default function ConsultaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const fuId = params?.id ?? "";

  const { user } = useAuth();
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
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
    
    // Fetch sellers list if user is ADMIN
    if (user?.role === "ADMIN") {
      apiClient.get("/admin/usuarios")
        .then((res) => {
          const sellersList = res.data.filter((u: any) => u.role === "SELLER");
          setSellers(sellersList);
        })
        .catch(() => {});
    }
  }, [fetchConsulta, user]);

  const handleResponder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) { showToast("La nota de asesoría no puede estar vacía"); return; }
    setSending(true);
    try {
      await apiClient.post(`/consultas/${fuId}/responder`, { consultant_note: note });
      showToast("Respuesta enviada exitosamente");
      setTimeout(() => router.push("/vendedor/consultas"), 1500);
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al enviar la respuesta");
    } finally {
      setSending(false);
    }
  };

  const handleAssignSeller = async (sellerId: string) => {
    if (!sellerId) return;
    setAssigning(true);
    try {
      await apiClient.post(`/admin/consultas/${fuId}/asignar`, { seller_id: sellerId });
      showToast("Consulta asignada exitosamente");
      fetchConsulta();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al asignar la consulta");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="SELLER">
      <SellerLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-[var(--alling-metadata)] hover:text-[var(--alling-text)] mb-2">
              ← Volver a consultas
            </button>
            <h1 className="text-2xl font-bold text-[var(--alling-text)]">Detalle de Consulta</h1>
            <p className="text-sm text-[var(--alling-metadata)] font-mono">#{fuId.slice(0, 16)}</p>
          </div>

          {toast && <div className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm">{toast}</div>}
          {loading && <p className="text-[var(--alling-metadata)]">Cargando...</p>}

          {!loading && !consulta && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
              Consulta no encontrada. Puede que ya haya sido resuelta.
            </div>
          )}

          {!loading && consulta && (
            <>
              <div className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm space-y-3">
                <h2 className="text-base font-semibold text-[var(--alling-text)]">Información</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[var(--alling-metadata)]">Estado</dt>
                    <dd className="font-medium text-[var(--alling-text)]">{consulta.state}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--alling-metadata)]">Asignada a</dt>
                    <dd className="font-medium text-[var(--alling-text)]">
                      {user?.role === "ADMIN" ? (
                        <select
                          disabled={assigning}
                          value={consulta.assigned_seller_id ?? ""}
                          onChange={(e) => handleAssignSeller(e.target.value)}
                          className="border border-[var(--alling-border)] rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[var(--alling-primary)] outline-none"
                        >
                          <option value="">Sin asignar</option>
                          {sellers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.email})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-mono text-xs text-[var(--alling-text)]">
                          {consulta.assigned_seller_id ? consulta.assigned_seller_id.slice(0, 12) + "…" : "Sin asignar"}
                        </span>
                      )}
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

              {consulta.state === "CONSULTA" && consulta.assigned_seller_id && (
                <form onSubmit={handleResponder} className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm space-y-4">
                  <h2 className="text-base font-semibold text-[var(--alling-text)]">Respuesta de asesoría</h2>
                  <div>
                    <label className="block text-sm font-medium text-[var(--alling-text)] mb-1">
                      Nota de asesoría *
                    </label>
                    <textarea
                      rows={4} required
                      placeholder="Redacta aquí tu respuesta comercial..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => router.back()}
                      className="px-4 py-2 text-sm text-[var(--alling-metadata)] hover:text-[var(--alling-text)]">
                      Cancelar
                    </button>
                    <button type="submit" disabled={sending}
                      className="bg-[var(--alling-primary)] text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-[var(--alling-primary-hover)] disabled:opacity-50 transition-colors">
                      {sending ? "Enviando..." : "Enviar respuesta"}
                    </button>
                  </div>
                </form>
              )}

              {consulta.state === "RESUELTA" && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-700">
                  ✅ Esta consulta ya fue resuelta.
                  {consulta.consultant_note && (
                    <p className="mt-2 text-green-800 font-medium">{consulta.consultant_note}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SellerLayout>
    </ProtectedRoute>
  );
}
