"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price_public: number;
  stock: number;
  is_active: boolean;
  category?: string;
  category_id?: string;
  brand?: string;
  description?: string;
  image_url?: string;
}

export default function AdminProductosPage() {
  // Tabs: "productos" | "categorias"
  const [activeTab, setActiveTab] = useState<"productos" | "categorias">("productos");

  // State for products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // State for categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // General feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals / Forms
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  // Product form
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    price_public: "",
    stock: "0",
    description: "",
    category: "",
    brand: "",
  });

  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await apiClient.get("/admin/categorias");
      setCategories(res.data);
    } catch {
      showToast("Error al cargar las categorías", "error");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch all products (including inactive)
  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await apiClient.get("/admin/productos");
      setProducts(res.data);
    } catch {
      showToast("Error al cargar los productos", "error");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // Handle active/inactive toggle
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await apiClient.patch(`/admin/productos/${id}/toggle-active`);
      const updatedStatus = res.data.is_active;
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: updatedStatus } : p))
      );
      showToast(`Producto ${updatedStatus ? "activado" : "desactivado"} correctamente`);
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al cambiar estado del producto", "error");
    }
  };

  // Create Product submission
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.price_public) {
      showToast("Por favor complete los campos obligatorios", "error");
      return;
    }
    setSavingProduct(true);
    try {
      await apiClient.post("/admin/productos", {
        ...productForm,
        price_public: parseFloat(productForm.price_public),
        stock: parseInt(productForm.stock) || 0,
      });
      showToast("Producto creado correctamente");
      setShowProductModal(false);
      setProductForm({
        name: "",
        sku: "",
        price_public: "",
        stock: "0",
        description: "",
        category: "",
        brand: "",
      });
      fetchProducts();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al crear producto", "error");
    } finally {
      setSavingProduct(false);
    }
  };

  // Create Category submission
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) {
      showToast("El nombre de la categoría es obligatorio", "error");
      return;
    }
    setSavingCategory(true);
    try {
      await apiClient.post("/admin/categorias", categoryForm);
      showToast("Categoría creada correctamente");
      setShowCategoryModal(false);
      setCategoryForm({ name: "", description: "", icon: "" });
      fetchCategories();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al crear la categoría", "error");
    } finally {
      setSavingCategory(false);
    }
  };

  // Delete Category (Enforces RN-ADM-03)
  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar la categoría "${catName}"?`)) return;
    try {
      await apiClient.delete(`/admin/categorias/${catId}`);
      showToast(`Categoría "${catName}" eliminada correctamente`);
      fetchCategories();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al eliminar categoría", "error");
    }
  };

  // File Upload handler for excel/csv catalog importer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingExcel(true);
    try {
      const res = await apiClient.post("/admin/productos/excel-import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast(
        `Carga completada: ${res.data.created_count} creados, ${res.data.updated_count} actualizados.`
      );
      fetchProducts();
      fetchCategories();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al importar catálogo masivo", "error");
    } finally {
      setUploadingExcel(false);
      e.target.value = ""; // clear file input
    }
  };

  // Filter products by search terms, brand, and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());

    const matchesBrand = brandFilter === "all" || p.brand === brandFilter;

    // Matches category name or matches by ID
    const matchesCategory =
      categoryFilter === "all" ||
      p.category === categoryFilter ||
      p.category_id === categoryFilter;

    return matchesSearch && matchesBrand && matchesCategory;
  });

  // Extract unique brands for brand filter
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[];

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--alling-border)] pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--alling-text)]">Gobernanza del Catálogo</h1>
              <p className="text-sm text-[var(--alling-metadata)] mt-1">
                Administra los productos de referencia, imágenes, categorías y cargas masivas del catálogo.
              </p>
            </div>
            {/* Tab selector */}
            <div className="flex bg-gray-200 p-1.5 rounded-lg border border-[var(--alling-border)]">
              <button
                onClick={() => setActiveTab("productos")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "productos"
                    ? "bg-white text-[var(--alling-text)] shadow-sm"
                    : "text-gray-600 hover:text-[var(--alling-text)]"
                }`}
              >
                📦 Productos
              </button>
              <button
                onClick={() => setActiveTab("categorias")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "categorias"
                    ? "bg-white text-[var(--alling-text)] shadow-sm"
                    : "text-gray-600 hover:text-[var(--alling-text)]"
                }`}
              >
                🏷️ Categorías
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div
              className={`p-4 rounded-md shadow-md flex justify-between items-center transition-all ${
                toast.type === "success"
                  ? "bg-green-50 border-l-4 border-green-500 text-green-700"
                  : "bg-red-50 border-l-4 border-red-500 text-red-700"
              }`}
            >
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => setToast(null)} className="text-xs font-bold hover:underline ml-4">
                [Cerrar]
              </button>
            </div>
          )}

          {activeTab === "productos" ? (
            /* TAB: PRODUCTS */
            <div className="space-y-6">
              {/* Toolbar Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-[var(--alling-border)] shadow-sm">
                {/* Search & Filters */}
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-[var(--alling-border)] rounded-md text-sm outline-none focus:ring-2 focus:ring-[var(--alling-primary)]"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                  </div>

                  {/* Brand Filter */}
                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="all">Todas las marcas</option>
                    {uniqueBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>

                  {/* Category Filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Import/Create Button */}
                <div className="flex items-center gap-3">
                  {/* CSV Importer */}
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-[var(--alling-border)] px-4 py-2 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs">
                    📥 {uploadingExcel ? "Cargando..." : "Carga Masiva (CSV)"}
                    <input
                      type="file"
                      accept=".csv, .xlsx"
                      onChange={handleFileUpload}
                      disabled={uploadingExcel}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => setShowProductModal(true)}
                    className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-[var(--alling-primary-hover)] transition-colors shadow-sm"
                  >
                    + Nuevo Producto
                  </button>
                </div>
              </div>

              {/* Products Table */}
              {loadingProducts ? (
                <div className="text-center py-12 text-[var(--alling-metadata)]">
                  Cargando catálogo de productos...
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-[var(--alling-border)] overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-[var(--alling-border)]">
                      <tr>
                        <th className="text-left px-6 py-3 font-semibold text-[var(--alling-text)]">Producto</th>
                        <th className="text-left px-6 py-3 font-semibold text-[var(--alling-text)]">SKU</th>
                        <th className="text-left px-6 py-3 font-semibold text-[var(--alling-text)]">Marca</th>
                        <th className="text-left px-6 py-3 font-semibold text-[var(--alling-text)]">Categoría</th>
                        <th className="text-right px-6 py-3 font-semibold text-[var(--alling-text)]">Precio Público</th>
                        <th className="text-right px-6 py-3 font-semibold text-[var(--alling-text)]">Stock</th>
                        <th className="text-center px-6 py-3 font-semibold text-[var(--alling-text)]">Estado</th>
                        <th className="text-center px-6 py-3 font-semibold text-[var(--alling-text)]">Visibilidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--alling-border)]">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-[var(--alling-metadata)]">
                            No se encontraron productos coincidentes en el catálogo.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/55 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-[var(--alling-text)]">{p.name}</div>
                              {p.description && (
                                <div className="text-xs text-[var(--alling-metadata)] truncate max-w-sm">
                                  {p.description}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-[var(--alling-metadata)]">
                              {p.sku}
                            </td>
                            <td className="px-6 py-4 text-[var(--alling-text)]">
                              {p.brand ?? "—"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded bg-slate-100 text-[0.8rem] text-slate-700 font-medium">
                                {p.category ?? "General"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-[var(--alling-text)]">
                              S/ {p.price_public.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold">
                              {p.stock}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                                  p.is_active
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                              >
                                {p.is_active ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleToggleActive(p.id, p.is_active)}
                                className={`text-xs font-semibold px-3 py-1 rounded-md border shadow-xs transition-colors ${
                                  p.is_active
                                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                }`}
                              >
                                {p.is_active ? "Desactivar" : "Activar"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* TAB: CATEGORIES */
            <div className="space-y-6">
              {/* Category creation and quick statistics */}
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-[var(--alling-border)] shadow-sm">
                <div>
                  <h3 className="text-base font-semibold text-[var(--alling-text)]">Listado de Categorías</h3>
                  <p className="text-xs text-[var(--alling-metadata)]">
                    Define la clasificación de componentes para facilitar los filtros de Kits.
                  </p>
                </div>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-[var(--alling-primary-hover)] transition-colors shadow-sm"
                >
                  + Nueva Categoría
                </button>
              </div>

              {/* Categories table */}
              {loadingCategories ? (
                <div className="text-center py-12 text-[var(--alling-metadata)]">
                  Cargando categorías...
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-[var(--alling-border)] overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-[var(--alling-border)]">
                      <tr>
                        <th className="text-left px-6 py-3 font-semibold text-[var(--alling-text)]">Icono</th>
                        <th className="text-left px-6 py-3 font-semibold text-[var(--alling-text)]">Categoría</th>
                        <th className="text-left px-6 py-3 font-semibold text-[var(--alling-text)]">Slug</th>
                        <th className="text-left px-6 py-3 font-semibold text-[var(--alling-text)]">Descripción</th>
                        <th className="text-center px-6 py-3 font-semibold text-[var(--alling-text)]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--alling-border)]">
                      {categories.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-[var(--alling-metadata)]">
                            No se han creado categorías de catálogo.
                          </td>
                        </tr>
                      ) : (
                        categories.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50/55 transition-colors">
                            <td className="px-6 py-4 text-lg">{c.icon ?? "🏷️"}</td>
                            <td className="px-6 py-4 font-semibold text-[var(--alling-text)]">
                              {c.name}
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-[var(--alling-metadata)]">
                              {c.slug}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {c.description ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleDeleteCategory(c.id, c.name)}
                                className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline px-3 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PRODUCT CREATION MODAL */}
          {showProductModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[var(--alling-border)] pb-3 mb-4">
                  <h2 className="text-lg font-bold text-[var(--alling-text)]">Crear Nuevo Producto</h2>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-[var(--alling-text)] text-lg"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                        SKU *
                      </label>
                      <input
                        type="text"
                        required
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                        className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                        className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                      Nombre Comercial *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                        Precio Público (S/.) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={productForm.price_public}
                        onChange={(e) =>
                          setProductForm({ ...productForm, price_public: e.target.value })
                        }
                        className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                        Stock Inicial
                      </label>
                      <input
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                      Categoría
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Seleccione una categoría</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                      Descripción del Componente
                    </label>
                    <textarea
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 border-t border-[var(--alling-border)] pt-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="px-4 py-2 text-sm text-[var(--alling-metadata)] hover:text-[var(--alling-text)] font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingProduct}
                      className="bg-[var(--alling-primary)] text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-[var(--alling-primary-hover)] disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {savingProduct ? "Guardando..." : "Crear Producto"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CATEGORY CREATION MODAL */}
          {showCategoryModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between border-b border-[var(--alling-border)] pb-3 mb-4">
                  <h2 className="text-lg font-bold text-[var(--alling-text)]">Crear Categoría</h2>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="text-gray-400 hover:text-[var(--alling-text)] text-lg"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                      Nombre de la Categoría *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Fibra Óptica, Routers..."
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                      Icono / Emoji
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 🔌, 📦, 🏷️"
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                      className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                      Descripción
                    </label>
                    <textarea
                      rows={2}
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, description: e.target.value })
                      }
                      className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--alling-primary)] outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 border-t border-[var(--alling-border)] pt-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(false)}
                      className="px-4 py-2 text-sm text-[var(--alling-metadata)] hover:text-[var(--alling-text)] font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingCategory}
                      className="bg-[var(--alling-primary)] text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-[var(--alling-primary-hover)] disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {savingCategory ? "Guardando..." : "Crear Categoría"}
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
