"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/lib/api";

interface Product {
  id: string;
  name: string;
  sku: string;
  price_public: number;
  stock: number;
  is_active: boolean;
  category?: string;
  brand?: string;
}

interface SelectedComponent {
  product: Product;
  quantity: number;
}

interface Kit {
  id: string;
  name: string;
  description?: string;
  component_ids: string[];
  created_at: string;
}

export default function AdminKitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form states
  const [kitName, setKitName] = useState("");
  const [kitDescription, setKitDescription] = useState("");
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchKits = useCallback(async () => {
    try {
      const res = await apiClient.get("/admin/kits");
      setKits(res.data);
    } catch {
      showToast("Error al cargar los kits", "error");
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient.get("/admin/productos");
      setProducts(res.data.filter((p: Product) => p.is_active));
    } catch {
      showToast("Error al cargar los componentes", "error");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchKits(), fetchProducts()]).finally(() => setLoading(false));
  }, [fetchKits, fetchProducts]);

  // Handle adding a component
  const addComponent = (product: Product) => {
    setSelectedComponents((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`Componente "${product.name}" agregado`);
  };

  // Handle quantity change
  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setSelectedComponents((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setSelectedComponents((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  // Remove component
  const removeComponent = (productId: string) => {
    setSelectedComponents((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Accumulate total price of the kit
  const accumulatedPrice = selectedComponents.reduce(
    (acc, curr) => acc + curr.product.price_public * curr.quantity,
    0
  );

  // Submit creation
  const handleCreateKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitName.trim()) {
      showToast("El nombre del kit es requerido", "error");
      return;
    }

    // Map list of IDs (e.g. if quantity is 3, include it 3 times, or just list unique IDs based on backend requirement)
    // BTN-ADM-009 says: minimum 2 components. Let's make sure we have at least 2 distinct products or total count >= 2.
    const totalComponentCount = selectedComponents.reduce((acc, c) => acc + c.quantity, 0);
    if (totalComponentCount < 2) {
      showToast("Se requieren al menos 2 componentes (BTN-ADM-009)", "error");
      return;
    }

    const componentIds: string[] = [];
    selectedComponents.forEach((c) => {
      for (let i = 0; i < c.quantity; i++) {
        componentIds.push(c.product.id);
      }
    });

    setSaving(true);
    try {
      await apiClient.post("/admin/kits", {
        name: kitName,
        description: kitDescription || undefined,
        component_ids: componentIds,
      });
      showToast("Kit creado exitosamente");
      setShowModal(false);
      // Reset form
      setKitName("");
      setKitDescription("");
      setSelectedComponents([]);
      fetchKits();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al crear el kit", "error");
    } finally {
      setSaving(false);
    }
  };

  // Unique categories for component filter
  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  // Filter candidates for search
  const filteredCandidates = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--alling-border)] pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--alling-text)]">Gestión de Kits B2B</h1>
              <p className="text-sm text-[var(--alling-metadata)] mt-1">
                Agrupa productos individuales del catálogo para venderlos en conjunto con precios integrados.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-[var(--alling-primary)] text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-[var(--alling-primary-hover)] transition-colors shadow-sm"
            >
              + Nuevo Kit Personalizado
            </button>
          </div>

          {/* Toast */}
          {toast && (
            <div
              className={`p-4 rounded-md shadow-xs flex justify-between items-center transition-all ${
                toast.type === "success"
                  ? "bg-green-50 border-l-4 border-green-500 text-green-700"
                  : "bg-red-50 border-l-4 border-red-500 text-red-700"
              }`}
            >
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => setToast(null)} className="text-xs font-bold hover:underline">
                [Ok]
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-center py-12 text-[var(--alling-metadata)]">Cargando kits y componentes...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {kits.length === 0 && (
                <div className="col-span-full bg-white rounded-lg border border-[var(--alling-border)] p-12 text-center text-[var(--alling-metadata)] shadow-xs">
                  ⚡ No se han creado kits de instalación. Utiliza el botón superior para estructurar tu primer Kit.
                </div>
              )}
              {kits.map((k) => (
                <div
                  key={k.id}
                  className="bg-white rounded-lg border border-[var(--alling-border)] p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-[var(--alling-text)] truncate">{k.name}</h3>
                      <span className="bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded text-[0.7rem] font-semibold">
                        Kit FTTH
                      </span>
                    </div>
                    {k.description ? (
                      <p className="text-sm text-[var(--alling-metadata)] line-clamp-2 mb-4">
                        {k.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic mb-4">Sin descripción</p>
                    )}
                  </div>
                  <div className="border-t border-gray-150 pt-3 flex items-center justify-between">
                    <span className="text-xs text-[var(--alling-metadata)] font-medium">
                      📋 {k.component_ids.length} Componentes
                    </span>
                    <span className="text-xs text-slate-400">
                      ID: {k.id.split("-")[0]}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BUILDER MODAL */}
          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 h-[85vh] flex flex-col justify-between">
                {/* Modal Title */}
                <div className="flex items-center justify-between border-b border-[var(--alling-border)] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--alling-text)]">Constructor de Kits</h2>
                    <p className="text-xs text-[var(--alling-metadata)]">
                      Combina varios componentes en un kit con precio acumulado dinámico.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-[var(--alling-text)] text-lg"
                  >
                    ×
                  </button>
                </div>

                {/* Modal Split Content */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 my-4 overflow-hidden">
                  {/* Left Column: Form & Current Selection */}
                  <div className="flex flex-col justify-between overflow-y-auto pr-2 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                          Nombre del Kit *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Kit Abonado Fibra Óptica"
                          value={kitName}
                          onChange={(e) => setKitName(e.target.value)}
                          className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                          Descripción
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Propósito, velocidad, etc."
                          value={kitDescription}
                          onChange={(e) => setKitDescription(e.target.value)}
                          className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none resize-none"
                        />
                      </div>
                    </div>

                    {/* Selected Components Table */}
                    <div className="flex-1 flex flex-col border border-[var(--alling-border)] rounded-md overflow-hidden bg-gray-50/50 p-3">
                      <h4 className="text-xs font-bold text-[var(--alling-text)] mb-2">
                        Componentes del Kit ({selectedComponents.length})
                      </h4>
                      <div className="flex-1 overflow-y-auto space-y-2">
                        {selectedComponents.length === 0 ? (
                          <p className="text-xs text-center py-8 text-[var(--alling-metadata)] italic">
                            Seleccione componentes del catálogo en la columna derecha.
                          </p>
                        ) : (
                          selectedComponents.map((item) => (
                            <div
                              key={item.product.id}
                              className="bg-white p-2.5 rounded-md border border-[var(--alling-border)] flex items-center justify-between shadow-2xs"
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="text-xs font-semibold text-[var(--alling-text)] truncate">
                                  {item.product.name}
                                </div>
                                <div className="text-[0.7rem] text-[var(--alling-metadata)]">
                                  SKU: {item.product.sku} | S/ {item.product.price_public.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateQuantity(item.product.id, parseInt(e.target.value) || 1)
                                  }
                                  className="w-12 border border-[var(--alling-border)] rounded-md p-1 text-center text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeComponent(item.product.id)}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold px-1.5"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Accumulator Box */}
                      <div className="border-t border-[var(--alling-border)] pt-3 mt-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--alling-text)]">
                          Total acumulado:
                        </span>
                        <span className="text-base font-extrabold text-[var(--alling-primary)]">
                          S/ {accumulatedPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Searchable Catalog List */}
                  <div className="flex flex-col border border-[var(--alling-border)] rounded-md overflow-hidden bg-white p-3">
                    <h4 className="text-xs font-bold text-[var(--alling-text)] mb-2">
                      Buscar en Catálogo de Referencia
                    </h4>

                    {/* Catalog Filters */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Nombre, SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border border-[var(--alling-border)] rounded-md px-2.5 py-1.5 text-xs outline-none"
                      />
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="border border-[var(--alling-border)] rounded-md px-2 py-1 text-xs bg-white"
                      >
                        <option value="all">Categorías</option>
                        {uniqueCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Candidate Catalog Scroll list */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {filteredCandidates.length === 0 ? (
                        <p className="text-xs text-center py-8 text-[var(--alling-metadata)]">
                          No hay productos coincidentes activos.
                        </p>
                      ) : (
                        filteredCandidates.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 border border-gray-100 rounded-md hover:bg-slate-50 transition-colors flex items-center justify-between"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <span className="block text-xs font-bold text-slate-800 truncate">
                                {p.name}
                              </span>
                              <span className="text-[0.7rem] text-[var(--alling-metadata)] block">
                                SKU: {p.sku} | S/ {p.price_public.toFixed(2)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => addComponent(p)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded transition-colors border border-blue-200"
                            >
                              + Agregar
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 border-t border-[var(--alling-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm text-[var(--alling-metadata)] hover:text-[var(--alling-text)] font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateKit}
                    disabled={saving}
                    className="bg-[var(--alling-primary)] text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-[var(--alling-primary-hover)] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {saving ? "Crear Kit..." : "Confirmar y Guardar Kit"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
