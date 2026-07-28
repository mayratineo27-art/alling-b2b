"use client";

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from "react";
import { Upload, Trash2, ImageIcon, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import apiClient from "@/lib/api";

interface Category {
  id: string;
  name: string;
  image_url?: string | null;
}

interface CategoryImageUploaderProps {
  category: Category;
  adminToken?: string;
  apiBaseUrl?: string;
  onImageUpdated?: (categoryId: string, newImageUrl: string | null) => void;
}


type UploadStatus = "idle" | "validating" | "uploading" | "success" | "error" | "deleting";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const ALLOWED_EXTENSIONS = ".png, .jpg, .jpeg, .webp";
const PLACEHOLDER_URL = "/assets/category-placeholder.svg";

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function CategoryImageUploader({
  category,
  adminToken,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  onImageUpdated,
}: CategoryImageUploaderProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(category.image_url ?? null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return `Tipo no permitido: "${file.type}". Use PNG, JPEG o WebP.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Archivo demasiado grande (${formatBytes(file.size)}). Máximo permitido: 2 MB.`;
    }
    return null;
  }, []);

  const applyFile = useCallback((file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setStatus("validating");

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMsg(validationError);
      setStatus("error");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setStatus("idle");
  }, [validateFile]);

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const cancelSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setStatus("idle");
  };

  const handleUpload = async () => {
    if (!selectedFile && !previewUrl) return;

    setStatus("uploading");
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`;
      }

      let res;
      if (previewUrl) {
        res = await apiClient.patch(
          `/admin/categorias/${category.id}/imagen`,
          { image_url: previewUrl },
          { headers: { ...headers, "Content-Type": "application/json" } }
        );
      } else {
        const formData = new FormData();
        formData.append("file", selectedFile!);
        res = await apiClient.patch(
          `/admin/categorias/${category.id}/imagen`,
          formData,
          { headers: { ...headers, "Content-Type": "multipart/form-data" } }
        );
      }

      const newUrl: string = res.data.image_url;

      setCurrentImageUrl(newUrl);
      setSuccessMsg("Imagen guardada correctamente.");
      setStatus("success");

      setPreviewUrl(null);
      setSelectedFile(null);

      onImageUpdated?.(category.id, newUrl);
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? (err instanceof Error ? err.message : "Error al subir la imagen.");
      setErrorMsg(msg);
      setStatus("error");
    }
  };


  const handleDelete = async () => {
    if (!currentImageUrl) return;

    setStatus("deleting");
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`;
      }

      await apiClient.delete(`/admin/categorias/${category.id}/imagen`, { headers });

      setCurrentImageUrl(null);
      setSuccessMsg("Imagen eliminada. Se mostrará el placeholder.");
      setStatus("success");
      onImageUpdated?.(category.id, null);
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? (err instanceof Error ? err.message : "Error al eliminar la imagen.");
      setErrorMsg(msg);
      setStatus("error");
    }
  };


  const handleGenerateAI = async () => {
    setStatus("uploading");
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await apiClient.post("/admin/generar-imagen-ia", {
        prompt: category.name,
        entity_type: "category"
      });
      const generatedDataUri = res.data.image_url;
      setPreviewUrl(generatedDataUri);
      const fetchRes = await fetch(generatedDataUri);
      const blob = await fetchRes.blob();
      const file = new File([blob], `${category.name || "cat"}-ai.webp`, { type: "image/webp" });
      setSelectedFile(file);
      setStatus("idle");
      setSuccessMsg("✨ Imagen generada con IA. Haz clic en 'Guardar Imagen' para confirmar.");
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? "Error al generar imagen con IA.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const displayUrl = previewUrl ?? currentImageUrl ?? PLACEHOLDER_URL;

  const isUploading = status === "uploading";
  const isDeleting = status === "deleting";
  const isBusy = isUploading || isDeleting;

  return (
    <div className="bg-white border border-[var(--alling-border,#E5E7EB)] rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--alling-border,#E5E7EB)] bg-gray-50">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-[var(--alling-primary,#10B981)]" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Imagen de categoría
          </h3>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded font-mono">
          {category.name}
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-[var(--alling-border,#E5E7EB)] flex items-center justify-center">
          <img
            src={displayUrl}
            alt={`Imagen de categoría: ${category.name}`}
            className="w-full h-full object-contain p-3 transition-opacity duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_URL;
            }}
          />

          {previewUrl && (
            <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Vista previa — sin guardar
            </div>
          )}

          {isBusy && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Loader2 size={28} className="text-[var(--alling-primary,#10B981)] animate-spin" />
              <span className="text-sm font-medium text-gray-700">
                {isUploading ? "Subiendo imagen…" : "Eliminando imagen…"}
              </span>
            </div>
          )}

          {previewUrl && !isBusy && (
            <button
              onClick={cancelSelection}
              title="Cancelar selección"
              className="absolute top-2 right-2 bg-white/90 text-gray-600 hover:text-red-500 p-1 rounded-full shadow transition"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {!previewUrl && (
          <div
            onClick={() => !isBusy && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={[
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
              isDragging
                ? "border-[var(--alling-primary,#10B981)] bg-emerald-50 scale-[1.01]"
                : "border-gray-300 hover:border-[var(--alling-primary,#10B981)] hover:bg-emerald-50/50",
              isBusy ? "pointer-events-none opacity-50" : "",
            ].join(" ")}
          >
            <Upload size={24} className={`mx-auto mb-2 ${isDragging ? "text-[var(--alling-primary,#10B981)]" : "text-gray-400"}`} />
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? "¡Suelta la imagen aquí!" : "Arrastra una imagen o haz clic para seleccionar"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPEG, WebP · Máx. 2 MB
            </p>

            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS}
              onChange={handleFileInput}
              className="hidden"
              id={`cat-img-upload-${category.id}`}
              disabled={isBusy}
            />
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isBusy}
            className="w-full py-2 px-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            <span>✨ Generar Imagen con IA (Gratis)</span>
          </button>
        </div>


        {selectedFile && !isBusy && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
            <ImageIcon size={16} className="text-[var(--alling-primary,#10B981)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">{formatBytes(selectedFile.size)} · {selectedFile.type}</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            <CheckCircle2 size={16} className="text-[var(--alling-primary,#10B981)] shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">{successMsg}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            id={`btn-cat-010-${category.id}`}
            onClick={handleUpload}
            disabled={!selectedFile || isBusy}
            className={[
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
              selectedFile && !isBusy
                ? "bg-[var(--alling-primary,#10B981)] text-white hover:bg-[var(--alling-primary-hover,#059669)] shadow-sm active:scale-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed",
            ].join(" ")}
          >
            {isUploading ? (
              <><Loader2 size={15} className="animate-spin" /> Subiendo…</>
            ) : (
              <><Upload size={15} /> Guardar imagen</>
            )}
          </button>

          {currentImageUrl && (
            <button
              id={`btn-cat-011-${category.id}`}
              onClick={handleDelete}
              disabled={isBusy}
              title="Eliminar imagen (mostrará placeholder)"
              className={[
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border transition-all duration-200",
                !isBusy
                  ? "border-red-200 text-red-600 hover:bg-red-50 active:scale-95"
                  : "border-gray-200 text-gray-400 cursor-not-allowed",
              ].join(" ")}
            >
              {isDeleting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryImageUploader;
