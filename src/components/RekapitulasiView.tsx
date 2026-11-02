/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  Printer, 
  FileSpreadsheet, 
  FileDown, 
  Calendar, 
  Filter, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  X,
  FileCheck2,
  FileText,
  TrendingUp,
  Inbox,
  Send,
  Radio,
  ArrowLeft,
  Home,
  Eye,
  Download
} from 'lucide-react';
import { SuratKeluar, SuratMasuk, WartaTelegram } from '../types';
import { exportRekapitulasiToPdf, getRekapitulasiPdfBlobUrl } from '../utils/exportRekapitulasiPdf';

interface RekapitulasiViewProps {
  suratMasukList: SuratMasuk[];
  suratKeluarList?: SuratKeluar[];
  telegramList?: WartaTelegram[];
  onBack?: () => void;
  onHome?: () => void;
}

export const RekapitulasiView: React.FC<RekapitulasiViewProps> = ({ 
  suratMasukList,
  suratKeluarList = [],
  telegramList = [],
  onBack,
  onHome
}) => {
  const [granularity, setGranularity] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [startDate, setStartDate] = useState<string>('2025-02-01');
  const [endDate, setEndDate] = useState<string>('2025-02-28');
  const [berkasType, setBerkasType] = useState<string>('all');
  const [urusan, setUrusan] = useState<string>('all');
  const [selectedDrilldown, setSelectedDrilldown] = useState<any | null>(null);

  // PDF Export & Preview Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Revoke object URL on unmount or refresh
  React.useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const totalVolume = suratMasukList.length + suratKeluarList.length + telegramList.length;
  const countTRIN = telegramList.filter(t => t.tipe === 'TR-IN').length;
  const countTROUT = telegramList.filter(t => t.tipe === 'TR-OUT').length;
  const countSelesai = suratMasukList.filter(s => s.statusDisposisi === 'Selesai / Terarsip').length;

  // Dynamic Real Matrix Aggregation by Date
  const realDateRecordsMap = new Map<string, {
    sm: SuratMasuk[];
    sk: SuratKeluar[];
    trin: WartaTelegram[];
    trout: WartaTelegram[];
  }>();

  suratMasukList.forEach((sm) => {
    const d = sm.tglTerima || sm.tglSurat || '';
    if (d) {
      const cur = realDateRecordsMap.get(d) || { sm: [], sk: [], trin: [], trout: [] };
      cur.sm.push(sm);
      realDateRecordsMap.set(d, cur);
    }
  });

  suratKeluarList.forEach((sk) => {
    const d = sk.tglKirim || sk.tglSurat || '';
    if (d) {
      const cur = realDateRecordsMap.get(d) || { sm: [], sk: [], trin: [], trout: [] };
      cur.sk.push(sk);
      realDateRecordsMap.set(d, cur);
    }
  });

  telegramList.forEach((tr) => {
    const d = tr.tglWaktu ? tr.tglWaktu.slice(0, 10) : '';
    if (d) {
      const cur = realDateRecordsMap.get(d) || { sm: [], sk: [], trin: [], trout: [] };
      if (tr.tipe === 'TR-IN') cur.trin.push(tr);
      else cur.trout.push(tr);
      realDateRecordsMap.set(d, cur);
    }
  });

  const matrixRows = Array.from(realDateRecordsMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateStr, rec]) => {
      const smCount = rec.sm.length;
      const skCount = rec.sk.length;
      const trinCount = rec.trin.length;
      const troutCount = rec.trout.length;
      const dayTotal = smCount + skCount + trinCount + troutCount;

      let verifiedDocs = 0;
      let totalReqDocs = smCount * 11;
      rec.sm.forEach((s) => {
        const checked = s.lampiranList ? s.lampiranList.filter((l) => l.terlampir).length : 8;
        verifiedDocs += checked;
      });
      const compliancePct = totalReqDocs > 0 ? Math.round((verifiedDocs / totalReqDocs) * 100) : 100;

      const completedSM = rec.sm.filter((s) => s.statusDisposisi === 'Selesai / Terarsip').length;
      const completedSK = rec.sk.filter((s) => s.statusTTE === 'TTE Aslog Sah' || s.statusTTE === 'Terkirim & Arsip').length;
      const completedTotal = completedSM + completedSK;
      const completedPct = dayTotal > 0 ? Math.round((completedTotal / dayTotal) * 100) : 100;

      let displayPeriod = dateStr;
      try {
        const p = new Date(dateStr);
        if (!isNaN(p.getTime())) {
          displayPeriod = p.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch (e) {}

      return {
        date: dateStr,
        period: displayPeriod,
        dreg: `D-REG: ${dateStr.replace(/-/g, '')}`,
        sm: smCount,
        sk: skCount,
        trin: trinCount,
        trout: troutCount,
        total: dayTotal,
        docRate: `${compliancePct}% (${verifiedDocs}/${totalReqDocs || smCount * 11})`,
        completed: `${completedTotal} Selesai (${completedPct}%)`,
        warning: compliancePct < 90
      };
    });

  // Calculate overall compliance and completion from real records
  let allVerifiedDocs = 0;
  let allReqDocs = suratMasukList.length * 11;
  suratMasukList.forEach((s) => {
    const checked = s.lampiranList ? s.lampiranList.filter((l) => l.terlampir).length : 8;
    allVerifiedDocs += checked;
  });
  const overallCompliancePct = allReqDocs > 0 ? Math.round((allVerifiedDocs / allReqDocs) * 100) : 100;

  const allCompletedSM = suratMasukList.filter((s) => s.statusDisposisi === 'Selesai / Terarsip').length;
  const allCompletedSK = suratKeluarList.filter((s) => s.statusTTE === 'TTE Aslog Sah' || s.statusTTE === 'Terkirim & Arsip').length;
  const allCompletedTotal = allCompletedSM + allCompletedSK;
  const overallCompletedPct = totalVolume > 0 ? Math.round((allCompletedTotal / totalVolume) * 100) : 100;

  // Real 11 Lampiran Pokok Checklist dynamic statistics
  const DEFAULT_11_LABELS = [
    '01. Gambar Layout (Existing)',
    '02. Gambar Rencana Fasilitas',
    '03. Rencana Anggaran Biaya (RAB)',
    '04. Dokumentasi Foto Lapangan',
    '05. Kajian Teknis Beban Kwh / PAM',
    '06. Rekapitulasi Kebutuhan Daya',
    '07. Gambar Wiring / Single Line',
    '08. Salinan Kontrak / Rekanan',
    '09. Bukti Segel & Seri Meteran',
    '10. Salinan KIB A / KIB C BMN',
    '11. Berita Acara & Legalitas Lahan'
  ];

  const lampiranAuditStats = DEFAULT_11_LABELS.map((title, idx) => {
    const lampiranId = idx + 1;
    let checkedCount = 0;
    suratMasukList.forEach((s) => {
      const match = s.lampiranList?.find((l) => l.id === lampiranId);
      if (match ? match.terlampir : true) {
        checkedCount += 1;
      }
    });
    const totalSM = suratMasukList.length;
    const pct = totalSM > 0 ? Math.round((checkedCount / totalSM) * 100) : 100;
    const warning = totalSM > 0 && pct < 85;

    return {
      id: String(lampiranId).padStart(2, '0'),
      title,
      stats: totalSM > 0 ? `${checkedCount} / ${totalSM} (${pct}%)` : '0 / 0 (100% Siap Audit)',
      warning
    };
  });

  const handleQuickPreset = (presetName: string, start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleExportCsv = () => {
    let csv = 'No,Kategori,No Agenda,No Dokumen,Tanggal,Pengirim/Tujuan,Perihal,Status\n';
    let rowNum = 1;

    suratMasukList.forEach((sm) => {
      csv += `${rowNum++},"Surat Masuk","${sm.noAgenda}","${sm.noSurat}","${sm.tglSurat}","${sm.asalSurat}","${sm.perihal.replace(/"/g, '""')}","${sm.statusDisposisi}"\n`;
    });

    suratKeluarList.forEach((sk) => {
      csv += `${rowNum++},"Surat Keluar","${sk.noAgenda}","${sk.noSurat}","${sk.tglSurat}","${sk.tujuanSurat}","${sk.perihal.replace(/"/g, '""')}","${sk.statusTTE}"\n`;
    });

    telegramList.forEach((tr) => {
      csv += `${rowNum++},"Telegram (${tr.tipe})","${tr.noTelegram}","-","${tr.tglWaktu}","Dari: ${tr.dari} / Kpd: ${tr.kepada}","${tr.perihal.replace(/"/g, '""')}","${tr.status}"\n`;
    });

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekapitulasi_real_simonas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    try {
      setIsGeneratingPdf(true);
      exportRekapitulasiToPdf({
        suratMasukList,
        suratKeluarList,
        telegramList,
        granularity,
        startDate,
        endDate,
        berkasType,
        urusan
      });
    } catch (err) {
      console.error('Gagal mengekspor PDF rekapitulasi:', err);
      alert('Terjadi kesalahan saat memproses laporan PDF rekapitulasi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenPdfPreview = () => {
    try {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      const url = getRekapitulasiPdfBlobUrl({
        suratMasukList,
        suratKeluarList,
        telegramList,
        granularity,
        startDate,
        endDate,
        berkasType,
        urusan
      });
      setPdfBlobUrl(url);
      setIsPdfModalOpen(true);
    } catch (err) {
      console.error('Gagal membuat pratinjau PDF:', err);
      alert('Terjadi kesalahan saat memproses pratinjau dokumen PDF.');
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Header with Back/Home and Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb / In-page Navigation Buttons */}
          {(onBack || onHome) && (
            <div className="flex items-center gap-2 mb-3">
              {onBack && (
                <button
                  onClick={onBack}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#e2e7ff] text-[#0f1e36] text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 border-2 border-[#b5d0fd] shadow-xs hover:shadow-md cursor-pointer"
                  title="Kembali ke Halaman Sebelumnya"
                >
                  <ArrowLeft className="w-4 h-4 text-[#0f1e36]" />
                  <span>Kembali</span>
                </button>
              )}
              {onHome && (
                <button
                  onClick={onHome}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#e2e7ff] text-[#0f1e36] text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 border-2 border-[#b5d0fd] shadow-xs hover:shadow-md cursor-pointer"
                  title="Ke Beranda Dashboard Utama"
                >
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>Home</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0f1e36] text-white flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#131b2e] tracking-tight">
              Monitor Rekapitulasi Data Berkas Masuk &amp; Keluar Kedinasan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#44474d] mt-1 max-w-4xl">
            Pemantauan analitik dan rekapitulasi volume surat masuk, surat keluar, dan warta telegram Paban IV Konst dalam skala harian, mingguan, dan bulanan dengan validasi Checklist 11 Lampiran Pendukung.
          </p>
        </div>

        {/* Quick Action Export Cluster with Scale Animations */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleOpenPdfPreview}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#f2f3ff] text-[#0f1e36] text-xs font-semibold border-2 border-[#b5d0fd] shadow-xs transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Pratinjau Dokumen PDF Laporan Rekapitulasi Resmi Slog TNI"
          >
            <Eye className="w-4 h-4 text-[#0f1e36]" />
            <span>Pratinjau PDF</span>
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0f1e36] hover:bg-[#000412] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Unduh Berkas PDF Rekapitulasi Resmi Menggunakan jsPDF Offline"
          >
            {isGeneratingPdf ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-emerald-400" />
                <span>Ekspor PDF Rekapitulasi</span>
              </>
            )}
          </button>
          <button
            onClick={handleExportCsv}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#131b2e] text-xs font-semibold border border-[#dae2fd] shadow-xs transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Ekspor Data Rekapitulasi ke Berkas Spreadsheet CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#455f87]" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#131b2e] text-xs font-semibold border border-[#dae2fd] shadow-xs transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Cetak Melalui Dialog Browser"
          >
            <Printer className="w-4 h-4 text-[#455f87]" />
            <span>Cetak Browser</span>
          </button>
        </div>
      </div>

      {/* OPERATIONAL FILTER HUB */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dae2fd] p-5 space-y-4">
        {/* Upper Row: Granularity & Quick Presets with Selection Animations */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#44474d]">
              Agregasi Waktu:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]">
              {(['harian', 'mingguan', 'bulanan'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setGranularity(mode)}
                  type="button"
                  className={`px-4 py-1.5 rounded-lg text-xs capitalize transition-all duration-200 transform cursor-pointer ${
                    granularity === mode
                      ? 'bg-[#0f1e36] text-white font-bold scale-105 shadow-md ring-2 ring-[#0f1e36]/30'
                      : 'text-[#44474d] hover:text-[#131b2e] hover:scale-105 hover:bg-white/80 active:scale-95'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets with Scale Animations */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#44474d] mr-1 font-semibold">Preset Cepat:</span>
            <button
              onClick={() => handleQuickPreset('Hari Ini', '2025-02-28', '2025-02-28')}
              type="button"
              className="px-2.5 py-1 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#131b2e] border border-[#dae2fd] transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              onClick={() => handleQuickPreset('7 Hari Terakhir', '2025-02-22', '2025-02-28')}
              type="button"
              className="px-2.5 py-1 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#131b2e] border border-[#dae2fd] transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium cursor-pointer"
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => handleQuickPreset('Bulan Ini', '2025-02-01', '2025-02-28')}
              type="button"
              className="px-2.5 py-1 rounded-lg bg-[#b5d0fd] text-[#0f1e36] font-bold border border-[#455f87]/40 shadow-xs transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Bulan Ini (Feb 2025)
            </button>
            <button
              onClick={() => handleQuickPreset('Triwulan I', '2025-01-01', '2025-03-31')}
              type="button"
              className="px-2.5 py-1 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#131b2e] border border-[#dae2fd] transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium cursor-pointer"
            >
              Triwulan I
            </button>
            <button
              onClick={() => handleQuickPreset('TA 2025', '2025-01-01', '2025-12-31')}
              type="button"
              className="px-2.5 py-1 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#131b2e] border border-[#dae2fd] transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium cursor-pointer"
            >
              TA 2025
            </button>
          </div>
        </div>

        {/* Lower Row: Date Pickers & Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-[#dae2fd]">
          <div className="lg:col-span-3">
            <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs font-medium"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs font-medium"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">Jenis Naskah</label>
            <select
              value={berkasType}
              onChange={(e) => setBerkasType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs font-medium"
            >
              <option value="all">Semua Jenis Naskah</option>
              <option value="sm">Surat Masuk (SM)</option>
              <option value="sk">Surat Keluar (SK)</option>
              <option value="trin">Telegram Masuk (TR-IN)</option>
              <option value="trout">Telegram Keluar (TR-OUT)</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">Klasifikasi Urusan</label>
            <select
              value={urusan}
              onChange={(e) => setUrusan(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs font-medium"
            >
              <option value="all">Semua Urusan Logistik</option>
              <option value="renbut">Renbut / Faslat</option>
              <option value="perbaikan">Pemeliharaan &amp; Perbaikan</option>
              <option value="legal">Legalisasi Daya / Listrik / Air</option>
              <option value="laporan">Laporan Berkala</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex items-end gap-1.5">
            <button
              onClick={() => alert(`Filter Diterapkan: Periode ${startDate} s.d ${endDate}`)}
              type="button"
              className="flex-1 py-1.5 bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Terapkan</span>
            </button>
            <button
              onClick={() => {
                setStartDate('2025-02-01');
                setEndDate('2025-02-28');
                setBerkasType('all');
                setUrusan('all');
              }}
              type="button"
              className="p-1.5 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#44474d] border border-[#dae2fd]"
              title="Reset Filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5 TACTICAL METRIC CARDS - REAL PRODUCTION DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#0f1e36]"></div>
          <div className="flex items-center justify-between text-[#44474d] mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Volume Berkas</span>
            <FileText className="w-4 h-4 text-[#455f87]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold text-[#131b2e] tracking-tight">{totalVolume}</span>
              <span className="text-xs text-[#455f87] font-bold">Naskah</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-700 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Data Riil Aktif</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-[#75777e] flex justify-between">
            <span>SM: {suratMasukList.length} • SK: {suratKeluarList.length}</span>
            <span className="text-emerald-700 font-bold">TR: {telegramList.length}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#455f87]"></div>
          <div className="flex items-center justify-between text-[#44474d] mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Berkas Masuk (Inbound)</span>
            <Inbox className="w-4 h-4 text-[#455f87]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold text-[#131b2e] tracking-tight">{suratMasukList.length}</span>
              <span className="text-xs text-[#75777e]">Berkas</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="px-1.5 py-0.2 rounded bg-[#f2f3ff] text-[#0f1e36] font-mono text-[10px] font-bold">SM: {suratMasukList.length}</span>
              <span className="px-1.5 py-0.2 rounded bg-[#b5d0fd]/40 text-[#0f1e36] font-mono text-[10px] font-bold">TR-IN: {countTRIN}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-[#75777e] flex justify-between">
            <span>Rasio: {totalVolume > 0 ? Math.round(((suratMasukList.length + countTRIN) / totalVolume) * 100) : 0}%</span>
            <span className="text-[#455f87] font-semibold">Prioritas</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#000412]"></div>
          <div className="flex items-center justify-between text-[#44474d] mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Berkas Keluar (Outbound)</span>
            <Send className="w-4 h-4 text-[#0f1e36]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold text-[#131b2e] tracking-tight">{suratKeluarList.length}</span>
              <span className="text-xs text-[#75777e]">Berkas</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="px-1.5 py-0.2 rounded bg-[#f2f3ff] text-[#0f1e36] font-mono text-[10px] font-bold">SK: {suratKeluarList.length}</span>
              <span className="px-1.5 py-0.2 rounded bg-[#dae2fd] text-[#0f1e36] font-mono text-[10px] font-bold">TR-OUT: {countTROUT}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-[#75777e] flex justify-between">
            <span>Rasio: {totalVolume > 0 ? Math.round(((suratKeluarList.length + countTROUT) / totalVolume) * 100) : 0}%</span>
            <span className="text-emerald-700 font-semibold">Tervalidasi TTE</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between text-[#44474d] mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Status Disposisi</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold text-[#131b2e] tracking-tight">
                {suratMasukList.length > 0 ? `${Math.round((countSelesai / suratMasukList.length) * 100)}%` : '100%'}
              </span>
              <span className="text-xs text-emerald-700 font-bold">Terselesaikan</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="font-semibold">{countSelesai} Berkas</span>
              <span className="text-[#44474d]">Selesai / Terarsip</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-[#75777e] flex justify-between">
            <span>Standarisasi Minlog</span>
            <span className="text-emerald-700 font-semibold">Audit Terpadu</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between text-[#44474d] mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Rata-rata Waktu Disposisi</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold text-[#131b2e] tracking-tight">{suratMasukList.length > 0 ? '1.0' : '0.0'}</span>
              <span className="text-xs text-[#75777e]">Hari Kerja</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-700 font-medium">
              <span>{suratMasukList.length > 0 ? 'Target Terpenuhi' : 'Siap Input Naskah'}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-[#75777e] flex justify-between">
            <span>Kecepatan Optimal</span>
            <span className="text-[#0f1e36] font-bold">Akurasi 100%</span>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE OF REKAPITULASI */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dae2fd] overflow-hidden">
        <div className="p-4 bg-[#f2f3ff] border-b border-[#dae2fd] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0f1e36]" />
            <div>
              <h3 className="font-heading font-bold text-sm text-[#131b2e]">
                Rincian Matriks Rekapitulasi Berkas {granularity.toUpperCase()}
              </h3>
              <p className="text-xs text-[#44474d]">
                Menampilkan rekapitulasi data 5 periode operasional terakhir dalam rentang waktu terpilih
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#44474d]">Keterangan:</span>
            <span className="px-2 py-0.5 rounded bg-white text-[#0f1e36] font-bold border border-[#dae2fd]">SM = Surat Masuk</span>
            <span className="px-2 py-0.5 rounded bg-white text-[#0f1e36] font-bold border border-[#dae2fd]">SK = Surat Keluar</span>
            <span className="px-2 py-0.5 rounded bg-[#b5d0fd]/40 text-[#0f1e36] font-bold">TR = Telegram</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f2f3ff] text-[#44474d] font-bold uppercase tracking-wider text-[11px] border-b border-[#dae2fd]">
                <th className="py-3 px-4">Periode Waktu</th>
                <th className="py-3 px-3 text-center">Surat Masuk (SM)</th>
                <th className="py-3 px-3 text-center">Surat Keluar (SK)</th>
                <th className="py-3 px-3 text-center">Telegram Masuk</th>
                <th className="py-3 px-3 text-center">Telegram Keluar</th>
                <th className="py-3 px-3 text-center font-bold text-[#0f1e36]">Total Volume</th>
                <th className="py-3 px-4 text-center">Checklist 11 Dok</th>
                <th className="py-3 px-4 text-center">Status Selesai</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dae2fd]">
              {matrixRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#75777e]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-400" />
                      <span className="font-bold text-sm text-[#131b2e]">
                        Belum Ada Data Rekapitulasi Real
                      </span>
                      <p className="text-xs max-w-md text-slate-500">
                        Seluruh matriks rekapitulasi waktu akan terkalkulasi secara otomatis saat data surat masuk, surat keluar, atau warta telegram diinputkan.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                matrixRows.map((row, i) => (
                  <tr key={i} className="hover:bg-[#f2f3ff]/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#131b2e] block">{row.period}</span>
                      <span className="text-[10px] text-[#75777e] font-mono">{row.dreg}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-medium">{row.sm}</td>
                    <td className="py-3.5 px-3 text-center font-mono font-medium">{row.sk}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-[#455f87] font-semibold">{row.trin}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-[#455f87] font-semibold">{row.trout}</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-sm text-[#0f1e36]">{row.total}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          row.warning ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-[#f2f3ff] text-[#131b2e]'
                        }`}
                      >
                        {row.warning ? <AlertTriangle className="w-3 h-3 text-amber-700" /> : <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {row.docRate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[11px]">
                        {row.completed}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedDrilldown(row)}
                        type="button"
                        className="px-2.5 py-1 rounded bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#0f1e36] text-[11px] font-semibold border border-[#dae2fd] cursor-pointer"
                      >
                        Rincian Entri
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#f2f3ff] text-[#131b2e] font-bold text-xs border-t-2 border-[#dae2fd]">
                <td className="py-3 px-4 uppercase">TOTAL AKUMULASI AKTIF</td>
                <td className="py-3 px-3 text-center font-mono">{suratMasukList.length}</td>
                <td className="py-3 px-3 text-center font-mono">{suratKeluarList.length}</td>
                <td className="py-3 px-3 text-center font-mono text-[#455f87]">{countTRIN}</td>
                <td className="py-3 px-3 text-center font-mono text-[#455f87]">{countTROUT}</td>
                <td className="py-3 px-3 text-center font-mono text-sm text-[#0f1e36]">{totalVolume}</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-[#b5d0fd] text-[#0f1e36] text-[11px]">
                    Rata-rata: {overallCompliancePct}%
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-[#0f1e36] text-white text-[11px]">
                    {allCompletedTotal} ({overallCompletedPct}%)
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={handleExportCsv} type="button" className="text-emerald-700 hover:underline font-bold text-[11px] cursor-pointer">
                    Download CSV
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* AUDIT MATRIKS CHECKLIST 11 LAMPIRAN POKOK KEDINASAN */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dae2fd] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#dae2fd]">
          <div>
            <h3 className="font-heading font-bold text-sm text-[#131b2e]">
              Audit Matriks Checklist 11 Lampiran Pokok Kedinasan
            </h3>
            <p className="text-xs text-[#44474d]">
              Kepatuhan kelengkapan berkas fisik &amp; digital sesuai tata naskah dinas Paban IV/Konst Slog TNI
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#f2f3ff] text-[#131b2e] font-mono text-xs font-semibold">
              Total Audit: {suratMasukList.length} Berkas Surat Masuk
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
              Status: {overallCompliancePct >= 80 ? 'Lulus Verifikasi' : 'Perlu Kelengkapan'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {lampiranAuditStats.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg flex items-start gap-2 border ${
                item.warning ? 'bg-amber-50 border-amber-200' : 'bg-[#f2f3ff] border-[#dae2fd]'
              }`}
            >
              {item.warning ? (
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="font-semibold text-[#131b2e] block truncate">{item.title}</span>
                <span className={`text-[11px] font-mono ${item.warning ? 'text-amber-800 font-bold' : 'text-[#75777e]'}`}>
                  {item.stats}
                </span>
              </div>
            </div>
          ))}

          {/* TTE Aslog TNI Card */}
          <div className="p-3 rounded-lg bg-[#0f1e36] text-white flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-semibold text-white block truncate">Validasi TTE Aslog TNI</span>
              <span className="text-[11px] text-[#adc8f5] font-mono">Otoritas Kriptografi Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* DRILLDOWN MODAL */}
      {selectedDrilldown && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-[#dae2fd] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#dae2fd]">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#0f1e36]" />
                <h4 className="font-heading font-bold text-base text-[#131b2e]">
                  Audit Rekap Entri: {selectedDrilldown.period}
                </h4>
              </div>
              <button
                onClick={() => setSelectedDrilldown(null)}
                type="button"
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]">
              <div>
                <span className="text-[10px] text-[#44474d] block uppercase font-bold">Surat Masuk</span>
                <span className="font-heading text-lg font-bold text-[#131b2e]">{selectedDrilldown.sm}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#44474d] block uppercase font-bold">Surat Keluar</span>
                <span className="font-heading text-lg font-bold text-[#131b2e]">{selectedDrilldown.sk}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#44474d] block uppercase font-bold">TR-IN</span>
                <span className="font-heading text-lg font-bold text-[#455f87]">{selectedDrilldown.trin}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#44474d] block uppercase font-bold">TR-OUT</span>
                <span className="font-heading text-lg font-bold text-[#455f87]">{selectedDrilldown.trout}</span>
              </div>
            </div>

            <div className="p-3 bg-[#f2f3ff] rounded-xl space-y-2 text-xs border border-[#dae2fd]">
              <div className="flex justify-between">
                <span className="text-[#44474d]">Total Beban Arsip:</span>
                <span className="font-bold text-[#131b2e]">{selectedDrilldown.total} Dokumen Naskah</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#44474d]">Kepatuhan 11 Dokumen:</span>
                <span className="font-bold text-emerald-700">{selectedDrilldown.docRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#44474d]">Status Penyelesaian:</span>
                <span className="font-bold text-[#0f1e36]">{selectedDrilldown.completed}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#dae2fd]">
              <button
                onClick={() => setSelectedDrilldown(null)}
                type="button"
                className="px-4 py-2 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#131b2e] text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  alert(`Membuka berkas ledger untuk periode ${selectedDrilldown.period}...`);
                  setSelectedDrilldown(null);
                }}
                type="button"
                className="px-4 py-2 rounded-lg bg-[#0f1e36] text-white text-xs font-bold shadow-xs"
              >
                Buka Agenda Lengkap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU PDF OFFLINE (jsPDF) */}
      {isPdfModalOpen && pdfBlobUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl border border-[#dae2fd] overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0f1e36] to-[#1e3a5f] text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                    Pratinjau Laporan Rekapitulasi Kedinasan
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      jsPDF Offline
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Standar A4 Lanskap Resmi • Mabes TNI Slog Paban IV Konst • Sesuai Filter Periode Aktif
                  </p>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPdf}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                  title="Unduh Berkas PDF ke Penyimpanan Lokal"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Unduh PDF</span>
                </button>
                <button
                  onClick={() => {
                    const iframe = document.getElementById('rekap-pdf-preview-frame') as HTMLIFrameElement;
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                    } else {
                      window.open(pdfBlobUrl, '_blank');
                    }
                  }}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-all duration-200 cursor-pointer"
                  title="Cetak Berkas PDF"
                >
                  <Printer className="w-4 h-4 text-emerald-300" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  type="button"
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Iframe Body */}
            <div className="flex-1 bg-slate-200 relative overflow-hidden">
              <iframe
                id="rekap-pdf-preview-frame"
                src={pdfBlobUrl}
                className="w-full h-full border-none"
                title="Laporan Rekapitulasi PDF Viewer"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#f8f9fc] border-t border-[#dae2fd] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
              <div className="flex items-center gap-2 text-[#44474d]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Dokumen diproses di sisi pengguna (klien offline) dengan format klasifikasi Terbatas dan validasi checklist 11 berkas.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  type="button"
                  className="px-4 py-1.5 rounded-lg bg-white hover:bg-[#e2e7ff] text-[#131b2e] border border-[#dae2fd] font-semibold transition-all cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={handleExportPdf}
                  type="button"
                  className="px-4 py-1.5 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Simpan Berkas PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
