/**
 * CMP-CAT-031 — Uploader de Imagen de Categoría
 *
 * RF-CAT-009 / OPS-CAT-004 / CA-CAT-009
 * RN relacionadas: RN-CAT-IMG-01 (solo ADMIN), RN-CAT-IMG-02 (tipo/tamaño),
 *                  RN-CAT-IMG-03 (URL en BD), RN-CAT-IMG-04 (placeholder),
 *                  RN-CAT-IMG-05 (delete sin borrar categoría)
 *
 * Solo renderiza en contexto ADMIN.
 * Endpoints: PATCH /admin/categorias/{id}/imagen
 *            DELETE /admin/categorias/{id}/imagen
 */

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { Upload, Trash2, ImageIcon, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  image_url: string | null;
}

interface CategoryImageUploaderProps {
  /** Categoría sobre la que se opera */
  category: Category;
  /** Token JWT del ADMIN autenticado */
  adminToken: string;
  /** URL base del backend (sin trailing slash) */
  apiBaseUrl?: string;
  /** Callback al persistir exitosamente una nueva URL */
  onImageUpdated?: (categoryId: string, newImageUrl: string | null) => void;
}

type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error' | 'deleting';

// ─── Constantes (RN-CAT-IMG-02) ───────────────────────────────────────────────

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const ALLOWED_EXTENSIONS = '.png, .jpg, .jpeg, .webp';
const PLACEHOLDER_URL = '/assets/category-placeholder.svg';

// ─── Helper: legible de bytes ─────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CategoryImageUploader({
  category,
  adminToken,
  apiBaseUrl = '/api',
  onImageUpdated,
}: CategoryImageUploaderProps) {
  // Estado de la imagen actualmente almacenada
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(category.image_url);

  // Preview local (antes de subir)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estado de la operación
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Validación local del archivo (RN-CAT-IMG-02) ─────────────────────────

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
    setStatus('validating');

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMsg(validationError);
      setStatus('error');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setStatus('idle');
  }, [validateFile]);

  // ── Handlers de input y drag & drop ─────────────────────────────────────

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
    // Reset input para permitir re-selección del mismo archivo
    e.target.value = '';
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

  // ── Cancelar selección ────────────────────────────────────────────────────

  const cancelSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setStatus('idle');
  };

  // ── Subir imagen → PATCH /admin/categorias/{id}/imagen ───────────────────

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${apiBaseUrl}/admin/categorias/${category.id}/imagen`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail ?? `Error HTTP ${res.status}`);
      }

      // Persistir URL en estado local
      const newUrl: string = data.image_url;
      setCurrentImageUrl(newUrl);
      setSuccessMsg('Imagen guardada correctamente.');
      setStatus('success');

      // Limpiar preview
      URL.revokeObjectURL(previewUrl ?? '');
      setPreviewUrl(null);
      setSelectedFile(null);

      onImageUpdated?.(category.id, newUrl);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al subir la imagen.');
      setStatus('error');
    }
  };

  // ── Eliminar imagen → DELETE /admin/categorias/{id}/imagen ───────────────

  const handleDelete = async () => {
    if (!currentImageUrl) return;

    setStatus('deleting');
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admin/categorias/${category.id}/imagen`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? `Error HTTP ${res.status}`);
      }

      setCurrentImageUrl(null);
      setSuccessMsg('Imagen eliminada. Se mostrará el placeholder.');
      setStatus('success');
      onImageUpdated?.(category.id, null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al eliminar la imagen.');
      setStatus('error');
    }
  };

  // ── Imagen que se muestra en el panel (RN-CAT-IMG-04) ────────────────────

  const displayUrl = previewUrl ?? currentImageUrl ?? PLACEHOLDER_URL;
  const isUploading = status === 'uploading';
  const isDeleting = status === 'deleting';
  const isBusy = isUploading || isDeleting;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gray-50">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Imagen de categoría
          </h3>
        </div>
        <span className="text-xs text-text-metadata bg-muted px-2 py-1 rounded font-mono">
          {category.name}
        </span>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Vista previa ──────────────────────────────────────────────── */}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center">
          <img
            src={displayUrl}
            alt={`Imagen de categoría: ${category.name}`}
            className="w-full h-full object-contain p-3 transition-opacity duration-300"
            onError={(e) => {
              // RN-CAT-IMG-04: nunca URL rota
              (e.target as HTMLImageElement).src = PLACEHOLDER_URL;
            }}
          />

          {/* Badge "Preview" si hay archivo seleccionado pendiente */}
          {previewUrl && (
            <div className="absolute top-2 left-2 bg-warning/90 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Vista previa — sin guardar
            </div>
          )}

          {/* Indicador de carga superpuesto */}
          {isBusy && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Loader2 size={28} className="text-primary animate-spin" />
              <span className="text-sm font-medium text-gray-700">
                {isUploading ? 'Subiendo imagen…' : 'Eliminando imagen…'}
              </span>
            </div>
          )}

          {/* Botón cancelar preview */}
          {previewUrl && !isBusy && (
            <button
              onClick={cancelSelection}
              title="Cancelar selección"
              className="absolute top-2 right-2 bg-white/90 text-gray-600 hover:text-danger p-1 rounded-full shadow transition"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Zona Drag & Drop ──────────────────────────────────────────── */}
        {!previewUrl && (
          <div
            onClick={() => !isBusy && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={[
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary hover:bg-primary/5',
              isBusy ? 'pointer-events-none opacity-50' : '',
            ].join(' ')}
          >
            <Upload size={24} className={`mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-text-metadata'}`} />
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? '¡Suelta la imagen aquí!' : 'Arrastra una imagen o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-text-metadata mt-1">
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

        {/* ── Info del archivo seleccionado ─────────────────────────────── */}
        {selectedFile && !isBusy && (
          <div className="flex items-center gap-3 bg-muted rounded-lg px-4 py-3 border border-border">
            <ImageIcon size={16} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{selectedFile.name}</p>
              <p className="text-xs text-text-metadata">{formatBytes(selectedFile.size)} · {selectedFile.type}</p>
            </div>
          </div>
        )}

        {/* ── Feedback de estado ────────────────────────────────────────── */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
            <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger font-medium">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 bg-success/10 border border-success/30 rounded-lg px-4 py-3">
            <CheckCircle2 size={16} className="text-success shrink-0" />
            <p className="text-sm text-success font-medium">{successMsg}</p>
          </div>
        )}

        {/* ── Acciones (BTN-CAT-010 / BTN-CAT-011) ────────────────────── */}
        <div className="flex gap-3">

          {/* BTN-CAT-010: Guardar imagen */}
          <button
            id={`btn-cat-010-${category.id}`}
            onClick={handleUpload}
            disabled={!selectedFile || isBusy}
            className={[
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200',
              selectedFile && !isBusy
                ? 'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            ].join(' ')}
          >
            {isUploading ? (
              <><Loader2 size={15} className="animate-spin" /> Subiendo…</>
            ) : (
              <><Upload size={15} /> Guardar imagen</>
            )}
          </button>

          {/* BTN-CAT-011: Eliminar imagen — solo visible si hay imagen guardada */}
          {currentImageUrl && (
            <button
              id={`btn-cat-011-${category.id}`}
              onClick={handleDelete}
              disabled={isBusy}
              title="Eliminar imagen (mostrará placeholder)"
              className={[
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border transition-all duration-200',
                !isBusy
                  ? 'border-danger/40 text-danger hover:bg-danger/10 active:scale-95'
                  : 'border-border text-gray-400 cursor-not-allowed',
              ].join(' ')}
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

        {/* ── Nota informativa ─────────────────────────────────────────── */}
        <p className="text-xs text-text-metadata text-center">
          La imagen se mostrará en la Landing Page y la vista de exploración de categorías.
          {!currentImageUrl && ' Sin imagen, se muestra un placeholder SVG.'}
        </p>

      </div>
    </div>
  );
}

export default CategoryImageUploader;
