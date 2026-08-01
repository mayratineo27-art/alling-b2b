'use client';

import { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import apiClient from '@/lib/api';

interface HeroBannerUploaderProps {
  initialUrl?: string | null;
  onBannerUpdated?: (newUrl: string | null) => void;
}

export function HeroBannerUploader({
  initialUrl,
  onBannerUpdated,
}: HeroBannerUploaderProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'ai'>('file');
  const [currentUrl, setCurrentUrl] = useState<string | null>(initialUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>('Red de fibra óptica B2B con destellos tecnológicos esmeralda');
  const [aiGeneratedUrl, setAiGeneratedUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState<boolean>(false);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUrl !== undefined) {
      setCurrentUrl(initialUrl);
    }
  }, [initialUrl]);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Formato de imagen no permitido. Usa PNG, JPEG o WebP.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'El archivo supera el tamaño máximo permitido de 5 MB.';
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
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
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

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      setError('Ingresa una descripción para generar el banner con IA.');
      return;
    }
    setAiGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiClient.post('/admin/generar-imagen-ia', {
        prompt: aiPrompt,
        entity_type: 'hero_banner',
      });
      const generatedUrl = res.data.image_url;
      setAiGeneratedUrl(generatedUrl);
      setPreviewUrl(generatedUrl);
      setSuccess('¡Banner generado con IA exitosamente! Revisa la vista previa y haz clic en Guardar.');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al generar el banner con IA.';
      setError(msg);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveBanner = async () => {
    const urlToSave = previewUrl || aiGeneratedUrl;
    if (!urlToSave && !selectedFile) {
      setError('Selecciona o genera un banner antes de guardar.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      let finalUrl = urlToSave;
      if (urlToSave) {
        const putRes = await apiClient.put('/admin/configuracion', {
          hero_banner_url: urlToSave,
        });
        finalUrl = putRes.data?.config?.hero_banner_url || urlToSave;
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await apiClient.post('/admin/configuracion/hero-banner/upload', formData);
        finalUrl = uploadRes.data.hero_banner_url;
      }

      setCurrentUrl(finalUrl || null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setAiGeneratedUrl(null);
      setSuccess('Banner de portada actualizado y guardado exitosamente.');
      if (onBannerUpdated) {
        onBannerUpdated(finalUrl || null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al guardar el banner de portada.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!confirm('¿Restablecer el banner de la portada principal a la imagen por defecto?')) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.put('/admin/configuracion', {
        hero_banner_url: '',
      });

      setCurrentUrl(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setAiGeneratedUrl(null);
      setSuccess('Banner de portada restablecido por defecto.');
      if (onBannerUpdated) {
        onBannerUpdated(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al restablecer el banner.';
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };


  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            🖼️ Banner de Portada Principal (Hero)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Personaliza el fondo visual de la página de inicio (<code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">/</code>) subiendo una imagen o generando un diseño panorámico 16:9 con IA.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'file'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          💻 Desde la PC
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'ai'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ✨ Generar con IA
        </button>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Aspect Ratio 16:9 Preview Frame */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Vista Previa de la Portada (16:9)
          </label>
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner flex items-center justify-center">
            {displayUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayUrl}
                alt="Banner Hero Portada"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <p className="text-sm font-semibold text-slate-300">Banner por Defecto</p>
                <p className="text-[0.7rem] text-slate-400 mt-1">Fondo de circuito tecnológico / fibra óptica</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-xs font-extrabold tracking-tight">Portal B2B <span className="text-emerald-400">Alling</span></span>
              <span className="text-[0.65rem] text-slate-300">Abastece tu negocio con los mejores equipos</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-4">
          {activeTab === 'file' ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={onInputChange}
                className="hidden"
              />
              <p className="font-semibold text-xs text-slate-700">Arrastra una imagen de banner o haz clic aquí</p>
              <p className="text-[0.7rem] text-slate-400 mt-1">PNG, JPEG o WebP recomendados en 16:9 (Máx 5 MB)</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Descripción para el Banner IA:
              </label>
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ej. Red de fibra óptica B2B con destellos tecnológicos esmeralda..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
              >
                {aiGenerating ? '⚡ Generando Banner con IA...' : '✨ Generar Banner Panorámico con IA'}
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            {(previewUrl || selectedFile || aiGeneratedUrl) && (
              <button
                type="button"
                onClick={handleSaveBanner}
                disabled={uploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {uploading ? 'Guardando...' : 'Guardar Banner de Portada'}
              </button>
            )}

            {currentUrl && (
              <button
                type="button"
                onClick={handleDeleteBanner}
                disabled={deleting}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
              >
                {deleting ? 'Restableciendo...' : 'Restablecer Banner'}
              </button>
            )}
          </div>

          {error && <p className="text-red-600 text-xs font-semibold">{error}</p>}
          {success && <p className="text-emerald-600 text-xs font-semibold">{success}</p>}
        </div>
      </div>
    </div>
  );
}
