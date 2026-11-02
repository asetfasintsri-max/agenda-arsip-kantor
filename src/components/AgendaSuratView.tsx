/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Inbox, 
  Send, 
  Search, 
  Filter, 
  Plus, 
  Printer, 
  Download, 
  Trash2, 
  Eye, 
  Pencil, 
  Sparkles, 
  Microscope, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  Clock,
  ShieldAlert,
  ArrowLeft,
  Home,
  X,
  ExternalLink,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { SuratKeluar, SuratMasuk, WartaTelegram } from '../types';
import { SuratMasukEditModal } from './SuratMasukEditModal';
import { SuratKeluarModal } from './SuratKeluarModal';
import { SpreadsheetImportModal } from './SpreadsheetImportModal';
import { exportAgendaSuratToPdf, getAgendaSuratPdfBlobUrl } from '../utils/exportAgendaPdf';

interface AgendaSuratViewProps {
  suratMasukList: SuratMasuk[];
  suratKeluarList: SuratKeluar[];
  onOpenOcr: (surat?: SuratMasuk, mode?: 'ocr' | 'print' | 'split') => void;
  onOpenForensic: (surat: SuratMasuk) => void;
  onSaveSuratMasuk?: (surat: SuratMasuk) => void;
  onDeleteSuratMasuk: (id: string) => void;
  onSaveSuratKeluar?: (surat: SuratKeluar) => void;
  onDeleteSuratKeluar: (id: string) => void;
  onBack?: () => void;
  onHome?: () => void;
  onSyncSheets?: () => void;
  onImportData?: (data: { suratMasuk?: SuratMasuk[]; suratKeluar?: SuratKeluar[]; telegram?: WartaTelegram[] }) => void;
  telegramList?: WartaTelegram[];
  googleUser?: { displayName: string | null; email: string | null } | null;
  linkedSpreadsheetId?: string | null;
}

// Unified item type for tabular display
type UnifiedSuratItem = 
  | ({ itemType: 'masuk' } & SuratMasuk)
  | ({ itemType: 'keluar' } & SuratKeluar);

export const AgendaSuratView: React.FC<AgendaSuratViewProps> = ({
  suratMasukList,
  suratKeluarList,
  onOpenOcr,
  onOpenForensic,
  onSaveSuratMasuk,
  onDeleteSuratMasuk,
  onSaveSuratKeluar,
  onDeleteSuratKeluar,
  onBack,
  onHome,
  onSyncSheets,
  onImportData,
  telegramList = [],
  googleUser,
  linkedSpreadsheetId
}) => {
  // Tab filter: 'all' | 'masuk' | 'keluar'
  const [activeTab, setActiveTab] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Spreadsheet Importer & Manual Review Modal State
  const [isSpreadsheetImportOpen, setIsSpreadsheetImportOpen] = useState<boolean>(false);

  // Modals state
  const [isAddSMOpen, setIsAddSMOpen] = useState<boolean>(false);
  const [editingSM, setEditingSM] = useState<SuratMasuk | null>(null);

  const [isAddSKOpen, setIsAddSKOpen] = useState<boolean>(false);
  const [editingSK, setEditingSK] = useState<SuratKeluar | null>(null);

  // Quick detail preview modal for Surat Keluar or Surat Masuk
  const [previewItem, setPreviewItem] = useState<UnifiedSuratItem | null>(null);

  // PDF Export & Preview State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState<boolean>(false);

  // Revoke object URL on unmount or when url changes
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Merge and sort lists
  const unifiedItems: UnifiedSuratItem[] = [
    ...suratMasukList.map((sm) => ({ ...sm, itemType: 'masuk' as const })),
    ...suratKeluarList.map((sk) => ({ ...sk, itemType: 'keluar' as const }))
  ].sort((a, b) => {
    // Sort descending by date
    const dateA = a.itemType === 'masuk' ? a.tglTerima || a.tglSurat : a.tglKirim || a.tglSurat;
    const dateB = b.itemType === 'masuk' ? b.tglTerima || b.tglSurat : b.tglKirim || b.tglSurat;
    return dateB.localeCompare(dateA);
  });

  // Filter items
  const filteredItems = unifiedItems.filter((item) => {
    // 1. Tab filter
    if (activeTab === 'masuk' && item.itemType !== 'masuk') return false;
    if (activeTab === 'keluar' && item.itemType !== 'keluar') return false;

    // 2. Search query
    const targetParty = item.itemType === 'masuk' ? item.asalSurat : item.tujuanSurat;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.noAgenda.toLowerCase().includes(q) ||
      item.noSurat.toLowerCase().includes(q) ||
      targetParty.toLowerCase().includes(q) ||
      item.perihal.toLowerCase().includes(q) ||
      (item.ringkasan && item.ringkasan.toLowerCase().includes(q));

    if (!matchSearch) return false;

    // 3. Klasifikasi filter
    if (filterKlasifikasi !== 'all') {
      if (!item.klasifikasi.toLowerCase().includes(filterKlasifikasi.toLowerCase())) {
        return false;
      }
    }

    // 4. Status filter
    if (filterStatus !== 'all') {
      const statusText = item.itemType === 'masuk' ? item.statusDisposisi : item.statusTTE;
      if (!statusText.toLowerCase().includes(filterStatus.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  // Quick counts
  const countMasuk = suratMasukList.length;
  const countKeluar = suratKeluarList.length;
  const totalSurat = countMasuk + countKeluar;
  const countRahasia = unifiedItems.filter((it) => 
    it.klasifikasi.toLowerCase().includes('rahasia') || it.klasifikasi.toLowerCase().includes('kilat')
  ).length;

  // Export CSV
  const exportCsv = () => {
    const headers = ['Jenis', 'No Agenda', 'No Surat', 'Tgl Surat', 'Tgl Agenda', 'Instansi (Asal/Tujuan)', 'Perihal', 'Klasifikasi', 'Status'];
    const rows = filteredItems.map((item) => {
      const jenis = item.itemType === 'masuk' ? 'Surat Masuk' : 'Surat Keluar';
      const tglAgenda = item.itemType === 'masuk' ? item.tglTerima : item.tglKirim;
      const instansi = item.itemType === 'masuk' ? item.asalSurat : item.tujuanSurat;
      const status = item.itemType === 'masuk' ? item.statusDisposisi : item.statusTTE;

      return [
        `"${jenis}"`,
        `"${item.noAgenda}"`,
        `"${item.noSurat}"`,
        `"${item.tglSurat}"`,
        `"${tglAgenda}"`,
        `"${instansi.replace(/"/g, '""')}"`,
        `"${item.perihal.replace(/"/g, '""')}"`,
        `"${item.klasifikasi}"`,
        `"${status.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agenda_surat_terpadu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF (Direct Download)
  const handleExportPdf = () => {
    if (filteredItems.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      exportAgendaSuratToPdf({
        items: filteredItems,
        activeTab,
        filterKlasifikasi,
        filterStatus,
        searchQuery,
      });
      setPdfExportSuccess(true);
      setTimeout(() => setPdfExportSuccess(false), 4000);
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
      alert('Terjadi kesalahan saat memproses laporan PDF kedinasan.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Open PDF Preview Modal
  const handleOpenPdfPreview = () => {
    if (filteredItems.length === 0) return;
    try {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      const url = getAgendaSuratPdfBlobUrl({
        items: filteredItems,
        activeTab,
        filterKlasifikasi,
        filterStatus,
        searchQuery,
      });
      setPdfBlobUrl(url);
      setIsPdfModalOpen(true);
    } catch (err) {
      console.error('Gagal membuat pratinjau PDF:', err);
      alert('Terjadi kesalahan saat memproses pratinjau PDF.');
    }
  };

  const handleDeleteItem = (item: UnifiedSuratItem) => {
    const label = item.itemType === 'masuk' ? 'Surat Masuk' : 'Surat Keluar';
    if (confirm(`Yakin ingin menghapus berkas ${label} "${item.noSurat}" (${item.noAgenda})?`)) {
      if (item.itemType === 'masuk') {
        onDeleteSuratMasuk(item.id);
      } else {
        onDeleteSuratKeluar(item.id);
      }
    }
  };

  return (
    <div className="space-y-5 pb-12 select-none">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Navigation Path Back / Home */}
          {(onBack || onHome) && (
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#455f87]">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#dae2fd] text-[#0f1e36] hover:bg-[#e2e7ff] transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#0f1e36]" />
                  <span>Kembali</span>
                </button>
              )}
              {onHome && (
                <button
                  type="button"
                  onClick={onHome}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#dae2fd] text-[#0f1e36] hover:bg-[#e2e7ff] transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                >
                  <Home className="w-3.5 h-3.5 text-[#0f1e36]" />
                  <span>Dashboard</span>
                </button>
              )}
              <span className="text-[#8e9099]">•</span>
              <span className="text-[#44474d]">SIMONAS Agenda Terpadu</span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0f1e36] text-white flex items-center justify-center shadow-md">
              <Mail className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#131b2e] tracking-tight">
                Buku Agenda Surat Kedinasan (Masuk &amp; Keluar)
              </h1>
              <p className="text-xs text-[#44474d] mt-0.5">
                Pengelolaan terpadu agenda surat masuk dan keluar naskah dinas militer Paban IV Konst Slog TNI.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ekspor Laporan PDF (Utama) */}
          <button
            onClick={handleExportPdf}
            disabled={filteredItems.length === 0 || isGeneratingPdf}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md transition-all transform hover:scale-105 active:scale-95 border border-rose-500/40 cursor-pointer"
            title="Ekspor daftar berkas surat yang sedang difilter ke dalam dokumen PDF resmi untuk pelaporan"
          >
            <FileText className="w-3.5 h-3.5 text-rose-200" />
            <span>Ekspor PDF ({filteredItems.length})</span>
          </button>

          {/* Sinkron ke Google Sheets */}
          {onSyncSheets && (
            <button
              onClick={onSyncSheets}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Sinkronkan data real agenda surat masuk dan keluar ke Google Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Sinkron Google Sheets</span>
            </button>
          )}

          {/* Import & Klasifikasi Google Spreadsheet */}
          {onImportData && (
            <button
              onClick={() => setIsSpreadsheetImportOpen(true)}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0f1e36] hover:bg-[#1a3158] text-white text-xs font-bold shadow-xs transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Import data tabel dari Google Spreadsheet dan klasifikasikan secara manual sebagai Surat Masuk atau Keluar"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Spreadsheet</span>
            </button>
          )}

          {/* Pratinjau Dokumen PDF */}
          <button
            onClick={handleOpenPdfPreview}
            disabled={filteredItems.length === 0}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed text-rose-800 text-xs font-bold border border-rose-300 shadow-xs transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Buka pratinjau format cetak laporan PDF naskah kedinasan"
          >
            <Eye className="w-3.5 h-3.5 text-rose-700" />
            <span className="hidden sm:inline">Pratinjau PDF</span>
          </button>

          {/* Ekspor CSV */}
          <button
            onClick={exportCsv}
            disabled={filteredItems.length === 0}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-[#0f1e36] text-xs font-semibold border border-[#dae2fd] shadow-xs cursor-pointer"
            title="Ekspor CSV Agenda Surat"
          >
            <Download className="w-3.5 h-3.5 text-[#455f87]" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          {/* Cetak Langsung Browser */}
          <button
            onClick={() => window.print()}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#0f1e36] text-xs font-semibold border border-[#dae2fd] shadow-xs cursor-pointer"
            title="Cetak Buku Agenda Surat (Print Browser)"
          >
            <Printer className="w-3.5 h-3.5 text-[#455f87]" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          {/* Input OCR Cerdas */}
          <button
            onClick={() => onOpenOcr()}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all transform hover:scale-105 active:scale-95 border border-emerald-400/30 cursor-pointer"
            title="Pindai fisik berkas dengan OCR Cerdas"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Input OCR Cerdas</span>
          </button>

          <button
            onClick={() => setIsAddSMOpen(true)}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0f1e36] hover:bg-[#1e3a5f] text-white font-bold text-xs shadow-md transition-all transform hover:scale-105 active:scale-95 border border-emerald-500/30 cursor-pointer"
            title="Tambah Berkas Surat Masuk Baru"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Surat Masuk</span>
          </button>

          <button
            onClick={() => setIsAddSKOpen(true)}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1e3a5f] hover:bg-[#284a75] text-white font-bold text-xs shadow-md transition-all transform hover:scale-105 active:scale-95 border border-blue-400/30 cursor-pointer"
            title="Registrasi Surat Keluar Baru"
          >
            <Plus className="w-3.5 h-3.5 text-blue-300" />
            <span>+ Surat Keluar</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS STRIP (SAME PATTERN AS TELEGRAM) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl p-3.5 border border-[#dae2fd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#44474d] uppercase tracking-wider block">Total Agenda Surat</span>
            <span className="text-xl font-bold font-mono text-[#0f1e36]">{totalSurat}</span>
            <span className="text-[10px] text-[#7886a3] block">Masuk &amp; Keluar</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#f2f3ff] text-[#0f1e36] flex items-center justify-center font-bold">
            <Mail className="w-5 h-5 text-[#0f1e36]" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#dae2fd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Surat Masuk (SM)</span>
            <span className="text-xl font-bold font-mono text-emerald-600">{countMasuk}</span>
            <span className="text-[10px] text-emerald-700/80 block">Disposisi Pejabat</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Inbox className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#dae2fd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider block">Surat Keluar (SK)</span>
            <span className="text-xl font-bold font-mono text-blue-600">{countKeluar}</span>
            <span className="text-[10px] text-blue-700/80 block">TTE &amp; Ekspedisi</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Send className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#dae2fd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">Kilat / Rahasia</span>
            <span className="text-xl font-bold font-mono text-rose-600">{countRahasia}</span>
            <span className="text-[10px] text-rose-700/80 block">Prioritas Komando</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
        </div>
      </div>

      {/* FILTER & TABS SWITCHER (MATCHING TELEGRAM VIEW DESIGN) */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Unified Tab Filter */}
        <div className="flex items-center p-1 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#0f1e36] text-white shadow-xs'
                : 'text-[#44474d] hover:text-[#0f1e36]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Semua Surat ({totalSurat})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('masuk')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'masuk'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-[#44474d] hover:text-emerald-700'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Surat Masuk ({countMasuk})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keluar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'keluar'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-[#44474d] hover:text-blue-700'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Surat Keluar ({countKeluar})</span>
          </button>
        </div>

        {/* Quick Search & Subfilters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7886a3]" />
            <input
              type="text"
              placeholder="Cari No Agenda, No Surat, Instansi, Perihal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#f8f9ff] border border-[#dae2fd] text-xs text-[#131b2e] placeholder:text-[#8e9099] focus:outline-hidden focus:ring-1 focus:ring-[#0f1e36]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#44474d]">
            <Filter className="w-3.5 h-3.5 text-[#7886a3]" />
            <select
              value={filterKlasifikasi}
              onChange={(e) => setFilterKlasifikasi(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#f8f9ff] border border-[#dae2fd] text-xs text-[#131b2e] focus:outline-hidden"
            >
              <option value="all">Semua Sifat</option>
              <option value="Kilat">Kilat</option>
              <option value="Rahasia">Rahasia</option>
              <option value="Penting">Penting</option>
              <option value="Biasa">Biasa</option>
            </select>
          </div>
        </div>
      </div>

      {/* UNIFIED AGENDA TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dae2fd] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f2f3ff] text-[#44474d] border-b border-[#dae2fd] font-semibold">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-28">Tipe Agenda</th>
                <th className="py-3 px-3 w-40">No. Agenda &amp; Waktu</th>
                <th className="py-3 px-3 w-48">No. Surat &amp; Tgl Naskah</th>
                <th className="py-3 px-4 w-56">Instansi / Satuan</th>
                <th className="py-3 px-4">Perihal &amp; Ringkasan Berkas</th>
                <th className="py-3 px-3 w-28">Sifat / Klasifikasi</th>
                <th className="py-3 px-3 w-36">Status Disposisi / TTE</th>
                <th className="py-3 px-3 w-36 text-center">Aksi / Operasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dae2fd]/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#7886a3]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Mail className="w-8 h-8 text-[#dae2fd]" />
                      <p className="font-medium text-sm">Tidak ada berkas agenda yang sesuai kriteria.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterKlasifikasi('all');
                          setFilterStatus('all');
                          setActiveTab('all');
                        }}
                        className="text-xs text-[#0f1e36] font-bold underline cursor-pointer"
                      >
                        Reset semua filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isMasuk = item.itemType === 'masuk';
                  return (
                    <tr 
                      key={`${item.itemType}-${item.id}`}
                      className="hover:bg-[#f8f9ff] transition-colors group"
                    >
                      {/* 1. Index */}
                      <td className="py-3 px-3 text-center font-mono text-[#7886a3]">
                        {idx + 1}
                      </td>

                      {/* 2. Tipe Badge */}
                      <td className="py-3 px-3">
                        {isMasuk ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Inbox className="w-3 h-3 text-emerald-700" />
                            <span>SM • MASUK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <Send className="w-3 h-3 text-blue-700" />
                            <span>SK • KELUAR</span>
                          </span>
                        )}
                      </td>

                      {/* 3. No. Agenda & Waktu */}
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-[#0f1e36] truncate">
                          {item.noAgenda}
                        </div>
                        <div className="text-[10px] text-[#7886a3] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#7886a3]" />
                          <span>{isMasuk ? item.tglTerima : item.tglKirim}</span>
                        </div>
                      </td>

                      {/* 4. No. Surat & Tgl Surat */}
                      <td className="py-3 px-3 font-mono">
                        <div className="font-semibold text-[#131b2e] truncate" title={item.noSurat}>
                          {item.noSurat}
                        </div>
                        <div className="text-[10px] text-[#7886a3] mt-0.5">
                          Tgl: {item.tglSurat}
                        </div>
                      </td>

                      {/* 5. Instansi Asal / Tujuan */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#131b2e] truncate" title={isMasuk ? item.asalSurat : item.tujuanSurat}>
                          {isMasuk ? item.asalSurat : item.tujuanSurat}
                        </div>
                        <span className="text-[10px] font-mono text-[#7886a3]">
                          {isMasuk ? 'Asal Pengirim' : 'Instansi Tujuan'}
                        </span>
                      </td>

                      {/* 6. Perihal & Ringkasan */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#131b2e] line-clamp-1 group-hover:line-clamp-none transition-all">
                          {item.perihal}
                        </div>
                        {item.ringkasan && (
                          <div className="text-[11px] text-[#44474d] line-clamp-1 mt-0.5 italic">
                            {item.ringkasan}
                          </div>
                        )}
                      </td>

                      {/* 7. Klasifikasi */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            item.klasifikasi.toLowerCase().includes('kilat') || item.klasifikasi.toLowerCase().includes('rahasia')
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : item.klasifikasi.toLowerCase().includes('penting')
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {item.klasifikasi}
                        </span>
                      </td>

                      {/* 8. Status Disposisi / TTE */}
                      <td className="py-3 px-3">
                        {isMasuk ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span className="truncate max-w-[120px]">{item.statusDisposisi}</span>
                            </span>
                            <div className="text-[9px] font-mono text-[#7886a3] mt-0.5">
                              {item.disposisi ? 'Disposisi 4 Pejabat' : 'Draf Berkas'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                              <span className="truncate max-w-[120px]">{item.statusTTE}</span>
                            </span>
                            <div className="text-[9px] font-mono text-[#7886a3] mt-0.5">
                              Konseptor: {item.konseptor ? item.konseptor.split(' ')[0] : 'Minlog'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 9. Tombol Operasi Langsung */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Detail Preview */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isMasuk) {
                                onOpenOcr(item);
                              } else {
                                setPreviewItem(item);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#0f1e36] transition-all transform hover:scale-110 active:scale-90 cursor-pointer shadow-xs"
                            title={isMasuk ? "Lihat Disposisi & Scan OCR" : "Pratinjau Detail Surat Keluar"}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit / Ubah */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isMasuk) {
                                setEditingSM(item);
                              } else {
                                setEditingSK(item);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all transform hover:scale-110 active:scale-90 cursor-pointer shadow-xs"
                            title="Ubah Berkas"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Hapus */}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all transform hover:scale-110 active:scale-90 cursor-pointer shadow-xs"
                            title="Hapus Berkas dari Agenda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-3 bg-[#f2f3ff] border-t border-[#dae2fd] flex flex-col sm:flex-row items-center justify-between text-xs text-[#44474d] gap-2 font-mono">
          <span>Menampilkan {filteredItems.length} dari total {totalSurat} naskah dinas (SM: {countMasuk}, SK: {countKeluar}).</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Standar Agenda Militer Paban IV Konst Slog TNI</span>
          </div>
        </div>
      </div>

      {/* QUICK PREVIEW MODAL FOR SURAT KELUAR */}
      {previewItem && previewItem.itemType === 'keluar' && (
        <div className="fixed inset-0 z-50 bg-[#000412]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-[#dae2fd] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-[#0f1e36] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                <h3 className="font-heading font-bold text-sm text-white">Detail Registrasi Surat Keluar</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#f8f9ff] rounded-xl border border-[#dae2fd]">
                <div>
                  <span className="text-[#7886a3] font-mono block">No. Agenda SK:</span>
                  <span className="font-bold font-mono text-[#0f1e36] text-sm">{previewItem.noAgenda}</span>
                </div>
                <div>
                  <span className="text-[#7886a3] font-mono block">Tanggal Kirim:</span>
                  <span className="font-semibold text-[#131b2e]">{previewItem.tglKirim}</span>
                </div>
                <div>
                  <span className="text-[#7886a3] font-mono block">No. Surat Keluar:</span>
                  <span className="font-bold text-[#131b2e]">{previewItem.noSurat}</span>
                </div>
                <div>
                  <span className="text-[#7886a3] font-mono block">Tanggal Surat:</span>
                  <span className="font-semibold text-[#131b2e]">{previewItem.tglSurat}</span>
                </div>
              </div>

              <div>
                <span className="text-[#7886a3] font-mono block mb-1">Tujuan Pengiriman:</span>
                <p className="p-2.5 rounded-lg bg-[#f2f3ff] text-[#131b2e] font-bold border border-[#dae2fd]">
                  {previewItem.tujuanSurat}
                </p>
              </div>

              <div>
                <span className="text-[#7886a3] font-mono block mb-1">Perihal:</span>
                <p className="p-2.5 rounded-lg bg-[#f2f3ff] text-[#131b2e] font-semibold border border-[#dae2fd]">
                  {previewItem.perihal}
                </p>
              </div>

              {previewItem.ringkasan && (
                <div>
                  <span className="text-[#7886a3] font-mono block mb-1">Ringkasan Isi Naskah:</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 text-[#44474d] border border-slate-200 leading-relaxed">
                    {previewItem.ringkasan}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-[#f8f9ff] border border-[#dae2fd]">
                  <span className="text-[#7886a3] block">Klasifikasi:</span>
                  <span className="font-bold text-rose-700">{previewItem.klasifikasi}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#f8f9ff] border border-[#dae2fd]">
                  <span className="text-[#7886a3] block">Status TTE:</span>
                  <span className="font-bold text-blue-700">{previewItem.statusTTE}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#f8f9ff] border border-[#dae2fd]">
                  <span className="text-[#7886a3] block">Lampiran:</span>
                  <span className="font-bold text-[#0f1e36]">{previewItem.lampiranJumlah}</span>
                </div>
              </div>

              <div className="text-[11px] text-[#7886a3] pt-1 border-t border-[#dae2fd]">
                Konseptor: <span className="font-semibold text-[#131b2e]">{previewItem.konseptor}</span>
              </div>
            </div>

            <div className="p-3 bg-[#f2f3ff] border-t border-[#dae2fd] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingSK(previewItem);
                  setPreviewItem(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                Ubah Berkas Ini
              </button>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-3 py-1.5 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT SURAT MASUK */}
      {(isAddSMOpen || editingSM) && (
        <SuratMasukEditModal
          isOpen={isAddSMOpen || !!editingSM}
          initialData={editingSM}
          totalExisting={suratMasukList.length}
          onClose={() => {
            setIsAddSMOpen(false);
            setEditingSM(null);
          }}
          onSave={(saved) => {
            if (onSaveSuratMasuk) {
              onSaveSuratMasuk(saved);
            }
            setIsAddSMOpen(false);
            setEditingSM(null);
          }}
        />
      )}

      {/* MODAL: TAMBAH / EDIT SURAT KELUAR */}
      {(isAddSKOpen || editingSK) && (
        <SuratKeluarModal
          isOpen={isAddSKOpen || !!editingSK}
          initialData={editingSK}
          totalExisting={suratKeluarList.length}
          onClose={() => {
            setIsAddSKOpen(false);
            setEditingSK(null);
          }}
          onSave={(saved) => {
            if (onSaveSuratKeluar) {
              onSaveSuratKeluar(saved);
            }
            setIsAddSKOpen(false);
            setEditingSK(null);
          }}
        />
      )}
      {/* MODAL PRATINJAU DOKUMEN PDF RESMI */}
      {isPdfModalOpen && pdfBlobUrl && (
        <div className="fixed inset-0 z-50 bg-[#000412]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl border border-[#dae2fd] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-[#0f1e36] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600/30 border border-rose-400/30 flex items-center justify-center text-rose-300">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">
                    Pratinjau Laporan Resmi Buku Agenda Surat Kedinasan (Format PDF)
                  </h3>
                  <p className="text-[11px] text-[#adc8f5] font-mono mt-0.5">
                    Standar Tata Naskah Militer TNI • Paban IV Konstruksi Slog TNI • A4 Landscape
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  title="Unduh File PDF Sekarang"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Dokumen PDF</span>
                </button>

                <a
                  href={pdfBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Buka Dokumen di Tab Baru"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Summary Context Bar */}
            <div className="px-4 py-2 bg-[#f2f3ff] border-b border-[#dae2fd] flex flex-wrap items-center justify-between text-xs text-[#44474d] shrink-0 font-mono">
              <div className="flex items-center gap-3">
                <span>Filter Terpilih: <strong>{activeTab === 'all' ? 'Semua Berkas' : activeTab === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}</strong></span>
                <span>•</span>
                <span>Total: <strong>{filteredItems.length} Naskah Kedinasan</strong></span>
                {filterKlasifikasi !== 'all' && <span>• Klasifikasi: <strong>{filterKlasifikasi}</strong></span>}
                {filterStatus !== 'all' && <span>• Status: <strong>{filterStatus}</strong></span>}
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                TTE Militer &amp; Kop Sah Terverifikasi
              </span>
            </div>

            {/* Embedded PDF Viewer */}
            <div className="flex-1 p-3 bg-slate-100 overflow-hidden relative">
              <iframe
                src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full rounded-xl border border-slate-300 shadow-sm bg-white"
                title="Laporan PDF Buku Agenda Surat"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-[#dae2fd] flex items-center justify-between shrink-0">
              <span className="text-xs text-[#7886a3]">
                Dokumen resmi siap dicetak langsung atau disimpan sebagai arsip PDF pertanggungjawaban dinas.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File (.pdf)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white font-bold text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFIKASI SUKSES UNDUH PDF */}
      {pdfExportSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#0f1e36] text-white rounded-xl shadow-2xl border border-emerald-500/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs block text-white">Dokumen PDF Berhasil Diekspor</span>
            <span className="text-[11px] text-[#adc8f5] font-mono">
              Laporan buku agenda ({filteredItems.length} naskah dinas) siap digunakan untuk pelaporan.
            </span>
          </div>
        </div>
      )}

      {/* SPREADSHEET IMPORT & MANUAL CLASSIFICATION MODAL */}
      {isSpreadsheetImportOpen && (
        <SpreadsheetImportModal
          isOpen={isSpreadsheetImportOpen}
          onClose={() => setIsSpreadsheetImportOpen(false)}
          onImportCompleted={(imported) => {
            if (onImportData) {
              onImportData({
                suratMasuk: [...suratMasukList, ...imported.suratMasuk],
                suratKeluar: [...suratKeluarList, ...imported.suratKeluar],
                telegram: [...telegramList, ...imported.telegram]
              });
            } else {
              imported.suratMasuk.forEach(sm => onSaveSuratMasuk?.(sm));
              imported.suratKeluar.forEach(sk => onSaveSuratKeluar?.(sk));
            }
          }}
          googleUser={googleUser}
          linkedSpreadsheetId={linkedSpreadsheetId}
        />
      )}
    </div>
  );
};
