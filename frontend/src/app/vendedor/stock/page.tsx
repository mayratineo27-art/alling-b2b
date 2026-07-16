"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import SellerLayout from "@/components/seller/SellerLayout";
import apiClient from "@/lib/api";

interface StockItem {
  product_id: string;
  name: string;
  sku?: string;
  stock_total: number;
  reserved_stock: number;
  stock_real: number;
  stock_min_threshold: number;
  stock_alert: boolean;
}

export default function SellerStockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStock = useCallback(async () => {
    try {
      const res = await apiClient.get("/seller/stock");
      setItems(res.data);
    } catch {
      showToast("Error al cargar el stock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  const handleSaveStock = async (productId: string) => {
    const newVal = parseInt(editing[productId] ?? "");
    if (isNaN(newVal) || newVal < 0) {
      showToast("El stock debe ser un número >= 0");
      return;
    }
    try {
      await apiClient.patch(`/seller/stock/${productId}`, { stock: newVal });
      showToast("Stock actualizado");
      setEditing((prev) => { const copy = { ...prev }; delete copy[productId]; return copy; });
      fetchStock();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al actualizar stock");
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.sku ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute requiredRole="SELLER">
      <SellerLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-[var(--alling-text)]">Gestión de Stock</h1>
            <input
              type="text" placeholder="Buscar producto o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
            />
          </div>

          {toast && (
            <div className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm">{toast}</div>
          )}
          {loading && <p className="text-[var(--alling-metadata)]">Cargando inventario...</p>}

          {!loading && (
            <div className="bg-white rounded-md border border-[var(--alling-border)] overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-[var(--alling-border)]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-[var(--alling-text)]">Producto</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--alling-text)]">SKU</th>
                    <th className="text-right px-4 py-3 font-medium text-[var(--alling-text)]">Stock real</th>
                    <th className="text-right px-4 py-3 font-medium text-[var(--alling-text)]">Reservado</th>
                    <th className="text-center px-4 py-3 font-medium text-[var(--alling-text)]">Alerta</th>
                    <th className="px-4 py-3 font-medium text-[var(--alling-text)]">Nuevo stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--alling-border)]">
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--alling-metadata)]">Sin productos</td></tr>
                  )}
                  {filtered.map((item) => (
                    <tr key={item.product_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-[var(--alling-text)] font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-[var(--alling-metadata)] font-mono text-xs">{item.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={item.stock_alert ? "text-[var(--alling-danger)] font-semibold" : "text-[var(--alling-text)]"}>
                          {item.stock_real}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--alling-metadata)]">
                        {item.reserved_stock > 0
                          ? <span title="Reservado en pagos pendientes" className="text-[var(--alling-warning)]">{item.reserved_stock}</span>
                          : "0"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.stock_alert
                          ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">Bajo</span>
                          : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">OK</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={0}
                            placeholder={String(item.stock_total)}
                            value={editing[item.product_id] ?? ""}
                            onChange={(e) => setEditing({ ...editing, [item.product_id]: e.target.value })}
                            className="w-20 border border-[var(--alling-border)] rounded px-2 py-1 text-sm text-center focus:ring-1 focus:ring-[var(--alling-primary)] outline-none"
                          />
                          {editing[item.product_id] !== undefined && (
                            <button
                              onClick={() => handleSaveStock(item.product_id)}
                              className="text-xs bg-[var(--alling-primary)] text-white px-2 py-1 rounded hover:bg-[var(--alling-primary-hover)] transition-colors"
                            >
                              Guardar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SellerLayout>
    </ProtectedRoute>
  );
}
