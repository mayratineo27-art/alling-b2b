"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import apiClient from "@/lib/api";

interface Kit {
  id?: string;
  name: string;
  image_url?: string | null;
}

interface KitImageUploaderProps {
  kit?: Kit | null;
  initialImageUrl?: string | null;
  onImageUpdated?: (kitId: string, newUrl: string | null) => void;
  onImageSelectedForNewKit?: (imageUrl: string | null) => void;
}

const PLACEHOLDER = "/assets/category-placeholder.svg";

export default function KitImageUploader({
  kit,
  initialImageUrl,
  onImageUpdated,
  onImageSelectedForNewKit,
}: KitImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"file" | "ai">("file");
  const [currentUrl, setCurrentUrl] = useState<string | null>(kit?.image_url ?? initialImageUrl ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados de IA
  const [aiPrompt, setAiPrompt] = useState<string>(kit?.name ? `Kit de instalación ${kit.name} fibra óptica y redes` : "Kit de telecomunicaciones y fibra óptica");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedUrl, setAiGeneratedUrl] = useState<string | null>(null);

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

    if (onImageSelectedForNewKit) {
      onImageSelectedForNewKit(objectUrl);
    }
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
    if (!kit?.id) {
      if (previewUrl || aiGeneratedUrl) {
        const targetUrl = aiGeneratedUrl || previewUrl;
        setCurrentUrl(targetUrl);
        setSuccess("Imagen de kit vinculada");
        if (onImageSelectedForNewKit) {
          onImageSelectedForNewKit(targetUrl);
        }
      }
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        response = await apiClient.post(
          `/admin/kits/${kit.id}/imagen/upload`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else if (previewUrl || aiGeneratedUrl) {
        const urlToSave = aiGeneratedUrl || previewUrl;
        response = await apiClient.patch(
          `/admin/kits/${kit.id}/imagen`,
          { image_url: urlToSave },
          { headers: { "Content-Type": "application/json" } }
        );
      } else {
        setError("Selecciona o genera una imagen válida.");
        setUploading(false);
        return;
      }

      const newUrl = response.data.image_url;
      setCurrentUrl(newUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      setAiGeneratedUrl(null);
      setSuccess("Imagen de Kit guardada de forma permanente");
      if (onImageUpdated) {
        onImageUpdated(kit.id, newUrl);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Error al guardar la imagen del kit.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (kit?.id) {
      if (!confirm(`¿Eliminar la imagen de este kit?`)) return;
      setDeleting(true);
      setError(null);
      setSuccess(null);

      try {
        await apiClient.delete(`/admin/kits/${kit.id}/imagen`);
        setCurrentUrl(null);
        setPreviewUrl(null);
        setSelectedFile(null);
        setAiGeneratedUrl(null);
        setSuccess("Imagen de kit eliminada");
        if (onImageUpdated) {
          onImageUpdated(kit.id, null);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Error al eliminar la imagen");
      } finally {
        setDeleting(false);
      }
    } else {
      setCurrentUrl(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setAiGeneratedUrl(null);
      if (onImageSelectedForNewKit) {
        onImageSelectedForNewKit(null);
      }
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      setError("Ingresa una descripción para generar la imagen con IA.");
      return;
    }
    setAiGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiClient.post("/admin/generar-imagen-ia", {
        prompt: aiPrompt,
        entity_type: "product",
      });
      const generatedUrl = res.data.image_url;
      setAiGeneratedUrl(generatedUrl);
      setPreviewUrl(generatedUrl);
      setSuccess("¡Imagen generada con IA! Revisa la vista previa y haz clic en Guardar.");

      if (onImageSelectedForNewKit) {
        onImageSelectedForNewKit(generatedUrl);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al generar imagen con IA.");
    } finally {
      setAiGenerating(false);
    }
  };

  const displayUrl = previewUrl || aiGeneratedUrl || currentUrl || PLACEHOLDER;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          🖼️ Imagen del Kit
        </span>
        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              activeTab === "file" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            💻 Desde la PC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              activeTab === "ai" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            ✨ Generar con IA
          </button>
        </div>
      </div>

      {/* Preview container */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-32 h-32 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shrink-0 relative flex items-center justify-center">
          <img
            src={displayUrl}
            alt="Vista previa"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER;
            }}
          />
          {previewUrl && (
            <span className="absolute bottom-1 right-1 bg-amber-500 text-white text-[0.65rem] px-1.5 py-0.5 rounded font-bold">
              Vista previa
            </span>
          )}
        </div>

        <div className="flex-1 w-full space-y-3">
          {activeTab === "file" ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragging ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={onInputChange}
                className="hidden"
              />
              <p className="font-semibold text-slate-700">Arrastra una imagen o haz clic aquí</p>
              <p className="text-[0.7rem] text-slate-400 mt-1">PNG, JPEG o WebP (Máx 2 MB)</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-[0.7rem] font-semibold text-slate-700">
                Descripción para la IA:
              </label>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ej. Kit de empalme óptico profesional..."
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {aiGenerating ? (
                  <>⚡ Generando con IA...</>
                ) : (
                  <>✨ Generar Imagen con IA</>
                )}
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {(previewUrl || selectedFile || aiGeneratedUrl) && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {uploading ? "Guardando..." : "Guardar Imagen del Kit"}
              </button>
            )}

            {(currentUrl || previewUrl || aiGeneratedUrl) && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar Imagen"}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-[0.7rem] font-semibold">{error}</p>}
      {success && <p className="text-emerald-600 text-[0.7rem] font-semibold">{success}</p>}
    </div>
  );
}
