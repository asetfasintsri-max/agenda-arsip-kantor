/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Printer, 
  Sparkles, 
  Save, 
  Eye, 
  Microscope, 
  ArrowLeft,
  Home,
  Columns,
  CheckSquare,
  FileCheck,
  FileCheck2,
  FileUp,
  Download,
  QrCode,
  Image as ImageIcon
} from 'lucide-react';
import { KLAUSUL_RESMI_19, LampiranItem, SuratMasuk } from '../types';
import { DisposisiQrSection } from './DisposisiQrSection';
import { exportDisposisiToPdf } from '../utils/exportDisposisiPdf';
import { analyzeDocumentFile, AnalyzedDocumentData } from '../services/documentAnalysis';

interface OcrProcessingModalHubProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSurat: (surat: SuratMasuk) => void;
  onOpenForensic: (surat: SuratMasuk) => void;
  existingSurats: SuratMasuk[];
  initialSurat?: SuratMasuk;
  initialViewMode?: 'ocr' | 'print' | 'split';
}

export const OcrProcessingModalHub: React.FC<OcrProcessingModalHubProps> = ({
  isOpen,
  onClose,
  onSaveSurat,
  onOpenForensic,
  existingSurats,
  initialSurat,
  initialViewMode = 'ocr'
}) => {
  if (!isOpen) return null;

  // View modes: 'ocr' | 'print' | 'split'
  const [viewMode, setViewMode] = useState<'ocr' | 'print' | 'split'>(initialViewMode);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  // Real Uploaded File & AI Vision state
  const [uploadedRealFile, setUploadedRealFile] = useState<File | null>(null);
  const [uploadedRealPreviewUrl, setUploadedRealPreviewUrl] = useState<string | null>(null);
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [ocrScanAccuracy, setOcrScanAccuracy] = useState<number>(initialSurat?.ocrAccuracy || 98.4);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const realFileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [noAgenda, setNoAgenda] = useState<string>(initialSurat?.noAgenda || 'AG-SM/2025/00144');
  const [noSurat, setNoSurat] = useState<string>(initialSurat?.noSurat || 'B/1429/II/2025/LOG');
  const [tglSurat, setTglSurat] = useState<string>(initialSurat?.tglSurat || '2025-02-27');
  const [tglTerima, setTglTerima] = useState<string>(initialSurat?.tglTerima || '2025-02-28');
  const [waktuTerima, setWaktuTerima] = useState<string>(initialSurat?.waktuTerima || '08:30 WIB');
  const [asalSurat, setAsalSurat] = useState<string>(initialSurat?.asalSurat || 'Mabes TNI / Slog TNI');
  const [klasifikasi, setKlasifikasi] = useState<string>(initialSurat?.klasifikasi || 'Kilat / Rahasia');
  const [perihal, setPerihal] = useState<string>(
    initialSurat?.perihal || 'Distribusi Amunisi Kaliber Khusus TW I TA 2025 Wilayah Operasi Perbatasan RI-PNG'
  );
  const [ringkasan, setRingkasan] = useState<string>(
    initialSurat?.ringkasan || 'Permohonan alokasi dan pengiriman munisi kaliber 7.62mm dan 5.56mm link untuk kesiapan satgas ops perbatasan. Pangkalan transit Lanud Manuhua Biak disiapkan maksimal H-3.'
  );
  const [selectedUrusan, setSelectedUrusan] = useState<string>('Pengajuan Legalisasi Listrik/Air');

  // Disposisi state for 4 officers
  const [disposisiPanglima, setDisposisiPanglima] = useState({
    clauses: initialSurat?.disposisi.panglima.checkedClauses || ['Aksi/TDL', 'Laporkan'],
    catatan: initialSurat?.disposisi.panglima.catatan || 'Selesaikan sebelum 5 Maret 2025',
    diparaf: true
  });
  const [disposisiAslog, setDisposisiAslog] = useState({
    clauses: initialSurat?.disposisi.aslog.checkedClauses || ['ssi diposisi pang tni'],
    catatan: initialSurat?.disposisi.aslog.catatan || 'Paban IV koordinasikan dgn Bekpal',
    diparaf: true
  });
  const [disposisiWaaslog, setDisposisiWaaslog] = useState({
    clauses: initialSurat?.disposisi.waaslog.checkedClauses || ['koordinasi'],
    catatan: initialSurat?.disposisi.waaslog.catatan || 'Koordinasikan dengan Paban IV terkait kesiapan dermaga bongkar muat Lanud Manuhua Biak sebelum H-3.',
    diparaf: true,
    perluVerifikasi: true
  });
  const [disposisiPaban, setDisposisiPaban] = useState({
    clauses: initialSurat?.disposisi.paban.checkedClauses || ['siapkan', 'UMP/pedomani'],
    catatan: initialSurat?.disposisi.paban.catatan || 'Takah berkas & koordinasi kaur reg.',
    diparaf: true
  });

  // 11 Supporting Documents Checklist State
  const [lampiranList, setLampiranList] = useState<LampiranItem[]>(
    initialSurat?.lampiranList || [
      { id: 1, label: '1. Gambar Layout (Existing)', keterangan: 'Lokasi dimohon & eksisting fasilitas', tag: 'Wajib', terlampir: true, fileName: 'LAYOUT_REV01.DWG.PDF', wajib: true },
      { id: 2, label: '2. Gambar Rencana', keterangan: 'Denah rencana modifikasi fisik', tag: 'Wajib', terlampir: true, fileName: 'RENCANA_GARDU.PDF', wajib: true },
      { id: 3, label: '3. RAB / TOR Usulan', keterangan: 'RAB rinci & Term of Reference', tag: 'Perbaikan/Renbut', terlampir: true, fileName: 'TOR_RAB_KONST25.XLSX', wajib: true },
      { id: 4, label: '4. Dokumentasi Foto Lapangan', keterangan: 'Existing / foto fisik aktual', tag: 'Wajib', terlampir: true, fileName: 'FOTO_DOK_6LBR.PDF', wajib: true },
      { id: 5, label: '5. Kajian Legalisasi Listrik/Air', keterangan: 'Analisis teknis beban kwh & debit PAM', tag: 'Khusus Legalisasi', terlampir: true, fileName: 'KAJIAN_LISTRIK_PLN.PDF', wajib: true },
      { id: 6, label: '6. Rekapitulasi Kebutuhan Kajian', keterangan: 'Matriks rekapitulasi data konsumsi', tag: 'Khusus Legalisasi', terlampir: true, fileName: 'REKAP_KEBUTUHAN.XLSX', wajib: true },
      { id: 7, label: '7. Gbr. Wiring Listrik / Jaringan', keterangan: 'Diagram satu garis & instalasi air', tag: 'Khusus Legalisasi', terlampir: true, fileName: 'SINGLE_LINE_WIRING.PDF', wajib: true },
      { id: 8, label: '8. RAB Kontrak / Rekanan', keterangan: 'Salinan penawaran kontrak penyedia', tag: 'Opsional', terlampir: false, fileName: undefined, wajib: false, status: 'Menunggu upload satker' },
      { id: 9, label: '9. Dok. Meteran Kajian Listrik/Air', keterangan: 'Foto nomor seri meter PLN/PAM & segel', tag: 'Khusus Legalisasi', terlampir: true, fileName: 'METERAN_PLN_SEALED.JPG', wajib: true },
      { id: 10, label: '10. Copy KIB (Kartu Inventaris)', keterangan: 'KIB A (Tanah) / KIB C (Gedung & Bangunan)', tag: 'Wajib BMN', terlampir: false, fileName: undefined, wajib: true, status: 'Perlu konfirmasi Kaur Simak' },
      { id: 11, label: '11. Copy Sertifikat / Berita Acara', keterangan: 'Bukti kepemilikan/penguasaan lahan dinas', tag: 'Legalitas', terlampir: false, fileName: undefined, wajib: true, status: 'Dalam proses verifikasi Minlog' }
    ]
  );

  // Check duplicate number
  const isDuplicate = existingSurats.some(
    (s) => s.noSurat.trim().toLowerCase() === noSurat.trim().toLowerCase() && s.id !== initialSurat?.id
  );

  const [isExportingDisposisiPdf, setIsExportingDisposisiPdf] = useState<boolean>(false);

  const handleExportDisposisiPdf = async () => {
    try {
      setIsExportingDisposisiPdf(true);
      await exportDisposisiToPdf({
        metadata: {
          noAgenda,
          noSurat,
          tglSurat,
          tglTerima,
          waktuTerima,
          asalSurat,
          perihal,
          klasifikasi,
          statusDisposisi: disposisiWaaslog.perluVerifikasi ? 'Proses Koordinasi Paban IV' : 'Selesai / Terarsip',
          catatanPaban: disposisiPaban.catatan,
          verifikasiOleh: 'Kol. Kav. Hartono (Kaur Reg. Minlog)'
        },
        ringkasan,
        disposisiPanglima,
        disposisiAslog,
        disposisiWaaslog,
        disposisiPaban,
        klausulList: KLAUSUL_RESMI_19
      });
    } catch (err) {
      console.error('Gagal mengekspor PDF disposisi:', err);
      alert('Terjadi kesalahan saat memproses PDF Lembar Disposisi.');
    } finally {
      setIsExportingDisposisiPdf(false);
    }
  };

  const handleToggleLampiran = (id: number) => {
    setLampiranList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, terlampir: !item.terlampir } : item
      )
    );
  };

  const handleRealFileScan = async (file: File) => {
    setUploadedRealFile(file);
    if (uploadedRealPreviewUrl) {
      URL.revokeObjectURL(uploadedRealPreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setUploadedRealPreviewUrl(preview);
    setIsAiScanning(true);

    try {
      const res = await analyzeDocumentFile(file, 'surat_masuk');
      if (res && res.data) {
        const d = res.data;
        if (d.noSurat) setNoSurat(d.noSurat);
        if (d.tglSurat) setTglSurat(d.tglSurat);
        if (d.tglTerimaAtauKirim) setTglTerima(d.tglTerimaAtauKirim);
        if (d.asalPengirim) setAsalSurat(d.asalPengirim);
        if (d.perihal) setPerihal(d.perihal);
        if (d.ringkasan) setRingkasan(d.ringkasan);
        if (d.klasifikasi) setKlasifikasi(d.klasifikasi);
        if (d.confidence) setOcrScanAccuracy(d.confidence);
        setMissingFields(d.missingFields || []);
        if (d.catatanDisposisi) {
          setDisposisiPanglima((prev) => ({ ...prev, catatan: d.catatanDisposisi || prev.catatan }));
        }
      }
    } catch (err) {
      console.error('Scan error in modal hub:', err);
    } finally {
      setIsAiScanning(false);
    }
  };

  const handleSave = () => {
    const newRecord: SuratMasuk = {
      id: initialSurat?.id || `sm-${Date.now()}`,
      noAgenda,
      noSurat,
      tglSurat,
      tglTerima,
      waktuTerima,
      asalSurat,
      perihal,
      ringkasan,
      klasifikasi: klasifikasi as any,
      derajat: 'Kilat',
      lampiranJumlah: `${lampiranList.filter((l) => l.terlampir).length} dari 11 Berkas`,
      lampiranList,
      disposisi: {
        panglima: { ...disposisiPanglima, checkedClauses: disposisiPanglima.clauses, akurasiOcr: 96 },
        aslog: { ...disposisiAslog, checkedClauses: disposisiAslog.clauses, akurasiOcr: 94 },
        waaslog: { ...disposisiWaaslog, checkedClauses: disposisiWaaslog.clauses, akurasiOcr: 88 },
        paban: { ...disposisiPaban, checkedClauses: disposisiPaban.clauses, akurasiOcr: 92 }
      },
      statusDisposisi: disposisiWaaslog.perluVerifikasi ? 'Proses Koordinasi Paban IV' : 'Selesai / Terarsip',
      kategoriUrusan: selectedUrusan.includes('Listrik') ? 'legal_utilitas' : 'renbut',
      satkerTujuan: 'Paban IV Konst / Minlog',
      scanFileName: uploadedRealFile?.name || initialSurat?.scanFileName || 'SCAN_B1429_SLOG_TNI.PDF',
      ocrAccuracy: ocrScanAccuracy,
      shaHash: 'e8b9ca42...f4a18902',
      tglDibuat: new Date().toISOString()
    };

    onSaveSurat(newRecord);
    alert('Data Berkas Masuk & Lembar Disposisi Berhasil Disimpan ke SIMONAS_DB!');
    onClose();
  };

  const currentConstructedSurat: SuratMasuk = {
    id: initialSurat?.id || 'sm-temp',
    noAgenda,
    noSurat,
    tglSurat,
    tglTerima,
    waktuTerima,
    asalSurat,
    perihal,
    ringkasan,
    klasifikasi: klasifikasi as any,
    derajat: 'Kilat',
    lampiranJumlah: '1 Berkas',
    lampiranList,
    disposisi: {
      panglima: { ...disposisiPanglima, checkedClauses: disposisiPanglima.clauses },
      aslog: { ...disposisiAslog, checkedClauses: disposisiAslog.clauses },
      waaslog: { ...disposisiWaaslog, checkedClauses: disposisiWaaslog.clauses },
      paban: { ...disposisiPaban, checkedClauses: disposisiPaban.clauses }
    },
    statusDisposisi: 'Proses Koordinasi Paban IV',
    kategoriUrusan: 'renbut',
    satkerTujuan: 'Paban IV Konst / Minlog',
    tglDibuat: new Date().toISOString()
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#000412]/80 backdrop-blur-md flex flex-col justify-start items-center p-2 sm:p-4 lg:p-5 select-none">
      {/* MASTER TOP BAR */}
      <header className="w-full max-w-[1520px] bg-[#0f1e36] text-white rounded-t-2xl shadow-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-[#1e3a5f]/50 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* BACK & HOME BUTTONS IN MODAL */}
          <div className="flex items-center gap-1 sm:gap-1.5 mr-0.5 sm:mr-1">
            <button
              onClick={onClose}
              type="button"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-[#e2e7ff] text-[#0f1e36] text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 border border-[#b5d0fd] shadow-xs cursor-pointer"
              title="Tutup & Kembali"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#0f1e36]" />
              <span className="hidden xs:inline">Kembali</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-[#e2e7ff] text-[#0f1e36] text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 border border-[#b5d0fd] shadow-xs cursor-pointer"
              title="Kembali ke Dashboard Utama"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xs:inline">Home</span>
            </button>
          </div>

          <div className="h-6 w-px bg-white/20 hidden sm:block"></div>

          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#455f87] to-[#0f1e36] flex items-center justify-center text-white shadow-inner border border-white/20 shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-sm sm:text-base text-white tracking-tight leading-none">
                Pusat Dokumen &amp; Disposisi
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                SIMONAS ACTIVE
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#adc8f5] mt-0.5 truncate max-w-[200px] xs:max-w-[320px] sm:max-w-none">
              Ekstraksi AI Vision OCR &amp; Format Resmi Tata Naskah TNI
            </p>
          </div>
        </div>

        {/* 3-WAY VIEW SWITCHER WITH SCALE ANIMATION */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setViewMode('ocr')}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 transform cursor-pointer ${
              viewMode === 'ocr'
                ? 'bg-white text-[#0f1e36] shadow-md font-bold scale-105 ring-2 ring-white/40'
                : 'text-[#adc8f5] hover:text-white hover:scale-102'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <span className="hidden sm:inline">1. Modal Input OCR Cerdas</span>
              <span className="sm:hidden">1. Input OCR</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          <button
            onClick={() => setViewMode('print')}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 transform cursor-pointer ${
              viewMode === 'print'
                ? 'bg-white text-[#0f1e36] shadow-md font-bold scale-105 ring-2 ring-white/40'
                : 'text-[#adc8f5] hover:text-white hover:scale-102'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              <span className="hidden sm:inline">2. Pratinjau Lembar Disposisi</span>
              <span className="sm:hidden">2. Disposisi A4</span>
            </span>
            <span className="hidden xs:inline-block px-1.5 py-0.2 rounded text-[9px] bg-[#455f87] text-white font-mono">
              A4
            </span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            type="button"
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 transform cursor-pointer ml-1 border-l border-white/10 ${
              viewMode === 'split'
                ? 'bg-white text-[#0f1e36] shadow-md font-bold scale-105 ring-2 ring-white/40'
                : 'text-[#adc8f5] hover:text-white hover:scale-102'
            }`}
            title="Tampilkan Berdampingan Layar Penuh (Desktop PC)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Berdampingan</span>
          </button>
        </div>

        {/* User info & Close button */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#adc8f5] font-mono hidden sm:inline">
            User: Kol. Kav. Hartono (Staf 3)
          </span>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-[#adc8f5] hover:text-white hover:bg-white/10 transition-all duration-200 transform hover:scale-110 active:scale-95"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* WORKSPACE CANVAS */}
      <div className="w-full max-w-[1520px] bg-white rounded-b-2xl shadow-2xl border border-[#dae2fd] overflow-hidden flex-1 flex flex-col mb-4 min-h-[700px]">
        {/* ========================================================================= */}
        {/* VIEW 1: MODAL INPUT OCR CERDAS */}
        {/* ========================================================================= */}
        {(viewMode === 'ocr' || viewMode === 'split') && (
          <section className={`flex flex-col ${viewMode === 'split' ? 'border-b-4 border-[#0f1e36]/30' : 'flex-1'}`}>
            {/* Status Bar Hasil OCR */}
            <div className="bg-[#f2f3ff] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#dae2fd]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-[#131b2e]">Status Analisis OCR:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Analisis OCR Selesai - Tingkat Akurasi 98.4% (1 bidang perlu verifikasi manual)
                </span>
              </div>

              {/* Jenis Surat & Urusan Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#44474d] uppercase">Jenis Surat &amp; Urusan:</span>
                <div className="inline-flex rounded-lg bg-white p-0.5 border border-[#dae2fd] shadow-xs">
                  {['Pengajuan Legalisasi Listrik/Air', 'Permohonan Perbaikan', 'Pengajuan Renbut', 'Laporan'].map((u) => (
                    <button
                      key={u}
                      onClick={() => setSelectedUrusan(u)}
                      type="button"
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        selectedUrusan === u
                          ? 'font-bold bg-[#0f1e36] text-white shadow-xs'
                          : 'font-medium text-[#44474d] hover:text-[#131b2e]'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#b5d0fd]/30 text-[#0f1e36] border border-[#b5d0fd]">
                  Paban IV Konst
                </span>
              </div>
            </div>

            {/* 2-COLUMN LAYOUT OCR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-[640px]">
              {/* SISI KIRI: PREVIEW SCAN DOKUMEN MILITER */}
              <div className="lg:col-span-6 bg-slate-900 text-slate-100 p-4 lg:p-5 flex flex-col justify-between border-r border-[#dae2fd] relative">
                {/* Scan Toolbar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-700 shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Pratinjau Scan Dokumen Asli (PDF/A)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(180, z + 10))}
                      type="button"
                      className="p-1 rounded hover:bg-slate-700 text-slate-300"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono px-1.5 text-slate-400">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                      type="button"
                      className="p-1 rounded hover:bg-slate-700 text-slate-300"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3.5 bg-slate-700 mx-0.5"></div>
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      type="button"
                      className="p-1 rounded hover:bg-slate-700 text-slate-300"
                      title="Rotasi"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="file"
                      ref={realFileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRealFileScan(file);
                      }}
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                    />
                    <button
                      onClick={() => realFileInputRef.current?.click()}
                      type="button"
                      disabled={isAiScanning}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                      title="Unggah berkas PDF atau Foto dokumen dinas untuk dipindai otomatis oleh AI"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadedRealFile ? 'Ganti File' : 'Unggah PDF / Foto'}</span>
                    </button>
                  </div>
                </div>

                {/* AREA TAMPILAN BERKAS / SCAN DOKUMEN MILITER */}
                <div className="flex-1 my-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-center overflow-auto relative min-h-[460px]">
                  {/* AI Scanning Active Overlay */}
                  {isAiScanning && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Menganalisa Berkas PDF/Foto via AI Gemini Vision...</span>
                      </div>
                      <p className="text-xs text-slate-300 max-w-md">
                        Mengekstraksi nomor surat, tanggal, asal pengirim, perihal, ringkasan, dan catatan disposisi secara otomatis.
                      </p>
                    </div>
                  )}

                  {uploadedRealPreviewUrl ? (
                    uploadedRealFile?.type === 'application/pdf' || uploadedRealFile?.name.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-full min-h-[500px] rounded-lg overflow-hidden bg-slate-900 border border-slate-700 flex flex-col">
                        <div className="bg-slate-800 px-3 py-1.5 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
                          <span className="font-mono flex items-center gap-1.5 truncate max-w-xs">
                            <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            {uploadedRealFile?.name}
                          </span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                            Pratinjau PDF Asli
                          </span>
                        </div>
                        <iframe
                          src={uploadedRealPreviewUrl}
                          title="Pratinjau PDF Asli"
                          className="w-full flex-1 border-0 bg-white"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 overflow-auto">
                        <img
                          src={uploadedRealPreviewUrl}
                          alt="Pratinjau Foto Dokumen Asli"
                          style={{
                            transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease-out'
                          }}
                          className="max-w-full max-h-[520px] object-contain rounded-lg shadow-2xl border border-slate-700"
                        />
                      </div>
                    )
                  ) : (
                    <div
                      style={{
                        transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease-out'
                      }}
                      className="w-full max-w-[500px] bg-[#fbfbf9] text-slate-900 rounded-xs shadow-2xl p-6 font-serif text-[11px] leading-tight border border-slate-300 relative select-text"
                    >
                      {/* Bounding Box Hijau: KOP RESMI */}
                      <div className="relative border-2 border-emerald-500 bg-emerald-500/5 p-2 rounded-xs mb-3 text-center font-sans">
                        <span className="absolute -top-2.5 -right-1 px-1.5 py-0.2 bg-emerald-600 text-white font-bold text-[8px] rounded uppercase tracking-wider">
                          OCR PASTI 100%
                        </span>
                        <p className="font-bold text-[12px] uppercase tracking-wider text-slate-900">
                          MARKAS BESAR TENTARA NASIONAL INDONESIA
                        </p>
                        <p className="font-semibold text-[11px] text-slate-800">STAF LOGISTIK</p>
                        <p className="text-[9px] text-slate-600 italic">Jalan Raya Hankam, Cilangkap, Jakarta Timur 13870</p>
                      </div>

                      {/* Official Rubber Stamp */}
                      <div className="absolute top-20 right-7 pointer-events-none opacity-85 rotate-[-12deg] z-10">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-600 p-0.5 flex flex-col items-center justify-center text-center text-red-700 font-sans font-black text-[7.5px] leading-tight">
                          <span>* MABES TNI *</span>
                          <span className="text-[9px] uppercase border-y border-red-500 py-0.5 my-0.5 tracking-wider font-extrabold">
                            TERCATAT
                          </span>
                          <span>SLOG TNI</span>
                        </div>
                      </div>

                      {/* Classification stamp */}
                      <div className="flex items-center justify-between mb-3 font-sans">
                        <div className="inline-flex items-center gap-1 border-2 border-red-600 px-2 py-0.5 text-red-700 font-black text-[10.5px] tracking-widest uppercase rotate-[-2deg] bg-red-50/50">
                          ⚡ KILAT / RAHASIA
                        </div>
                        <div className="text-right text-[9px] text-slate-500 font-mono">
                          Lembar 1 dari 2
                        </div>
                      </div>

                      {/* Bounding Box Hijau: Metadata */}
                      <div className="relative border-2 border-emerald-500 bg-emerald-500/5 p-2 rounded-xs mb-3 font-sans text-[11px] space-y-1">
                        <span className="absolute -top-2.5 right-1 px-1.5 py-0.2 bg-emerald-600 text-white font-bold text-[8px] rounded uppercase tracking-wider">
                          NOMOR &amp; TGL: 99.8%
                        </span>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-3 font-semibold text-slate-700">Nomor</span>
                          <span className="col-span-9 font-mono font-bold text-slate-900">: {noSurat}</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-3 font-semibold text-slate-700">Klasifikasi</span>
                          <span className="col-span-9 font-bold text-red-700">: Kilat / Rahasia</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-3 font-semibold text-slate-700">Lampiran</span>
                          <span className="col-span-9">: 1 (satu) Berkas Rincian Matlog</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-3 font-semibold text-slate-700">Perihal</span>
                          <span className="col-span-9 font-semibold text-slate-900 leading-snug">
                            : {perihal}
                          </span>
                        </div>
                      </div>

                      {/* Body text */}
                      <div className="font-sans text-[10.5px] text-slate-700 leading-relaxed space-y-1.5 mb-3 border-b border-slate-200 pb-2">
                        <p>Kepada Yth. <strong>Panglima Komando Logistik</strong></p>
                        <p className="indent-4">1. Dasar Keputusan Panglima TNI Nomor Kep/104/I/2025 perihal Rencana Pengamanan Daerah Operasi Khusus.</p>
                        <p className="indent-4">2. Sehubungan dasar di atas, mohon kesiapan alokasi dan pergeseran munisi kaliber 7.62mm &amp; 5.56mm link untuk satgas perbatasan transit Biak sebelum H-3 pergeseran materiel.</p>
                      </div>

                      {/* Bounding Box Kuning/Oranye: Disposisi Coretan Tinta Biru Basah */}
                      <div className="relative border-2 border-amber-500 bg-amber-500/10 p-2.5 rounded-xs animate-pulse-subtle">
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-sans font-black text-[9px] rounded uppercase tracking-wider flex items-center gap-1 shadow">
                            <AlertTriangle className="w-3 h-3 text-slate-950" />
                            Perlu Pemeriksaan Manual: Tulisan tangan disposisi &amp; paraf
                          </span>
                          <button
                            onClick={() => onOpenForensic(currentConstructedSurat)}
                            type="button"
                            className="px-2 py-0.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-sans text-[10px] font-bold shadow-xs flex items-center gap-1"
                            title="Buka Alat Pembesar & Koreksi Lensa Forensik"
                          >
                            <Microscope className="w-3 h-3 text-white" />
                            <span>Buka Lensa Forensik</span>
                          </button>
                        </div>

                        <div className="font-mono text-[10px] text-slate-900 bg-white/80 p-2 rounded border border-amber-300 space-y-1">
                          <div className="flex items-center justify-between text-[9px] font-sans font-bold text-amber-900 border-b border-amber-200 pb-0.5">
                            <span>Coretan Disposisi Tinta Biru Basah</span>
                            <span className="text-amber-800">Keyakinan AI: 84.2%</span>
                          </div>
                          <p className="italic font-serif text-[11px] text-blue-900">
                            ✍️ <strong>Panglima:</strong> "Aksi/TDL, Laporkan! Selesaikan sebelum 5 Maret 2025." [Paraf basah]
                          </p>
                          <p className="italic font-serif text-[11px] text-blue-900">
                            ✍️ <strong>Aslog:</strong> "ssi disposisi pang tni, Paban IV koordinasikan dgn Bekpal." [Paraf]
                          </p>
                          <p className="italic font-serif text-[10.5px] text-blue-950 font-semibold bg-amber-100/60 p-1 rounded">
                            ✍️ <strong>Waaslog (Ambiguitas):</strong> "kord. dg Paban IV ttg alokasi..." [Paraf memotong teks]
                          </p>
                        </div>
                      </div>

                      {/* Bottom Receipt stamp */}
                      <div className="mt-3 pt-1 flex items-center justify-between text-[9px] text-slate-600 font-sans">
                        <span>Diterima Sentral Posko Minlog: {tglTerima} / {waktuTerima}</span>
                        <span className="font-mono text-emerald-800 font-bold">SHA-256: e8b9...f4a1</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Preview Scan Info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs text-slate-400 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>
                      Berkas: <code className="font-mono text-slate-200">{uploadedRealFile ? uploadedRealFile.name : 'SCAN_B1429_SLOG_TNI.PDF'}</code> ({uploadedRealFile ? (uploadedRealFile.size / 1024 / 1024).toFixed(1) + ' MB' : '2.4 MB'})
                    </span>
                  </div>
                  <span>Resolusi: <strong>{uploadedRealFile ? 'Berkas Unggahan Riil' : '400 DPI Kualitas Arsip'}</strong></span>
                </div>
              </div>

              {/* SISI KANAN: FORMULIR DRAF HASIL EKSTRAKSI OCR */}
              <div className="lg:col-span-6 p-4 sm:p-5 flex flex-col justify-between bg-white overflow-y-auto">
                <div className="space-y-4">
                  {/* Header Form Draf */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#dae2fd]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#0f1e36] text-white flex items-center justify-center font-bold text-sm">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-heading text-sm text-[#131b2e] font-bold leading-tight">
                          Formulir Draf Hasil Ekstraksi OCR
                        </h3>
                        <p className="text-[11px] text-[#44474d]">
                          Verifikasi akurasi data otomatis sebelum disimpan resmi ke basis data dinas.
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f2f3ff] text-[#0f1e36] border border-[#dae2fd]">
                      SIMONAS AUTO-POPULATED
                    </span>
                  </div>

                  {/* Missing Fields / Opsi Pengisian Manual Alert */}
                  {missingFields.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-950">
                          Opsi Pengisian Manual Aktif: {missingFields.length} bidang belum terisi / belum terbaca
                        </p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          AI tidak mendeteksi data berikut dari dokumen: <strong>{missingFields.join(', ')}</strong>. Silakan ketik langsung pada formulir bertanda oranye di bawah.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Row 1: No Agenda & No Surat */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#44474d] font-bold block mb-1">
                        No. Agenda (Auto-Generated)
                      </label>
                      <input
                        type="text"
                        value={noAgenda}
                        onChange={(e) => setNoAgenda(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#f2f3ff] rounded border border-[#dae2fd] text-[#131b2e] font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#44474d] font-bold block">
                          No. Surat Dinas
                        </label>
                        {!noSurat ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                            Opsi Isi Manual
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                            Akurasi {ocrScanAccuracy.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={noSurat}
                        onChange={(e) => setNoSurat(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded border text-xs font-mono font-bold outline-none ${
                          isDuplicate
                            ? 'bg-red-50 border-red-500 text-red-900 focus:ring-1 focus:ring-red-500'
                            : 'bg-emerald-50/50 border-emerald-400 text-[#131b2e] focus:ring-1 focus:ring-[#0f1e36]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Row 2: Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#44474d] font-bold block mb-1">
                        Tanggal Surat
                      </label>
                      <input
                        type="date"
                        value={tglSurat}
                        onChange={(e) => setTglSurat(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#f2f3ff] rounded border border-[#dae2fd] text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#44474d] font-bold block mb-1">
                        Tanggal &amp; Waktu Diterima
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={tglTerima}
                          onChange={(e) => setTglTerima(e.target.value)}
                          className="w-1/2 px-2 py-1.5 bg-[#f2f3ff] rounded border border-[#dae2fd] text-xs"
                        />
                        <input
                          type="text"
                          value={waktuTerima}
                          onChange={(e) => setWaktuTerima(e.target.value)}
                          className="w-1/2 px-2 py-1.5 bg-[#f2f3ff] rounded border border-[#dae2fd] text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Asal & Klasifikasi */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#44474d] font-bold block">
                          Asal / Instansi Pengirim
                        </label>
                        {!asalSurat && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                            Opsi Isi Manual
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={asalSurat}
                        onChange={(e) => setAsalSurat(e.target.value)}
                        placeholder="Contoh: Mabes TNI / Slog TNI"
                        className={`w-full px-3 py-1.5 rounded border text-xs font-semibold ${
                          !asalSurat ? 'bg-amber-50/50 border-amber-400' : 'bg-white border-[#dae2fd]'
                        }`}
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="text-[11px] uppercase tracking-wider text-[#44474d] font-bold block mb-1">
                        Klasifikasi Dokumen
                      </label>
                      <select
                        value={klasifikasi}
                        onChange={(e) => setKlasifikasi(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded border border-[#dae2fd] text-xs font-bold text-[#ba1a1a]"
                      >
                        <option value="Kilat / Rahasia">⚡ KILAT / RAHASIA</option>
                        <option value="Rahasia">RAHASIA</option>
                        <option value="Sangat Rahasia">SANGAT RAHASIA</option>
                        <option value="Biasa">BIASA</option>
                      </select>
                    </div>
                  </div>

                  {/* Perihal & Ringkasan */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#44474d] font-bold block">
                          Perihal Dokumen Resmi
                        </label>
                        {!perihal && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                            Opsi Isi Manual
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={perihal}
                        onChange={(e) => setPerihal(e.target.value)}
                        placeholder="Isikan perihal dinas"
                        className={`w-full px-3 py-1.5 rounded border text-xs font-semibold ${
                          !perihal ? 'bg-amber-50/50 border-amber-400' : 'bg-white border-[#dae2fd]'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#44474d] font-bold block">
                          Ringkasan Ekstraksi Dokumen (OCR Summary)
                        </label>
                        {!ringkasan && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                            Opsi Isi Manual
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={ringkasan}
                        onChange={(e) => setRingkasan(e.target.value)}
                        placeholder="Tuliskan ringkasan pokok surat atau isi disposisi penting..."
                        className={`w-full px-3 py-1.5 rounded border text-xs leading-relaxed ${
                          !ringkasan ? 'bg-amber-50/50 border-amber-400' : 'bg-[#f2f3ff] border-[#dae2fd]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* HASIL EKSTRAKSI DISPOSISI 4 PEJABAT */}
                  <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#dae2fd] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#dae2fd] pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-[#0f1e36]" />
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#0f1e36]">
                          Hasil Ekstraksi Disposisi 4 Pejabat Kedinasan
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-medium">
                        1 Butir Perlu Verifikasi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Panglima */}
                      <div className="p-2 bg-white rounded-lg border border-[#dae2fd]">
                        <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                          <span>1. Panglima Komando</span>
                          <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" /> Akurat 96%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {disposisiPanglima.clauses.map((c) => (
                            <span key={c} className="px-1.5 py-0.5 rounded bg-[#0f1e36] text-white text-[10px] font-bold">
                              [v] {c}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10.5px] text-slate-600 italic bg-slate-50 p-1 rounded border border-slate-200">
                          Catatan: "{disposisiPanglima.catatan}"
                        </p>
                      </div>

                      {/* Aslog */}
                      <div className="p-2 bg-white rounded-lg border border-[#dae2fd]">
                        <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                          <span>2. Aslog</span>
                          <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" /> Akurat 94%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {disposisiAslog.clauses.map((c) => (
                            <span key={c} className="px-1.5 py-0.5 rounded bg-[#0f1e36] text-white text-[10px] font-bold">
                              [v] {c}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10.5px] text-slate-600 italic bg-slate-50 p-1 rounded border border-slate-200">
                          Catatan: "{disposisiAslog.catatan}"
                        </p>
                      </div>

                      {/* Waaslog (Needs attention) */}
                      <div className="p-2 bg-amber-50/40 rounded-lg border border-amber-300">
                        <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                          <span>3. Waaslog</span>
                          <span className="text-[10px] text-amber-800 font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3 text-amber-700" /> Verifikasi Manual
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {disposisiWaaslog.clauses.map((c) => (
                            <span key={c} className="px-1.5 py-0.5 rounded bg-[#0f1e36] text-white text-[10px] font-bold">
                              [v] {c}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10.5px] text-slate-700 italic bg-white p-1 rounded border border-amber-200">
                          Catatan: "{disposisiWaaslog.catatan}"
                        </p>
                        <button
                          onClick={() => onOpenForensic(currentConstructedSurat)}
                          type="button"
                          className="mt-1 text-[10px] text-blue-700 hover:underline font-bold flex items-center gap-1"
                        >
                          <Microscope className="w-3 h-3" />
                          <span>Periksa detail di Lensa Forensik →</span>
                        </button>
                      </div>

                      {/* Paban IV */}
                      <div className="p-2 bg-white rounded-lg border border-[#dae2fd]">
                        <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                          <span>4. Paban IV / Minlog</span>
                          <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" /> Akurat 92%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {disposisiPaban.clauses.map((c) => (
                            <span key={c} className="px-1.5 py-0.5 rounded bg-[#0f1e36] text-white text-[10px] font-bold">
                              [v] {c}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10.5px] text-slate-600 italic bg-slate-50 p-1 rounded border border-slate-200">
                          Catatan: "{disposisiPaban.catatan}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CHECKLIST 11 DATA PENDUKUNG WAJIB */}
                  <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#dae2fd] space-y-2">
                    <div className="flex items-center justify-between border-b border-[#dae2fd] pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-[#0f1e36]" />
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#0f1e36]">
                          Checklist Verifikasi 11 Data Pendukung Wajib (Paban IV Konst)
                        </span>
                      </div>
                      <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                        {lampiranList.filter((l) => l.terlampir).length} / 11 Terlampir
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-48 overflow-y-auto pr-1">
                      {lampiranList.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2 rounded-lg border flex items-start justify-between gap-2 transition-colors ${
                            item.terlampir
                              ? 'bg-white border-emerald-300/80'
                              : 'bg-white/60 border-slate-200 opacity-80'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={item.terlampir}
                              onChange={() => handleToggleLampiran(item.id)}
                              className="mt-0.5 rounded text-[#0f1e36] focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-1">
                                <span className={`font-semibold text-xs ${item.terlampir ? 'text-slate-900' : 'text-slate-600'}`}>
                                  {item.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-tight">{item.keterangan}</p>
                              {item.fileName ? (
                                <span className="font-mono text-[9px] text-emerald-700 font-bold block mt-0.5">
                                  ✓ {item.fileName}
                                </span>
                              ) : (
                                <span className="text-[9px] text-amber-700 italic block mt-0.5">
                                  {item.status || 'Belum diunggah'}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono shrink-0">
                            {item.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ANTI-DUPLICATION BANNER */}
                  {isDuplicate ? (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-300 text-red-900 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                      <p className="text-xs leading-snug">
                        <strong>⚠️ Peringatan Duplikasi:</strong> Nomor surat <code>{noSurat}</code> sudah terdaftar sebelumnya di SIMONAS_DB. Harap periksa kembali nomor surat agar tidak terjadi tumpang tindih arsip.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <p className="text-xs leading-snug">
                        <strong>✓ Pemeriksaan SIMONAS_DB:</strong> Nomor <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded text-emerald-800 border border-emerald-300">{noSurat}</code> belum pernah terdaftar. Aman disimpan.
                      </p>
                    </div>
                  )}
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className="pt-4 mt-3 border-t border-[#dae2fd] flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-[#44474d] font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Auto-Mirror Google Drive &amp; SIMONAS_DB Ready</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={onClose}
                      type="button"
                      className="px-3.5 py-2 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#131b2e] text-xs font-semibold transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => setViewMode('print')}
                      type="button"
                      className="px-3.5 py-2 rounded-lg bg-[#e2e7ff] hover:bg-[#dae2fd] text-[#0f1e36] text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Lembar Disposisi</span>
                    </button>
                    <button
                      onClick={() => onOpenForensic(currentConstructedSurat)}
                      type="button"
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Microscope className="w-3.5 h-3.5 text-blue-300" />
                      <span>Lensa Forensik</span>
                    </button>
                    <button
                      onClick={handleSave}
                      type="button"
                      className="px-5 py-2 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4 text-emerald-400" />
                      <span>Simpan ke SIMONAS_DB &amp; Drive</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: PRATINJAU CETAK LEMBAR DISPOSISI STANDAR MILITER (A4) */}
        {/* ========================================================================= */}
        {(viewMode === 'print' || viewMode === 'split') && (
          <section className="flex flex-col flex-1 divide-y divide-[#dae2fd] bg-slate-100">
            {/* Header bar */}
            <div className="bg-[#f2f3ff] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#dae2fd]">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#0f1e36]" />
                <div>
                  <span className="font-heading text-sm font-bold text-[#131b2e]">
                    Pratinjau Cetak Lembar Disposisi Kedinasan Militer
                  </span>
                  <span className="text-xs text-[#44474d] block">
                    Format Standar Tata Naskah Dinas Komando Logistik TNI • Siap Cetak A4 / PDF Digital
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#0f1e36] text-white font-mono text-xs font-bold">
                  Kertas: Standar A4 (210 x 297 mm)
                </span>
                <button
                  onClick={() => setViewMode('ocr')}
                  type="button"
                  className="px-3 py-1.5 bg-white hover:bg-slate-200 text-[#0f1e36] rounded font-semibold text-xs border border-[#dae2fd] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke OCR</span>
                </button>
              </div>
            </div>

            {/* A4 DOCUMENT CANVAS */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto flex justify-center bg-slate-200/90">
              <div className="w-full max-w-4xl bg-white text-slate-900 shadow-2xl p-6 sm:p-8 rounded-sm border border-slate-300 font-sans text-xs flex flex-col justify-between">
                <div>
                  {/* KOP RESMI */}
                  <div className="border-b-2 border-black pb-3 mb-3 text-center relative">
                    <div className="text-left absolute left-0 top-0">
                      <p className="font-bold text-[11px] leading-tight">TENTARA NASIONAL INDONESIA</p>
                      <p className="font-bold text-[11px] leading-tight">MARKAS BESAR</p>
                      <p className="font-bold text-[11px] leading-tight tracking-wider">KOMANDO LOGISTIK</p>
                    </div>
                    <div className="inline-block pt-1">
                      <h2 className="font-heading text-[19px] font-extrabold tracking-wider uppercase">
                        LEMBAR DISPOSISI
                      </h2>
                      <p className="text-[12px] font-bold tracking-widest text-slate-700">
                        KARTU KENDALI SURAT
                      </p>
                    </div>
                    <div className="absolute right-0 top-0 text-right">
                      <span className="px-2 py-0.5 border border-red-700 text-red-700 font-mono font-black text-[11px] tracking-wider uppercase inline-block">
                        {klasifikasi}
                      </span>
                      <p className="text-[10px] text-slate-600 font-mono mt-0.5">Form Kodiklat-Log/02-Rev</p>
                    </div>
                  </div>

                  {/* METADATA TABLE */}
                  <div className="border-2 border-black divide-y-2 divide-black text-[11px] mb-3">
                    <div className="grid grid-cols-12 divide-x-2 divide-black bg-slate-50">
                      <div className="col-span-6 p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          Nomor Agenda Kedinasan:
                        </span>
                        <span className="font-mono font-bold text-[14px] text-slate-900">{noAgenda}</span>
                      </div>
                      <div className="col-span-3 p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          Tingkat Keamanan:
                        </span>
                        <span className="font-bold text-red-700 text-[12px]">Rahasia (R)</span>
                      </div>
                      <div className="col-span-3 p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          Tgl Penerimaan:
                        </span>
                        <span className="font-bold">{tglTerima} ({waktuTerima})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 divide-x-2 divide-black">
                      <div className="col-span-8 p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          Nomor Surat Dinas:
                        </span>
                        <span className="font-mono font-bold text-[13px]">{noSurat}</span>
                      </div>
                      <div className="col-span-4 p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          Tanggal Surat:
                        </span>
                        <span className="font-medium text-[12px]">{tglSurat}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 divide-x-2 divide-black">
                      <div className="col-span-12 p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          Asal Surat / Instansi Pengirim:
                        </span>
                        <span className="font-bold text-[13px]">{asalSurat}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 divide-x-2 divide-black">
                      <div className="col-span-12 p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          Perihal Surat:
                        </span>
                        <p className="font-bold leading-snug text-[12px]">{perihal}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 divide-x-2 divide-black bg-slate-50/70">
                      <div className="col-span-12 p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          Ringkasan Surat:
                        </span>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{ringkasan}</p>
                      </div>
                    </div>
                  </div>

                  {/* 4-COLUMN OFFICIAL 19 DISPOSITION CLAUSES TABLE */}
                  <div className="border-2 border-black mb-3">
                    <div className="grid grid-cols-4 divide-x-2 divide-black border-b-2 border-black bg-slate-100 text-center font-bold text-[11px] uppercase tracking-wide">
                      <div className="py-1.5 px-1">I. DISPOSISI PANGLIMA</div>
                      <div className="py-1.5 px-1">II. DISPOSISI ASLOG</div>
                      <div className="py-1.5 px-1">III. DISPOSISI WAASLOG</div>
                      <div className="py-1.5 px-1">IV. DISPOSISI PABAN IV</div>
                    </div>

                    <div className="grid grid-cols-4 divide-x-2 divide-black text-[10px] leading-tight font-mono">
                      {/* Kolom 1: Panglima */}
                      <div className="p-2 space-y-1">
                        {KLAUSUL_RESMI_19.map((clause) => {
                          const isChecked = disposisiPanglima.clauses.includes(clause);
                          return (
                            <div
                              key={`p-${clause}`}
                              className={`flex items-center gap-1 ${
                                isChecked ? 'font-bold text-blue-900 bg-blue-50 px-0.5' : ''
                              }`}
                            >
                              <span className={`w-3.5 ${isChecked ? 'text-red-600 font-black' : 'text-slate-400'}`}>
                                {isChecked ? '[v]' : '[ ]'}
                              </span>
                              <span className="truncate">{clause}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Kolom 2: Aslog */}
                      <div className="p-2 space-y-1">
                        {KLAUSUL_RESMI_19.map((clause) => {
                          const isChecked = disposisiAslog.clauses.includes(clause);
                          return (
                            <div
                              key={`a-${clause}`}
                              className={`flex items-center gap-1 ${
                                isChecked ? 'font-bold text-blue-900 bg-blue-50 px-0.5' : ''
                              }`}
                            >
                              <span className={`w-3.5 ${isChecked ? 'text-red-600 font-black' : 'text-slate-400'}`}>
                                {isChecked ? '[v]' : '[ ]'}
                              </span>
                              <span className="truncate">{clause}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Kolom 3: Waaslog */}
                      <div className="p-2 space-y-1">
                        {KLAUSUL_RESMI_19.map((clause) => {
                          const isChecked = disposisiWaaslog.clauses.includes(clause);
                          return (
                            <div
                              key={`w-${clause}`}
                              className={`flex items-center gap-1 ${
                                isChecked ? 'font-bold text-blue-900 bg-blue-50 px-0.5' : ''
                              }`}
                            >
                              <span className={`w-3.5 ${isChecked ? 'text-red-600 font-black' : 'text-slate-400'}`}>
                                {isChecked ? '[v]' : '[ ]'}
                              </span>
                              <span className="truncate">{clause}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Kolom 4: Paban IV */}
                      <div className="p-2 space-y-1">
                        {KLAUSUL_RESMI_19.map((clause) => {
                          const isChecked = disposisiPaban.clauses.includes(clause);
                          return (
                            <div
                              key={`pb-${clause}`}
                              className={`flex items-center gap-1 ${
                                isChecked ? 'font-bold text-blue-900 bg-blue-50 px-0.5' : ''
                              }`}
                            >
                              <span className={`w-3.5 ${isChecked ? 'text-red-600 font-black' : 'text-slate-400'}`}>
                                {isChecked ? '[v]' : '[ ]'}
                              </span>
                              <span className="truncate">{clause}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Catatan & Paraf 4 Pejabat */}
                    <div className="grid grid-cols-4 divide-x-2 divide-black border-t-2 border-black font-sans text-[10px]">
                      <div className="p-2 flex flex-col justify-between h-28 bg-slate-50/50">
                        <div>
                          <span className="font-bold text-[9px] uppercase text-slate-600 block">
                            Catatan Panglima:
                          </span>
                          <p className="italic text-blue-950 font-semibold leading-tight mt-0.5">
                            "{disposisiPanglima.catatan}"
                          </p>
                        </div>
                        <div className="pt-2 border-t border-dashed border-slate-400 text-center">
                          <span className="block text-[8px] uppercase text-slate-500">Paraf / Tanda Tangan:</span>
                          <span className="font-serif italic font-bold text-blue-900 text-[11px]">[Telah Diparaf]</span>
                        </div>
                      </div>

                      <div className="p-2 flex flex-col justify-between h-28 bg-slate-50/50">
                        <div>
                          <span className="font-bold text-[9px] uppercase text-slate-600 block">Catatan Aslog:</span>
                          <p className="italic text-blue-950 font-semibold leading-tight mt-0.5">
                            "{disposisiAslog.catatan}"
                          </p>
                        </div>
                        <div className="pt-2 border-t border-dashed border-slate-400 text-center">
                          <span className="block text-[8px] uppercase text-slate-500">Paraf / Tanda Tangan:</span>
                          <span className="font-serif italic font-bold text-blue-900 text-[11px]">[Telah Diparaf]</span>
                        </div>
                      </div>

                      <div className="p-2 flex flex-col justify-between h-28 bg-slate-50/50">
                        <div>
                          <span className="font-bold text-[9px] uppercase text-slate-600 block">Catatan Waaslog:</span>
                          <p className="italic text-blue-950 font-semibold leading-tight mt-0.5">
                            "{disposisiWaaslog.catatan}"
                          </p>
                        </div>
                        <div className="pt-2 border-t border-dashed border-slate-400 text-center">
                          <span className="block text-[8px] uppercase text-slate-500">Paraf / Tanda Tangan:</span>
                          <span className="font-serif italic font-bold text-blue-900 text-[11px]">[Telah Diparaf]</span>
                        </div>
                      </div>

                      <div className="p-2 flex flex-col justify-between h-28 bg-slate-50/50">
                        <div>
                          <span className="font-bold text-[9px] uppercase text-slate-600 block">Catatan Paban IV:</span>
                          <p className="italic text-blue-950 font-semibold leading-tight mt-0.5">
                            "{disposisiPaban.catatan}"
                          </p>
                        </div>
                        <div className="pt-2 border-t border-dashed border-slate-400 text-center">
                          <span className="block text-[8px] uppercase text-slate-500">Paraf / Tanda Tangan:</span>
                          <span className="font-serif italic font-bold text-blue-900 text-[11px]">[Telah Diparaf]</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GENERATOR KODE QR PELACAKAN DIGITAL METADATA SURAT */}
                  <div className="mt-3">
                    <DisposisiQrSection
                      metadata={{
                        noAgenda,
                        noSurat,
                        tglSurat,
                        tglTerima,
                        waktuTerima,
                        asalSurat,
                        perihal,
                        klasifikasi,
                        statusDisposisi: disposisiWaaslog.perluVerifikasi ? 'Proses Koordinasi Paban IV' : 'Selesai / Terarsip',
                        catatanPaban: disposisiPaban.catatan,
                        verifikasiOleh: 'Kol. Kav. Hartono (Kaur Reg. Minlog)'
                      }}
                    />
                  </div>
                </div>

                {/* Footer Document info */}
                <div className="pt-2 border-t border-slate-400 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>Sistem Monitoring Naskah Dinas (SIMONAS) Komando Logistik TNI</span>
                  <span>Petugas Registrasi: Kol. Kav. Hartono (Kaur Reg. Minlog)</span>
                  <span>Dokumen Sah &amp; Terarsip Digital</span>
                </div>
              </div>
            </div>

            {/* Bottom print action bar */}
            <div className="bg-[#f2f3ff] px-3 sm:px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#dae2fd] shrink-0 no-print">
              <div className="flex items-center gap-2 text-xs text-[#44474d] font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] sm:text-xs">Format Standar Mabes TNI Kodiklat/2025 • QR Aktif</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportDisposisiPdf}
                  disabled={isExportingDisposisiPdf}
                  type="button"
                  className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Unduh Berkas PDF Lembar Disposisi Resmi A4 dengan Kode QR Pelacakan Digital"
                >
                  {isExportingDisposisiPdf ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Membuat PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-white" />
                      <span>Unduh PDF (+QR)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.print()}
                  type="button"
                  className="flex-1 sm:flex-none justify-center px-4 sm:px-5 py-2 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Cetak Fisik Lembar Disposisi A4 ke Printer / Simpan PDF Browser"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Cetak (Print)</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
