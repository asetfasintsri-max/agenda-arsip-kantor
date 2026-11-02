/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useId } from 'react';
import { 
  FileUp, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  X, 
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { 
  analyzeDocumentFile, 
  AnalyzedDocumentData, 
  FIELD_LABELS_MAP 
} from '../services/documentAnalysis';

interface DocumentAiScanUploaderProps {
  documentType: 'surat_masuk' | 'surat_keluar' | 'telegram';
  onExtracted: (data: AnalyzedDocumentData, file: File, previewUrl?: string) => void;
  onFocusMissingField?: (fieldName: string) => void;
  title?: string;
  description?: string;
}

export const DocumentAiScanUploader: React.FC<DocumentAiScanUploaderProps> = ({
  documentType,
  onExtracted,
  onFocusMissingField,
  title,
  description
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<AnalyzedDocumentData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  const handleProcessFile = async (file: File) => {
    // Validate file type
    const validMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    if (!validMimes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      setErrorMessage('Format berkas tidak didukung. Harap unggah berkas PDF atau Foto (JPG, PNG).');
      return;
    }

    setUploadedFile(file);
    setErrorMessage(null);
    setIsAnalyzing(true);
    setExtractedData(null);

    // Create local preview object URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const response = await analyzeDocumentFile(file, documentType);
      if (response && response.data) {
        setExtractedData(response.data);
        onExtracted(response.data, file, objectUrl);
      } else {
        throw new Error('Tidak ada respon data yang valid dari pemindai.');
      }
    } catch (err: any) {
      console.error('OCR/AI analysis error:', err);
      setErrorMessage(err.message || 'Gagal membaca isi naskah. Anda tetap dapat mengisi data secara manual.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const docLabel = 
    documentType === 'surat_masuk' 
      ? 'Surat Masuk' 
      : documentType === 'surat_keluar' 
      ? 'Surat Keluar' 
      : 'Warta Telegram';

  return (
    <div className="bg-gradient-to-br from-[#0f1e36]/5 to-[#1e3a5f]/10 border-2 border-dashed border-[#0f1e36]/25 hover:border-[#0f1e36]/50 rounded-2xl p-4 transition-all">
      <input
        type="file"
        id={fileInputId}
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
      />

      {/* INITIAL / UPLOAD PROMPT */}
      {!uploadedFile && !isAnalyzing && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-xl transition-all cursor-pointer ${
            isDragging ? 'bg-blue-100/60 ring-2 ring-[#0f1e36]' : ''
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f1e36] to-[#1e3a5f] text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-bold text-sm text-[#0f1e36]">
                  {title || `Ekstraksi Otomatis dari Berkas PDF / Foto (${docLabel})`}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  AI OCR Vision
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {description || 'Unggah scan naskah dinas (PDF atau Foto JPG/PNG). Sistem otomatis menganalisa dan mengisi formulir. Data yang belum terbaca dapat dilengkapi secara manual.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f1e36] hover:bg-[#1a3158] text-white text-xs font-bold shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <FileUp className="w-4 h-4 text-emerald-400" />
              <span>Pilih PDF / Foto</span>
            </button>
          </div>
        </div>
      )}

      {/* ANALYZING STATE */}
      {isAnalyzing && (
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-[#0f1e36] text-white flex items-center justify-center shadow-lg">
              <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </span>
          </div>

          <div>
            <h5 className="font-heading font-bold text-sm text-[#0f1e36]">
              Sedang Menganalisis Berkas {uploadedFile?.name}...
            </h5>
            <p className="text-xs text-slate-500 mt-1">
              Membaca teks, kop surat, nomor naskah, tanggal, perihal, dan klasifikasi militer secara otomatis.
            </p>
          </div>
        </div>
      )}

      {/* COMPLETED EXTRACTION SUMMARY */}
      {uploadedFile && !isAnalyzing && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300">
                {uploadedFile.type.includes('pdf') ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0f1e36] truncate max-w-xs sm:max-w-md">
                    {uploadedFile.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Terbaca ({extractedData?.confidence || 95}%)</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Ukuran: {(uploadedFile.size / 1024).toFixed(1)} KB • Tipe: {uploadedFile.type || 'Dokumen'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Lihat Berkas</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Ganti berkas lain"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Ganti Berkas</span>
              </button>
            </div>
          </div>

          {/* MISSING FIELDS WARNING BANNER & MANUAL INPUT GUIDANCE */}
          {extractedData && extractedData.missingFields && extractedData.missingFields.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Perhatian: Terdapat {extractedData.missingFields.length} data yang belum lengkap / belum terbaca dari berkas.
                </span>
              </div>
              <p className="text-[11px] text-amber-700">
                Silakan lengkapi bidang yang kosong secara manual pada formulir di bawah ini (kolom telah ditandai):
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {extractedData.missingFields.map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => onFocusMissingField?.(field)}
                    className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-900 text-[11px] font-semibold flex items-center gap-1 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3 h-3 text-amber-600" />
                    <span>{FIELD_LABELS_MAP[field] || field}</span>
                    <span className="text-[10px] text-amber-600 underline font-normal">(Isi Manual)</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Semua data kunci naskah berhasil dianalisis dan diisikan ke formulir. Silakan periksa kembali sebelum menyimpan.</span>
            </div>
          )}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL PREVIEW FOR UPLOADED FILE */}
      {isPreviewOpen && previewUrl && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
            <div className="px-4 py-3 bg-[#0f1e36] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs truncate max-w-md">{uploadedFile?.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 overflow-auto p-4 flex items-center justify-center">
              {uploadedFile?.type.includes('pdf') ? (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-full rounded-lg border border-slate-300 shadow-sm"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Scan Preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
