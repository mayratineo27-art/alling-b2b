// CMP-FU-016, CMP-FU-017, CMP-FU-018: Importación Excel (RF-FU-013 a RF-FU-015, RF-FU-019)
import React, { useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import { useCartContext } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { UploadCloud, CheckCircle, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';

type Exitoso = { sku: string; cantidad: number };
type Advertencia = { sku: string; mensaje: string; disponible: number };
type Error = { sku: string; mensaje: string };

type ImportResult = {
    exitosos: Exitoso[];
    advertencias: Advertencia[];
    errores: Error[];
};

export function ExcelImporter({ formatoId, onImportSuccess }: { formatoId: string, onImportSuccess: () => void }) {
    const { refresh: refreshCart, openDrawer } = useCartContext();
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        // Usa siempre la ruta relativa /backend para que el proxy de Next.js
        // redirija al backend correcto tanto en local como en producción.
        window.open(`/backend/formatos/excel/template`, '_blank');
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file as Blob);

        try {
            const response = await apiClient.post<ImportResult>("/formatos/excel/import", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setResult(response.data);
        } catch (error: any) {
            console.error("Error import", error);
            alert(`Fallo en la importación:\n${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!result) return;

        // RF-FU-013/019: antes este paso era puramente cosmético (alert
        // "Simulado" sin llamar a ningún endpoint) — el archivo se validaba
        // pero nunca se cargaba al Formato Único. Se envían las filas
        // exitosas + con advertencia de stock parcial (RN-FU-10: el backend
        // aplica hasta el stock disponible en vez de rechazar la fila).
        const items = [
            ...result.exitosos.map((item) => ({ sku: item.sku, cantidad: item.cantidad })),
            ...result.advertencias.map((item) => ({ sku: item.sku, cantidad: item.disponible })),
        ];

        setApplying(true);
        try {
            await apiClient.post(`/formatos/${formatoId}/excel/aplicar`, { items });
            setResult(null);
            setFile(null);
            setIsOpen(false);
            await refreshCart();
            onImportSuccess();
            showToast(`${items.length} producto(s) del archivo fueron añadidos a tu Formato Único.`, "success", [
                { label: "Seguir buscando", onClick: () => {} },
                { label: "Ver proforma", onClick: openDrawer },
            ]);
        } catch (error: any) {
            console.error("Error al confirmar importación:", error);
            alert(getErrorMessage(error, "No se pudo aplicar la importación al Formato Único."));
        } finally {
            setApplying(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium"
                >
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    Carga Masiva B2B (Excel/CSV)
                </button>
                <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition shadow-sm font-medium"
                    title="Descargar plantilla CSV"
                >
                    Descargar Plantilla
                </button>
            </div>
        );
    }

    const hasValidItems = result && (result.exitosos.length > 0 || result.advertencias.length > 0);

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 relative">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                ✕
            </button>
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Carga Masiva B2B</h2>
                    <p className="text-gray-500 text-sm mt-1">Sube tu archivo .csv o .xlsx para validar SKUs y añadir en lote.</p>
                </div>
                <button 
                    onClick={handleDownloadTemplate}
                    className="text-blue-600 text-sm font-medium hover:underline flex items-center"
                >
                    Descargar Plantilla
                </button>
            </div>

            <div
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <UploadCloud className={`w-10 h-10 mb-3 ${dragActive ? "text-blue-500" : "text-gray-400"}`} />
                <p className="text-gray-700 font-medium mb-1">Arrastra tu archivo aquí</p>
                <label className="text-blue-600 cursor-pointer font-medium hover:underline text-sm">
                    o selecciona desde tu ordenador
                    <input type="file" className="hidden" accept=".csv, .xlsx" onChange={handleFileChange} />
                </label>
                {file && (
                    <div className="mt-4 p-2 bg-white rounded border border-gray-200 text-sm">
                        <span className="text-green-600 font-bold mr-1">✓</span> {file.name}
                    </div>
                )}
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400 hover:bg-black transition shadow-sm"
                >
                    {loading ? "Procesando..." : "Validar Archivo"}
                </button>
            </div>

            {/* CMP-FU-019: Previsualización con colores */}
            {result && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                    <h3 className="font-bold text-lg mb-4">Resultados de Validación</h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 sticky top-0 shadow-sm">
                                <tr>
                                    <th className="p-3 border-b font-semibold">Estado</th>
                                    <th className="p-3 border-b font-semibold">SKU</th>
                                    <th className="p-3 border-b font-semibold">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {result.exitosos.map((item, idx) => (
                                    <tr key={`success-${idx}`} className="bg-green-50/30">
                                        <td className="p-3 text-green-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> OK</td>
                                        <td className="p-3 font-mono">{item.sku}</td>
                                        <td className="p-3">Cantidad: {item.cantidad}</td>
                                    </tr>
                                ))}
                                {result.advertencias.map((item, idx) => (
                                    <tr key={`warn-${idx}`} className="bg-orange-50/50">
                                        <td className="p-3 text-orange-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Warn</td>
                                        <td className="p-3 font-mono">{item.sku}</td>
                                        <td className="p-3 text-orange-800">{item.mensaje}</td>
                                    </tr>
                                ))}
                                {result.errores.map((item, idx) => (
                                    <tr key={`err-${idx}`} className="bg-red-50/50">
                                        <td className="p-3 text-red-700 flex items-center gap-2"><XCircle className="w-4 h-4" /> Error</td>
                                        <td className="p-3 font-mono">{item.sku}</td>
                                        <td className="p-3 text-red-800">{item.mensaje}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleConfirmImport}
                            disabled={!hasValidItems || applying}
                            className="bg-[#10B981] text-white px-8 py-3 rounded-xl font-bold disabled:bg-gray-300 hover:bg-emerald-600 transition shadow"
                        >
                            {applying ? "Aplicando..." : "Confirmar Importación Válida"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
