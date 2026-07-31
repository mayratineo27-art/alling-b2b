"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import KitImageUploader from "@/components/admin/KitImageUploader";
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
  image_url?: string | null;
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

  // Kit edit and options dropdown state
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [openDropdownKitId, setOpenDropdownKitId] = useState<string | null>(null);
  const [kitImageUrl, setKitImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownKitId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleOpenCreateKit = () => {
    setEditingKit(null);
    setKitName("");
    setKitDescription("");
    setKitImageUrl(null);
    setSelectedComponents([]);
    setShowModal(true);
  };

  const handleOpenEditKit = (k: Kit) => {
    setEditingKit(k);
    setKitName(k.name || "");
    setKitDescription(k.description || "");
    setKitImageUrl(k.image_url ?? null);

    const countsMap: { [id: string]: number } = {};
    (k.component_ids || []).forEach((id) => {
      countsMap[id] = (countsMap[id] || 0) + 1;
    });

    const preloaded: SelectedComponent[] = [];
    Object.entries(countsMap).forEach(([pId, qty]) => {
      const prod = products.find((p) => p.id === pId);
      if (prod) {
        preloaded.push({ product: prod, quantity: qty });
      }
    });

    setSelectedComponents(preloaded);
    setShowModal(true);
  };

  const handleDeleteKit = async (kitId: string, kitName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el kit "${kitName}"?`)) {
      return;
    }
    try {
      const res = await apiClient.delete(`/admin/kits/${kitId}`);
      showToast(res.data?.message || `Kit "${kitName}" eliminado`);
      fetchKits();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al eliminar el kit", "error");
    }
  };

  const handleCreateKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitName.trim()) {
      showToast("El nombre del kit es requerido", "error");
      return;
    }

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
      if (editingKit) {
        await apiClient.put(`/admin/kits/${editingKit.id}`, {
          name: kitName,
          description: kitDescription || undefined,
          image_url: kitImageUrl || undefined,
          component_ids: componentIds,
        });
        showToast("Kit actualizado exitosamente");
      } else {
        await apiClient.post("/admin/kits", {
          name: kitName,
          description: kitDescription || undefined,
          image_url: kitImageUrl || undefined,
          component_ids: componentIds,
        });
        showToast("Kit creado exitosamente");
      }
      setShowModal(false);
      setEditingKit(null);
      setKitName("");
      setKitDescription("");
      setKitImageUrl(null);
      setSelectedComponents([]);
      fetchKits();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al guardar el kit", "error");
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
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Kits B2B</h1>
              <p className="text-xs text-slate-500 mt-1">
                Estructuración de paquetes multiespecialidad con cálculo dinámico de costos e inventario.
              </p>
            </div>
            <button
              onClick={handleOpenCreateKit}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Kit Personalizado
            </button>
          </div>

          {/* Toast */}
          {toast && (
            <div
              className={`p-4 rounded-lg shadow-xs flex justify-between items-center transition-all ${
                toast.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              <span className="text-xs font-semibold">{toast.message}</span>
              <button onClick={() => setToast(null)} className="text-xs font-bold hover:underline">
                [Ok]
              </button>
            </div>
          )}
          {loading ? (
            <p className="text-center py-12 text-slate-400 text-xs font-medium">Cargando kits y componentes...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {kits.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-500 text-xs shadow-xs font-medium">
                  No se han estructurado kits de instalación. Utiliza el botón superior para crear tu primer kit.
                </div>
              ) : (
                kits.map((k) => (
                  <div
                    key={k.id}
                    className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group"
                  >
                    {/* Kit Image Header */}
                    <div className="w-full h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                      <img
                        src={k.image_url || "/assets/category-placeholder.svg"}
                        alt={k.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/assets/category-placeholder.svg";
                        }}
                      />
                      {!k.image_url && (
                        <span className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-semibold bg-slate-100/80 backdrop-blur-xs">
                          📦 Sin imagen de kit
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <h3 className="font-bold text-base text-slate-900 truncate">{k.name}</h3>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownKitId(openDropdownKitId === k.id ? null : k.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors font-bold text-base w-7 h-7 flex items-center justify-center shrink-0"
                            aria-label="Menú de opciones"
                          >
                            ⋮
                          </button>

                          {openDropdownKitId === k.id && (
                            <div className="absolute right-4 top-12 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1 text-left text-xs font-medium">
                              <button
                                onClick={() => {
                                  setOpenDropdownKitId(null);
                                  handleOpenEditKit(k);
                                }}
                                className="w-full px-4 py-2 hover:bg-amber-50 text-amber-900 flex items-center gap-2 transition-colors"
                              >
                                ✏️ Editar kit
                              </button>
                              <div className="border-t border-slate-100 my-1"></div>
                              <button
                                onClick={() => {
                                  setOpenDropdownKitId(null);
                                  handleDeleteKit(k.id, k.name);
                                }}
                                className="w-full px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors font-semibold"
                              >
                                🗑️ Eliminar kit
                              </button>
                            </div>
                          )}
                        </div>
                        {k.description ? (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                            {k.description}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic mb-4">Sin descripción adicional</p>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {k.component_ids.length} Componentes
                        </span>
                        {(k as any).price !== undefined && (
                          <span className="text-sm font-bold text-slate-900">
                            S/ {Number((k as any).price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* BUILDER MODAL */}

          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl p-6 h-[88vh] flex flex-col justify-between">
                {/* Modal Title */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {editingKit ? "Editar Kit B2B" : "Constructor de Kits"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Combina varios componentes en un kit con imagen y precio acumulado dinámico.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-900 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* Modal Split Content */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 my-4 overflow-hidden">
                  {/* Left Column: Form & Image Uploader */}
                  <div className="flex flex-col overflow-y-auto pr-2 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nombre del Kit *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Kit Abonado Fibra Óptica"
                          value={kitName}
                          onChange={(e) => setKitName(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Propósito, velocidad, etc."
                          value={kitDescription}
                          onChange={(e) => setKitDescription(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        />
                      </div>

                      {/* Kit Image Uploader (PC & IA) */}
                      <KitImageUploader
                        kit={editingKit}
                        initialImageUrl={kitImageUrl}
                        onImageUpdated={(kitId, newUrl) => setKitImageUrl(newUrl)}
                        onImageSelectedForNewKit={(url) => setKitImageUrl(url)}
                      />
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
                    {saving ? "Guardando..." : editingKit ? "Guardar Cambios del Kit" : "Confirmar y Crear Kit"}
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
