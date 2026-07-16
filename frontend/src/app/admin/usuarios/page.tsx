"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/lib/api";

interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "SELLER" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/usuarios");
      setUsers(res.data);
    } catch {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/admin/usuarios", form);
      showToast("Usuario creado exitosamente");
      setShowModal(false);
      setForm({ email: "", name: "", role: "SELLER" });
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al crear usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!confirm("¿Suspender este usuario?")) return;
    try {
      await apiClient.patch(`/admin/usuarios/${userId}/suspender`);
      showToast("Usuario suspendido");
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al suspender");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    try {
      await apiClient.delete(`/admin/usuarios/${userId}`);
      showToast("Usuario eliminado");
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al eliminar");
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--alling-text)]">Gestión de Usuarios</h1>
            <button
              onClick={() => setShowModal(true)}
              className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--alling-primary-hover)] transition-colors"
            >
              + Crear usuario
            </button>
          </div>

          {toast && (
            <div className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm">
              {toast}
            </div>
          )}

          {loading && <p className="text-[var(--alling-metadata)]">Cargando usuarios...</p>}
          {error && <p className="text-[var(--alling-danger)]">{error}</p>}

          {!loading && !error && (
            <div className="bg-white rounded-md border border-[var(--alling-border)] overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-[var(--alling-border)]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-[var(--alling-text)]">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--alling-text)]">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--alling-text)]">Creado</th>
                    <th className="text-right px-4 py-3 font-medium text-[var(--alling-text)]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--alling-border)]">
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--alling-metadata)]">Sin usuarios</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-[var(--alling-text)]">{u.email}</td>
                      <td className="px-4 py-3 text-[var(--alling-metadata)]">{u.name ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--alling-metadata)]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("es-PE") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleSuspend(u.id)}
                          className="text-xs text-[var(--alling-warning)] hover:underline"
                        >
                          Suspender
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-xs text-[var(--alling-danger)] hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal crear usuario */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6">
                <h2 className="text-lg font-semibold text-[var(--alling-text)] mb-4">Crear Usuario</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--alling-text)] mb-1">Email *</label>
                    <input
                      type="email" required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--alling-text)] mb-1">Nombre</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--alling-text)] mb-1">Rol *</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                    >
                      <option value="SELLER">SELLER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm text-[var(--alling-metadata)] hover:text-[var(--alling-text)] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit" disabled={saving}
                      className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--alling-primary-hover)] disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Guardando..." : "Crear"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
