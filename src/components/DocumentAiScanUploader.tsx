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
  Edit3,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileCheck2,
  HelpCircle,
  Lightbulb
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
  
  // Inspection & Reading Details drawer
  const [isInspectionOpen, setIsInspectionOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'transcription' | 'intelligence' | 'metadata'>('transcription');
  const [isCopied, setIsCopied] = useState(false);
  
  // Modal Preview Zoom & Rotate
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);

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
      setErrorMessage('Format berkas tidak didukung. Harap unggah berkas PDF atau Foto (JPG, PNG, WEBP).');
      return;
    }

    setUploadedFile(file);
    setErrorMessage(null);
    setIsAnalyzing(true);
    setExtractedData(null);
    setIsInspectionOpen(true);
    setZoomLevel(100);
    setRotation(0);

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

  const handleCopyTranscription = () => {
    if (extractedData?.rawTextSnippet) {
      navigator.clipboard.writeText(extractedData.rawTextSnippet);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReapplyForm = () => {
    if (extractedData && uploadedFile) {
      onExtracted(extractedData, uploadedFile, previewUrl || undefined);
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
                {description || 'Unggah scan naskah dinas (PDF atau Foto JPG/PNG). Sistem otomatis membaca dan menganalisa teks dokumen, lalu mengisi formulir. Kolom yang kosong tetap dapat dilengkapi secara manual.'}
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
        <div className="py-7 flex flex-col items-center justify-center text-center space-y-3">
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
              Sedang Membaca & Menganalisis Dokumen {uploadedFile?.name}...
            </h5>
            <p className="text-xs text-slate-500 mt-1 max-w-lg">
              Melakukan pemindaian OCR mendalam, membaca KOP, nomor dinas, butir-butir teks, instansi pengirim, dan membuat intisari intelijen administrasi.
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
                {uploadedFile.name.toLowerCase().endsWith('.pdf') ? (
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
              <button
                type="button"
                onClick={() => setIsInspectionOpen(!isInspectionOpen)}
                className="px-3 py-1.5 rounded-lg bg-[#0f1e36] hover:bg-[#1a3158] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Buka atau tutup rincian hasil pembacaan naskah dan teks OCR"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hasil Baca Dokumen</span>
                {isInspectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

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
                  Opsi Pengisian Manual Aktif: Terdapat {extractedData.missingFields.length} bidang data yang belum lengkap / belum terbaca dari naskah.
                </span>
              </div>
              <p className="text-[11px] text-amber-700">
                Sistem tidak mendeteksi data berikut pada naskah secara pasti. Silakan klik atau ketik langsung pada formulir berlabel oranye di bawah ini:
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

          {/* EXPANDABLE INSPECTION & READING DRAWER */}
          {isInspectionOpen && extractedData && (
            <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden mt-2 animate-in fade-in duration-200">
              {/* Drawer Tabs */}
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('transcription')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeTab === 'transcription'
                        ? 'bg-[#0f1e36] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Teks Transkripsi Terbaca</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('intelligence')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeTab === 'intelligence'
                        ? 'bg-[#0f1e36] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Analisis & Rekomendasi Staf</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('metadata')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeTab === 'metadata'
                        ? 'bg-[#0f1e36] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Data Formulir Terisi</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReapplyForm}
                    className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    title="Terapkan kembali seluruh data hasil ekstraksi ke formulir"
                  >
                    <RefreshCw className="w-3 h-3 text-blue-600" />
                    <span>Terapkan Ulang ke Form</span>
                  </button>

                  {extractedData.rawTextSnippet && (
                    <button
                      type="button"
                      onClick={handleCopyTranscription}
                      className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      title="Salin teks dokumen yang berhasil dibaca"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-600" />
                          <span>Salin Teks</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-3 text-xs text-slate-700 max-h-64 overflow-y-auto">
                {activeTab === 'transcription' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-100">
                      <span>Transkripsi Teks Lengkap Dokumen (OCR Hasil Pembacaan Langsung):</span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                        Tingkat Akurasi: {extractedData.confidence}%
                      </span>
                    </div>
                    {extractedData.rawTextSnippet ? (
                      <pre className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text">
                        {extractedData.rawTextSnippet}
                      </pre>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-lg text-slate-500 italic">
                        Teks langsung belum tersedia. Ringkasan isi: {extractedData.ringkasan || 'Tidak ada teks.'}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'intelligence' && (
                  <div className="space-y-3">
                    {extractedData.analisaIntelijen ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1">
                          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                            Intisari Naskah Dinas
                          </span>
                          <p className="text-[11px] text-blue-950 leading-relaxed">
                            {extractedData.analisaIntelijen.intisari || extractedData.ringkasan}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1">
                          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                            Tingkat Urgensi & Batas Waktu
                          </span>
                          <p className="text-[11px] text-amber-950 font-semibold">
                            {extractedData.analisaIntelijen.urgensi || 'Standar Kedinasan'}
                          </p>
                          {extractedData.analisaIntelijen.batasWaktu && (
                            <p className="text-[10px] text-amber-800">
                              Target Batas Waktu: <strong>{extractedData.analisaIntelijen.batasWaktu}</strong>
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                            Rekomendasi Aksi / Tindak Lanjut Staf
                          </span>
                          <p className="text-[11px] text-emerald-950 leading-relaxed">
                            {extractedData.analisaIntelijen.rekomendasiAksi || 'Lakukan pengarsipan dan koordinasikan dengan satker terkait sesuai disposisi pimpinan.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600 leading-relaxed">
                        {extractedData.ringkasan}
                      </p>
                    )}

                    {extractedData.extractedClauses && extractedData.extractedClauses.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                          Butir-Butir Ketentuan Terdeteksi:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 pl-1">
                          {extractedData.extractedClauses.map((clause, idx) => (
                            <li key={idx} className="leading-snug">{clause}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'metadata' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 font-bold block">Nomor Naskah:</span>
                      <span className="font-mono font-bold text-slate-900">{extractedData.noSurat || extractedData.noTelegram || '-'}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 font-bold block">Tanggal Surat / Kirim:</span>
                      <span className="font-mono text-slate-900">{extractedData.tglSurat || extractedData.tglTerimaAtauKirim || '-'}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 font-bold block">Pengirim:</span>
                      <span className="font-semibold text-slate-900">{extractedData.asalPengirim || '-'}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 font-bold block">Tujuan / Kepada:</span>
                      <span className="font-semibold text-slate-900">{extractedData.tujuanPenerima || '-'}</span>
                    </div>
                    <div className="sm:col-span-2 p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 font-bold block">Perihal:</span>
                      <span className="font-semibold text-slate-900">{extractedData.perihal || '-'}</span>
                    </div>
                    {extractedData.catatanDisposisi && (
                      <div className="sm:col-span-2 p-2 bg-amber-50 rounded border border-amber-200">
                        <span className="text-amber-800 font-bold block">Catatan Disposisi / Paraf:</span>
                        <span className="italic text-amber-950 font-serif">{extractedData.catatanDisposisi}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
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

      {/* MODAL PREVIEW FOR UPLOADED FILE WITH ZOOM & ROTATE */}
      {isPreviewOpen && previewUrl && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-[#0f1e36] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-xs truncate max-w-md">{uploadedFile?.name}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 hidden sm:inline">
                  Pratinjau Dokumen Asli
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-slate-300">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                    className="p-1 hover:text-white hover:bg-slate-700 rounded"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono px-1.5">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                    className="p-1 hover:text-white hover:bg-slate-700 rounded"
                    title="Perkecil"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-3 bg-slate-700 mx-0.5"></div>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1 hover:text-white hover:bg-slate-700 rounded"
                    title="Putar 90 derajat"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-900 overflow-auto p-4 flex items-center justify-center relative">
              {uploadedFile?.name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-full rounded-lg border border-slate-700 bg-white"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                  <img
                    src={previewUrl}
                    alt="Scan Preview"
                    style={{
                      transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s ease-out'
                    }}
                    className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl border border-slate-700"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

