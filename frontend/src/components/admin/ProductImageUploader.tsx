"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import apiClient from "@/lib/api";

interface Product {
  id: string;
  name: string;
  sku?: string;
  image_url?: string | null;
}

interface ProductImageUploaderProps {
  product: Product;
  onImageUpdated: (productId: string, newUrl: string | null) => void;
}

const PLACEHOLDER = "/assets/category-placeholder.svg";

export default function ProductImageUploader({
  product,
  onImageUpdated,
}: ProductImageUploaderProps) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(product.image_url ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return "Formato no permitido. Solo se aceptan PNG, JPEG o WebP.";
    }
    if (file.size > 2 * 1024 * 1024) {
      return "El archivo supera el tamaño máximo permitido de 2 MB.";
    }
    return null;
  };

  const handleFileChange = (file: File) => {
    setError(null);
    setSuccess(null);
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await apiClient.patch(
        `/admin/productos/${product.id}/imagen`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const newUrl = response.data.image_url;
      setCurrentUrl(newUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      setSuccess("Imagen de producto actualizada correctamente");
      onImageUpdated(product.id, newUrl);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        "Error al subir la imagen. Intenta de nuevo.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la imagen de "${product.name}"?`)) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.delete(`/admin/productos/${product.id}/imagen`);
      setCurrentUrl(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setSuccess("Imagen de producto eliminada correctamente");
      onImageUpdated(product.id, null);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        "Error al eliminar la imagen. Intenta de nuevo.";
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateAI = async () => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient.post("/admin/generar-imagen-ia", {
        prompt: product.name,
        entity_type: "product"
      });
      const generatedDataUri = response.data.image_url;
      setPreviewUrl(generatedDataUri);
      const fetchRes = await fetch(generatedDataUri);
      const blob = await fetchRes.blob();
      const file = new File([blob], `${product.name || "prod"}-ai.webp`, { type: "image/webp" });
      setSelectedFile(file);
      setSuccess("✨ Imagen generada con IA. Haz clic en 'Guardar Imagen' para confirmar.");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Error al generar imagen con IA.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const displaySrc = previewUrl || currentUrl || PLACEHOLDER;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm max-w-md w-full">
      <h3 className="text-base font-bold text-gray-800 mb-1">
        Imagen Referencial de Producto
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Producto: <span className="font-semibold text-gray-700">{product.name}</span>
        {product.sku && ` (${product.sku})`}
      </p>

      <div className="relative w-full h-44 bg-gray-50 rounded-lg overflow-hidden mb-4 border border-gray-200 flex items-center justify-center">
        <img
          src={displaySrc}
          alt={product.name}
          className="w-full h-full object-contain p-2"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
        {previewUrl && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
            Vista Previa
          </span>
        )}
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors mb-3 ${
          isDragging
            ? "border-[#10B981] bg-emerald-50"
            : "border-gray-300 hover:border-[#10B981] hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={onInputChange}
          className="hidden"
        />
        <p className="text-xs font-semibold text-gray-700">
          Arrastra tu imagen aquí o <span className="text-[#10B981] underline">explora</span>
        </p>
        <p className="text-[11px] text-gray-400 mt-1">PNG, JPEG o WebP (máx. 2 MB)</p>
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={handleGenerateAI}
          disabled={uploading || deleting}
          className="w-full py-2 px-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
        >
          <span>✨ Generar Imagen con IA (Gratis)</span>
        </button>
      </div>


      {error && (
        <div className="mb-3 p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
          {success}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        {currentUrl && !previewUrl && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 rounded text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar Imagen"}
          </button>
        )}

        {selectedFile && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-1.5 rounded text-xs font-semibold text-white bg-[#10B981] hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : "Guardar Imagen"}
          </button>
        )}
      </div>
    </div>
  );
}
