import React, { useState } from 'react';
import { 
  Inbox, 
  Send, 
  Radio, 
  Mail,
  FileCheck2, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Printer, 
  Microscope, 
  ChevronRight,
  PlusCircle,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  BarChart3
} from 'lucide-react';
import { SuratKeluar, SuratMasuk, WartaTelegram } from '../types';
import { ActivePage } from './Sidebar';
import { SuratMasukEditModal } from './SuratMasukEditModal';
import { SuratKeluarModal } from './SuratKeluarModal';
import { TelegramModal } from './TelegramModal';

interface DashboardViewProps {
  suratMasukList: SuratMasuk[];
  suratKeluarList: SuratKeluar[];
  telegramList: WartaTelegram[];
  onNavigate: (page: ActivePage) => void;
  onOpenOcr: (surat?: SuratMasuk, mode?: 'ocr' | 'print' | 'split') => void;
  onOpenForensic: (surat: SuratMasuk) => void;
  onSaveSuratMasuk?: (surat: SuratMasuk) => void;
  onDeleteSuratMasuk?: (id: string) => void;
  onSaveSuratKeluar?: (surat: SuratKeluar) => void;
  onDeleteSuratKeluar?: (id: string) => void;
  onSaveTelegram?: (telegram: WartaTelegram) => void;
  onDeleteTelegram?: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  suratMasukList,
  suratKeluarList,
  telegramList,
  onNavigate,
  onOpenOcr,
  onOpenForensic,
  onSaveSuratMasuk,
  onDeleteSuratMasuk,
  onSaveSuratKeluar,
  onDeleteSuratKeluar,
  onSaveTelegram,
  onDeleteTelegram
}) => {
  const [trendGranularity, setTrendGranularity] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [activeTableTab, setActiveTableTab] = useState<'agenda-surat' | 'telegram'>('agenda-surat');
  const [suratSubFilter, setSuratSubFilter] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [telegramSubFilter, setTelegramSubFilter] = useState<'all' | 'TR-IN' | 'TR-OUT'>('all');

  // Modal states for CRUD operations
  const [isAddSMOpen, setIsAddSMOpen] = useState(false);
  const [editingSM, setEditingSM] = useState<SuratMasuk | null>(null);

  const [isAddSKOpen, setIsAddSKOpen] = useState(false);
  const [editingSK, setEditingSK] = useState<SuratKeluar | null>(null);
  const [previewSK, setPreviewSK] = useState<SuratKeluar | null>(null);

  const [isAddTROpen, setIsAddTROpen] = useState(false);
  const [editingTR, setEditingTR] = useState<WartaTelegram | null>(null);
  const [selectedTRToRead, setSelectedTRToRead] = useState<WartaTelegram | null>(null);

  const totalSurat = suratMasukList.length + suratKeluarList.length;
  const totalVolume = totalSurat + telegramList.length;

  // Unified surat entries for the dashboard
  const unifiedSuratList = [
    ...suratMasukList.map((sm) => ({ ...sm, itemType: 'masuk' as const })),
    ...suratKeluarList.map((sk) => ({ ...sk, itemType: 'keluar' as const }))
  ].sort((a, b) => {
    const dateA = a.itemType === 'masuk' ? a.tglTerima || a.tglSurat : a.tglKirim || a.tglSurat;
    const dateB = b.itemType === 'masuk' ? b.tglTerima || b.tglSurat : b.tglKirim || b.tglSurat;
    return dateB.localeCompare(dateA);
  });

  const displayedSuratList = unifiedSuratList.filter((item) => {
    if (suratSubFilter === 'masuk') return item.itemType === 'masuk';
    if (suratSubFilter === 'keluar') return item.itemType === 'keluar';
    return true;
  });

  const countTRIN = telegramList.filter((t) => t.tipe === 'TR-IN').length;
  const countTROUT = telegramList.filter((t) => t.tipe === 'TR-OUT').length;

  const displayedTelegramList = telegramList.filter((tr) => {
    if (telegramSubFilter === 'TR-IN') return tr.tipe === 'TR-IN';
    if (telegramSubFilter === 'TR-OUT') return tr.tipe === 'TR-OUT';
    return true;
  });

  // Dynamic real metrics computed from active real data arrays
  const countSM = suratMasukList.length;
  const countSK = suratKeluarList.length;
  const countTR = telegramList.length;

  const countSelesai = suratMasukList.filter(s => s.statusDisposisi === 'Selesai / Terarsip').length;
  const countKoordinasi = suratMasukList.filter(s => s.statusDisposisi === 'Proses Koordinasi Paban IV').length;
  const countKoreksi = suratMasukList.filter(s => s.statusDisposisi === 'Perlu Koreksi / Kekurangan Lampiran' || s.statusDisposisi === 'Draf OCR').length;

  const countRenbut = [...suratMasukList, ...suratKeluarList].filter(s => s.kategoriUrusan === 'renbut').length;
  const countPerbaikan = [...suratMasukList, ...suratKeluarList].filter(s => s.kategoriUrusan === 'perbaikan').length;
  const countLegal = [...suratMasukList, ...suratKeluarList].filter(s => s.kategoriUrusan === 'legal_utilitas').length;
  const countLaporan = [...suratMasukList, ...suratKeluarList].filter(s => s.kategoriUrusan === 'laporan').length;

  const totalSuratUrusan = (countRenbut + countPerbaikan + countLegal + countLaporan) || 1;
  const pctRenbut = Math.round((countRenbut / totalSuratUrusan) * 100);
  const pctPerbaikan = Math.round((countPerbaikan / totalSuratUrusan) * 100);
  const pctLegal = Math.round((countLegal / totalSuratUrusan) * 100);
  const pctLaporan = Math.round((countLaporan / totalSuratUrusan) * 100);

  const pctSelesai = countSM > 0 ? Math.round((countSelesai / countSM) * 100) : 100;
  const pctKoordinasi = countSM > 0 ? Math.round((countKoordinasi / countSM) * 100) : 0;
  const pctKoreksi = countSM > 0 ? Math.round((countKoreksi / countSM) * 100) : 0;

  // Dynamic Real Trend Data Extraction from Real Records
  const realDateMap = new Map<string, { sm: number; sk: number; tr: number; total: number }>();

  suratMasukList.forEach((sm) => {
    const d = sm.tglTerima || sm.tglSurat || '';
    if (d) {
      const entry = realDateMap.get(d) || { sm: 0, sk: 0, tr: 0, total: 0 };
      entry.sm += 1;
      entry.total += 1;
      realDateMap.set(d, entry);
    }
  });

  suratKeluarList.forEach((sk) => {
    const d = sk.tglKirim || sk.tglSurat || '';
    if (d) {
      const entry = realDateMap.get(d) || { sm: 0, sk: 0, tr: 0, total: 0 };
      entry.sk += 1;
      entry.total += 1;
      realDateMap.set(d, entry);
    }
  });

  telegramList.forEach((tr) => {
    const d = tr.tglWaktu ? tr.tglWaktu.slice(0, 10) : '';
    if (d) {
      const entry = realDateMap.get(d) || { sm: 0, sk: 0, tr: 0, total: 0 };
      entry.tr += 1;
      entry.total += 1;
      realDateMap.set(d, entry);
    }
  });

  const sortedTrendDates = Array.from(realDateMap.keys()).sort();
  const activeTrendDates = sortedTrendDates.length > 7 ? sortedTrendDates.slice(-7) : sortedTrendDates;

  const trendData = activeTrendDates.map((dateStr) => {
    const val = realDateMap.get(dateStr)!;
    let label = dateStr;
    try {
      const p = new Date(dateStr);
      if (!isNaN(p.getTime())) {
        label = p.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      }
    } catch (e) {}

    return {
      date: dateStr,
      label,
      sm: val.sm,
      sk: val.sk,
      tr: val.tr,
      total: val.total
    };
  });

  const maxDayTotal = Math.max(...trendData.map((d) => d.total), 1);
  const peakDay = trendData.length > 0
    ? [...trendData].sort((a, b) => b.total - a.total)[0]
    : null;

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner Alert / Command Strip */}
      <div className="bg-[#0f1e36] text-white rounded-2xl p-5 shadow-lg border border-[#1e3a5f] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              SISTEM AKTIF • KOMANDO LOGISTIK TNI
            </span>
            <span className="text-xs text-[#adc8f5] font-mono">Paban IV Konstruksi</span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white">
            Pusat Komando Pencatatan Agenda Berkas Masuk &amp; Keluar
          </h1>
          <p className="text-xs sm:text-sm text-[#adc8f5] max-w-2xl leading-relaxed">
            Otomatisasi pengolahan naskah kedinasan dengan pemindaian OCR cerdas, standarisasi lembar disposisi 4 pejabat (19 klausul resmi), serta validasi 11 data pendukung wajib.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenOcr()}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all transform hover:scale-105 active:scale-95 border border-emerald-400/30 cursor-pointer"
            title="Pindai dokumen fisik dengan OCR Vision cerdas"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Input OCR Cerdas</span>
          </button>

          <button
            onClick={() => setIsAddSMOpen(true)}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#284a75] text-white font-bold text-xs transition-all transform hover:scale-105 active:scale-95 border border-white/10 cursor-pointer"
            title="Tambah Berkas Surat Masuk Manual"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Surat Masuk</span>
          </button>

          <button
            onClick={() => setIsAddSKOpen(true)}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#284a75] text-white font-bold text-xs transition-all transform hover:scale-105 active:scale-95 border border-white/10 cursor-pointer"
            title="Tambah Registrasi Surat Keluar"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Surat Keluar</span>
          </button>

          <button
            onClick={() => setIsAddTROpen(true)}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#284a75] text-white font-bold text-xs transition-all transform hover:scale-105 active:scale-95 border border-white/10 cursor-pointer"
            title="Tambah Warta Telegram Baru"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Telegram</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS STRIP - 100% REAL PRODUCTION DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Volume */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#0f1e36]"></div>
          <div className="flex items-center justify-between text-[#44474d] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Volume Berkas</span>
            <FileText className="w-4 h-4 text-[#455f87]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold text-[#131b2e] tracking-tight">
                {totalVolume}
              </span>
              <span className="text-xs text-[#455f87] font-semibold">Naskah</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-700 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Data Riil Aktif</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-[#75777e] flex justify-between">
            <span>SM: {countSM} • SK: {countSK}</span>
            <span className="text-emerald-700 font-bold">TR: {countTR}</span>
          </div>
        </div>

        {/* Card 2: Surat Masuk */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#455f87]"></div>
          <div className="flex items-center justify-between text-[#44474d] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Berkas Masuk (Inbound)</span>
            <Inbox className="w-4 h-4 text-[#455f87]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold text-[#131b2e] tracking-tight">
                {countSM}
              </span>
              <span className="text-xs text-[#75777e]">Surat</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#455f87]">
              <span className="px-1.5 py-0.2 rounded bg-[#f2f3ff] text-[#0f1e36] font-mono text-[10px] font-bold">
                SM: {countSM}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-[#b5d0fd]/40 text-[#0f1e36] font-mono text-[10px] font-bold">
                TR-IN: {countTRIN}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-[#75777e] flex justify-between">
            <span>Rasio Masuk: {totalVolume > 0 ? Math.round(((countSM + countTRIN) / totalVolume) * 100) : 0}%</span>
            <span className="text-[#455f87] font-semibold">Prioritas</span>
          </div>
        </div>

        {/* Card 3: Surat Keluar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#000412]"></div>
          <div className="flex items-center justify-between text-[#44474d] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Berkas Keluar (Outbound)</span>
            <Send className="w-4 h-4 text-[#0f1e36]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold text-[#131b2e] tracking-tight">
                {countSK}
              </span>
              <span className="text-xs text-[#75777e]">Surat</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#455f87]">
              <span className="px-1.5 py-0.2 rounded bg-[#f2f3ff] text-[#0f1e36] font-mono text-[10px] font-bold">
                SK: {countSK}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-[#dae2fd] text-[#0f1e36] font-mono text-[10px] font-bold">
                TR-OUT: {countTROUT}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-[#75777e] flex justify-between">
            <span>Rasio Keluar: {totalVolume > 0 ? Math.round(((countSK + countTROUT) / totalVolume) * 100) : 0}%</span>
            <span className="text-emerald-700 font-semibold">TTE Sah</span>
          </div>
        </div>

        {/* Card 4: Kepatuhan 11 Lampiran */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between text-[#44474d] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Kepatuhan 11 Lampiran</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold text-[#131b2e] tracking-tight">
                {pctSelesai}%
              </span>
              <span className="text-xs text-emerald-700 font-bold">Terpenuhi</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-red-700">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span className="font-semibold">{countKoreksi} Berkas</span>
              <span className="text-[#44474d]">Perlu Kelengkapan</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-[#75777e] flex justify-between">
            <span>Standar Minlog</span>
            <span className="text-emerald-700 font-semibold">Audit Terpadu</span>
          </div>
        </div>

        {/* Card 5: Status Disposisi */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between text-[#44474d] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Disposisi Selesai</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold text-[#131b2e] tracking-tight">
                {countSelesai}
              </span>
              <span className="text-xs text-[#75777e]">/ {countSM} Berkas</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-700 font-medium">
              <span>{countKoordinasi} Dalam Proses Paban IV</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-[#75777e] flex justify-between">
            <span>Kecepatan Optimal</span>
            <span className="text-[#0f1e36] font-bold">{countSM > 0 ? 'Aktif' : 'Siap'}</span>
          </div>
        </div>
      </div>

      {/* ANALYTICAL VISUALIZATION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart: Volume Trend */}
        <div className="lg:col-span-8 bg-white rounded-xl p-5 shadow-sm border border-[#dae2fd] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-heading font-bold text-base text-[#131b2e]">
                Tren Komparatif Volume Masuk vs Keluar
              </h2>
              <p className="text-xs text-[#44474d]">
                Agregasi Periode {trendGranularity.toUpperCase()} (Februari 2025) beserta Warta Telegram
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Granularity mode */}
              <div className="inline-flex p-0.5 rounded-lg bg-[#f2f3ff] border border-[#dae2fd]">
                {(['harian', 'mingguan', 'bulanan'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTrendGranularity(m)}
                    type="button"
                    className={`px-3 py-1 rounded text-xs capitalize transition-colors ${
                      trendGranularity === m
                        ? 'bg-[#0f1e36] text-white font-bold shadow-xs'
                        : 'text-[#44474d] hover:text-[#131b2e]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="hidden sm:flex items-center gap-2.5 text-xs text-[#44474d]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0f1e36]"></span> Masuk
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#455f87]"></span> Keluar
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#b5d0fd]"></span> Telegram
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic SVG Tactical Bar Graph Based on Real Data */}
          {trendData.length === 0 ? (
            <div className="w-full h-64 bg-[#f2f3ff]/40 rounded-xl p-4 flex flex-col items-center justify-center border border-[#e2e7ff] text-center">
              <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-[#dae2fd] flex items-center justify-center text-[#455f87] mb-2">
                <BarChart3 className="w-6 h-6 text-[#0f1e36]" />
              </div>
              <span className="font-heading font-bold text-sm text-[#131b2e]">
                Belum Ada Data Naskah Real untuk Digrafikkan
              </span>
              <p className="text-xs text-[#44474d] max-w-md mt-1 mb-3">
                Grafik tren volume harian akan terpetakan otomatis begitu naskah Surat Masuk, Surat Keluar, atau Warta Telegram ditambahkan.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setIsAddSMOpen(true)}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  + Input Surat Masuk
                </button>
                <button
                  onClick={() => setIsAddSKOpen(true)}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#0f1e36] text-xs font-semibold border border-[#dae2fd] cursor-pointer"
                >
                  + Surat Keluar
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-64 bg-[#f2f3ff]/40 rounded-xl p-3 flex items-end justify-center border border-[#e2e7ff] overflow-x-auto">
              <svg className="w-full h-full min-w-[500px]" viewBox="0 0 700 220" preserveAspectRatio="none">
                <line x1="0" y1="40" x2="700" y2="40" stroke="#dae2fd" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="95" x2="700" y2="95" stroke="#dae2fd" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="150" x2="700" y2="150" stroke="#dae2fd" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="195" x2="700" y2="195" stroke="#c5c6ce" strokeWidth="1.5" />

                {trendData.map((d, idx) => {
                  const slotWidth = 700 / trendData.length;
                  const centerX = (idx + 0.5) * slotWidth;
                  const barWidth = Math.min(22, slotWidth / 4);

                  const hSM = Math.max(d.sm > 0 ? 4 : 0, Math.round((d.sm / maxDayTotal) * 140));
                  const hSK = Math.max(d.sk > 0 ? 4 : 0, Math.round((d.sk / maxDayTotal) * 140));
                  const hTR = Math.max(d.tr > 0 ? 4 : 0, Math.round((d.tr / maxDayTotal) * 140));

                  const xSM = centerX - barWidth * 1.5;
                  const xSK = centerX - barWidth * 0.5;
                  const xTR = centerX + barWidth * 0.5;

                  const ySM = 195 - hSM;
                  const ySK = 195 - hSK;
                  const yTR = 195 - hTR;
                  const topY = Math.min(ySM, ySK, yTR) - 6;

                  return (
                    <g key={d.date} className="hover:opacity-80 transition-opacity cursor-pointer">
                      <rect x={xSM} y={ySM} width={barWidth} height={hSM} rx="3" fill="#0f1e36" />
                      <rect x={xSK} y={ySK} width={barWidth} height={hSK} rx="3" fill="#455f87" />
                      <rect x={xTR} y={yTR} width={barWidth} height={hTR} rx="3" fill="#adc8f5" />
                      <text x={centerX} y="212" textAnchor="middle" fill="#44474d" fontSize="10" fontFamily="Inter" fontWeight="bold">
                        {d.label}
                      </text>
                      <text x={centerX} y={Math.max(20, topY)} textAnchor="middle" fill="#0f1e36" fontSize="10" fontWeight="bold" fontFamily="Inter">
                        {d.total}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 text-xs text-[#44474d]">
            <span>
              {peakDay
                ? `Puncak aktivitas real: ${peakDay.label} (${peakDay.total} naskah diproses).`
                : 'Sistem siap mencatat naskah operasional real.'}
            </span>
            <button
              onClick={() => onNavigate('rekapitulasi')}
              type="button"
              className="font-bold text-[#0f1e36] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Monitor Rekapitulasi Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Side Cluster: Distribusi Urusan & Alur Disposisi */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Distribusi Jenis Urusan */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd]">
            <h3 className="font-heading font-bold text-sm text-[#131b2e] mb-3">
              Distribusi Jenis Urusan Logistik
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#131b2e]">Pengajuan Renbut / Faslat</span>
                  <span className="text-[#44474d] font-mono">{pctRenbut}% ({countRenbut} Berkas)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#f2f3ff] overflow-hidden">
                  <div className="h-full bg-[#0f1e36] rounded-full transition-all duration-300" style={{ width: `${pctRenbut}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#131b2e]">Pemeliharaan &amp; Perbaikan</span>
                  <span className="text-[#44474d] font-mono">{pctPerbaikan}% ({countPerbaikan} Berkas)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#f2f3ff] overflow-hidden">
                  <div className="h-full bg-[#455f87] rounded-full transition-all duration-300" style={{ width: `${pctPerbaikan}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#131b2e]">Legalisasi Daya / Listrik / Air</span>
                  <span className="text-[#44474d] font-mono">{pctLegal}% ({countLegal} Berkas)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#f2f3ff] overflow-hidden">
                  <div className="h-full bg-[#adc8f5] rounded-full transition-all duration-300" style={{ width: `${pctLegal}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#131b2e]">Laporan Berkala &amp; Evaluasi</span>
                  <span className="text-[#44474d] font-mono">{pctLaporan}% ({countLaporan} Berkas)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#f2f3ff] overflow-hidden">
                  <div className="h-full bg-[#dae2fd] rounded-full transition-all duration-300" style={{ width: `${pctLaporan}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Alur Disposisi */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd]">
            <h3 className="font-heading font-bold text-sm text-[#131b2e] mb-3">
              Status Alur Disposisi
            </h3>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[#f2f3ff] flex items-center justify-between border border-[#dae2fd]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span className="text-xs font-semibold text-[#131b2e]">Selesai / Terarsip</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#131b2e]">{pctSelesai}%</span>
                  <span className="text-[10px] text-[#44474d] block font-mono">{countSelesai} Berkas</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#f2f3ff] flex items-center justify-between border border-[#dae2fd]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-xs font-semibold text-[#131b2e]">Koordinasi Paban IV</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#131b2e]">{pctKoordinasi}%</span>
                  <span className="text-[10px] text-[#44474d] block font-mono">{countKoordinasi} Berkas</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-red-50 flex items-center justify-between border border-red-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span className="text-xs font-semibold text-red-900">Perlu Koreksi Lampiran</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-red-700">{pctKoreksi}%</span>
                  <span className="text-[10px] text-red-700 block font-mono">{countKoreksi} Berkas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT AGENDA ENTRIES TABLE & DIRECT CRUD WORKBENCH */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dae2fd] overflow-hidden">
        {/* Table Header with Tabs & Add Buttons */}
        <div className="p-4 bg-[#f2f3ff] border-b border-[#dae2fd] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#44474d] mr-1 hidden sm:inline">
              Agenda Naskah:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-white border border-[#dae2fd] shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTableTab('agenda-surat')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 transform cursor-pointer ${
                  activeTableTab === 'agenda-surat'
                    ? 'bg-[#0f1e36] text-white scale-105 shadow-sm'
                    : 'text-[#44474d] hover:text-[#0f1e36] hover:bg-slate-50'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <span className="hidden sm:inline">Agenda Surat (Masuk &amp; Keluar)</span>
                  <span className="sm:hidden">Surat</span> ({totalSurat})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTableTab('telegram')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 transform cursor-pointer ${
                  activeTableTab === 'telegram'
                    ? 'bg-[#0f1e36] text-white scale-105 shadow-sm'
                    : 'text-[#44474d] hover:text-[#0f1e36] hover:bg-slate-50'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <span className="hidden sm:inline">Warta Telegram</span>
                  <span className="sm:hidden">Telegram</span> ({telegramList.length})
                </span>
              </button>
            </div>
          </div>

          {/* Contextual Action Buttons */}
          <div className="flex items-center gap-2">
            {activeTableTab === 'agenda-surat' && (
              <>
                <button
                  onClick={() => setIsAddSMOpen(true)}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
                  title="Tambah Berkas Surat Masuk"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Surat Masuk</span>
                </button>
                <button
                  onClick={() => setIsAddSKOpen(true)}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
                  title="Tambah Registrasi Surat Keluar"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Surat Keluar</span>
                </button>
                <button
                  onClick={() => onNavigate('agenda-surat')}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#0f1e36] text-xs font-bold border border-[#dae2fd] transition-colors cursor-pointer"
                >
                  Buka Agenda Surat Lengkap
                </button>
              </>
            )}

            {activeTableTab === 'telegram' && (
              <>
                <button
                  onClick={() => setIsAddTROpen(true)}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Telegram</span>
                </button>
                <button
                  onClick={() => onNavigate('telegram')}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#0f1e36] text-xs font-bold border border-[#dae2fd] transition-colors cursor-pointer"
                >
                  Buka Agenda TR Lengkap
                </button>
              </>
            )}
          </div>
        </div>

        {/* SUB-FILTER STRIP FOR THE SELECTED AGENDA TYPE */}
        <div className="px-4 py-2 bg-[#f8f9ff] border-b border-[#dae2fd] flex items-center justify-between text-xs">
          {activeTableTab === 'agenda-surat' ? (
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-[#7886a3] mr-1 uppercase">Filter Cepat:</span>
              <button
                type="button"
                onClick={() => setSuratSubFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  suratSubFilter === 'all'
                    ? 'bg-[#0f1e36] text-white shadow-xs'
                    : 'text-[#44474d] hover:bg-[#e2e7ff]'
                }`}
              >
                Semua Surat ({totalSurat})
              </button>
              <button
                type="button"
                onClick={() => setSuratSubFilter('masuk')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  suratSubFilter === 'masuk'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-[#44474d] hover:bg-emerald-50'
                }`}
              >
                Surat Masuk ({suratMasukList.length})
              </button>
              <button
                type="button"
                onClick={() => setSuratSubFilter('keluar')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  suratSubFilter === 'keluar'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-[#44474d] hover:bg-blue-50'
                }`}
              >
                Surat Keluar ({suratKeluarList.length})
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-[#7886a3] mr-1 uppercase">Filter Cepat:</span>
              <button
                type="button"
                onClick={() => setTelegramSubFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  telegramSubFilter === 'all'
                    ? 'bg-[#0f1e36] text-white shadow-xs'
                    : 'text-[#44474d] hover:bg-[#e2e7ff]'
                }`}
              >
                Semua Telegram ({telegramList.length})
              </button>
              <button
                type="button"
                onClick={() => setTelegramSubFilter('TR-IN')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  telegramSubFilter === 'TR-IN'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-[#44474d] hover:bg-emerald-50'
                }`}
              >
                TR Masuk ({countTRIN})
              </button>
              <button
                type="button"
                onClick={() => setTelegramSubFilter('TR-OUT')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  telegramSubFilter === 'TR-OUT'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-[#44474d] hover:bg-blue-50'
                }`}
              >
                TR Keluar ({countTROUT})
              </button>
            </div>
          )}

          <span className="text-[11px] text-[#7886a3] hidden sm:inline font-mono">
            Tampilkan 7 naskah terbaru
          </span>
        </div>

        {/* TAB 1: UNIFIED AGENDA SURAT TABLE (MASUK & KELUAR) */}
        {activeTableTab === 'agenda-surat' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f2f3ff] text-[#44474d] font-bold uppercase tracking-wider text-[11px] border-b border-[#dae2fd]">
                  <th className="py-2.5 px-3 w-28">Tipe</th>
                  <th className="py-2.5 px-3 w-36">No. Agenda</th>
                  <th className="py-2.5 px-3">No. Surat &amp; Tanggal</th>
                  <th className="py-2.5 px-3">Instansi (Asal / Tujuan)</th>
                  <th className="py-2.5 px-4">Perihal &amp; Ringkasan</th>
                  <th className="py-2.5 px-3 text-center w-24">Klasifikasi</th>
                  <th className="py-2.5 px-3 text-center w-36">Status Disposisi / TTE</th>
                  <th className="py-2.5 px-4 text-right w-40">Aksi Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dae2fd]">
                {displayedSuratList.slice(0, 7).map((item) => {
                  const isMasuk = item.itemType === 'masuk';
                  return (
                    <tr key={`${item.itemType}-${item.id}`} className="hover:bg-[#f2f3ff]/60 transition-colors">
                      {/* Tipe Badge */}
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

                      {/* No Agenda */}
                      <td className="py-3 px-3 font-mono font-bold text-[#0f1e36]">
                        <div>{item.noAgenda}</div>
                        <span className="text-[10px] text-[#75777e] font-normal block">
                          {isMasuk ? `Terima: ${item.tglTerima}` : `Kirim: ${item.tglKirim}`}
                        </span>
                      </td>

                      {/* No Surat & Tanggal */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 block truncate max-w-[200px]" title={item.noSurat}>
                          {item.noSurat}
                        </span>
                        <span className="text-[10px] text-[#75777e] block">
                          Tgl: {item.tglSurat}
                        </span>
                      </td>

                      {/* Instansi */}
                      <td className="py-3 px-3 font-semibold text-[#131b2e] truncate max-w-[180px]">
                        <div>{isMasuk ? item.asalSurat : item.tujuanSurat}</div>
                        <span className="text-[9px] font-mono text-[#7886a3] uppercase">
                          {isMasuk ? 'Pengirim' : 'Tujuan'}
                        </span>
                      </td>

                      {/* Perihal */}
                      <td className="py-3 px-4 text-[#131b2e] font-medium leading-snug max-w-sm">
                        <p className="line-clamp-1 font-bold">{item.perihal}</p>
                        {item.ringkasan && (
                          <p className="line-clamp-1 text-[11px] text-[#7886a3] italic mt-0.5">
                            {item.ringkasan}
                          </p>
                        )}
                      </td>

                      {/* Klasifikasi */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                            item.klasifikasi.toLowerCase().includes('kilat') || item.klasifikasi.toLowerCase().includes('rahasia')
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : item.klasifikasi.toLowerCase().includes('penting')
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {item.klasifikasi}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isMasuk ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-block ${
                              item.statusDisposisi.includes('Selesai')
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.statusDisposisi.includes('Koreksi')
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {item.statusDisposisi}
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-block ${
                              item.statusTTE.includes('Sah')
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.statusTTE.includes('Diparaf')
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {item.statusTTE}
                          </span>
                        )}
                      </td>

                      {/* Aksi Kelola Langsung */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* DETAIL PREVIEW / OCR */}
                          <button
                            onClick={() => {
                              if (isMasuk) {
                                onOpenOcr(item);
                              } else {
                                setPreviewSK(item);
                              }
                            }}
                            type="button"
                            className="p-1.5 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#0f1e36] transition-colors cursor-pointer"
                            title={isMasuk ? "Buka Lembar Disposisi & OCR" : "Pratinjau Surat Keluar"}
                          >
                            {isMasuk ? (
                              <Printer className="w-3.5 h-3.5 text-[#455f87]" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-[#455f87]" />
                            )}
                          </button>

                          {/* UBAH / EDIT */}
                          <button
                            onClick={() => {
                              if (isMasuk) {
                                setEditingSM(item);
                              } else {
                                setEditingSK(item);
                              }
                            }}
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300 transition-colors cursor-pointer"
                            title="Ubah Berkas"
                          >
                            <Pencil className="w-3 h-3 text-amber-700" />
                            <span>Ubah</span>
                          </button>

                          {/* HAPUS */}
                          <button
                            onClick={() => {
                              const label = isMasuk ? 'Surat Masuk' : 'Surat Keluar';
                              if (confirm(`Hapus berkas ${label} nomor ${item.noSurat}?`)) {
                                if (isMasuk && onDeleteSuratMasuk) {
                                  onDeleteSuratMasuk(item.id);
                                } else if (!isMasuk && onDeleteSuratKeluar) {
                                  onDeleteSuratKeluar(item.id);
                                }
                              }
                            }}
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayedSuratList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#75777e]">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-[#131b2e]">Belum Ada Catatan Naskah Dinas Riil</p>
                      <p className="mt-1">Gunakan tombol &quot;+ Surat Masuk&quot; atau &quot;+ Surat Keluar&quot; di atas untuk mencatat surat nyata pertama Anda.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: WARTA TELEGRAM TABLE */}
        {activeTableTab === 'telegram' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f2f3ff] text-[#44474d] font-bold uppercase tracking-wider text-[11px] border-b border-[#dae2fd]">
                  <th className="py-2.5 px-4 w-28">Tipe</th>
                  <th className="py-2.5 px-3">No. Telegram &amp; Waktu</th>
                  <th className="py-2.5 px-3">Dari / Kepada</th>
                  <th className="py-2.5 px-4">Perihal &amp; Isi Sandi</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Aksi Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dae2fd]">
                {displayedTelegramList.slice(0, 7).map((tr) => (
                  <tr key={tr.id} className="hover:bg-[#f2f3ff]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        tr.tipe === 'TR-IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tr.tipe}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 block truncate max-w-[180px]">
                        {tr.noTelegram}
                      </span>
                      <span className="text-[10px] text-[#75777e] block">
                        {tr.tglWaktu}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#131b2e] text-[11px]">
                      <div><span className="text-slate-400">DARI:</span> {tr.dari}</div>
                      <div><span className="text-slate-400">KPD:</span> {tr.kepada}</div>
                    </td>
                    <td className="py-3 px-4 text-[#131b2e] font-medium leading-snug max-w-sm">
                      <p className="line-clamp-1 font-bold">{tr.perihal}</p>
                      <p className="line-clamp-1 font-mono text-[10px] text-slate-500 mt-0.5">{tr.isiBerita}</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 inline-block">
                        {tr.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTRToRead(tr)}
                          type="button"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#0f1e36] text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Baca Salinan Telegram"
                        >
                          <Eye className="w-3 h-3 text-[#455f87]" />
                          <span>Baca</span>
                        </button>

                        <button
                          onClick={() => setEditingTR(tr)}
                          type="button"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300 transition-colors cursor-pointer"
                          title="Ubah / Edit Warta Telegram"
                        >
                          <Pencil className="w-3 h-3 text-amber-700" />
                          <span>Ubah</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Hapus warta telegram ${tr.noTelegram}?`)) {
                              if (onDeleteTelegram) {
                                onDeleteTelegram(tr.id);
                              }
                            }
                          }}
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus Telegram"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayedTelegramList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#75777e]">
                      <Radio className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-[#131b2e]">Belum Ada Catatan Warta Telegram</p>
                      <p className="mt-1">Gunakan tombol &quot;+ Telegram&quot; di atas untuk mencatat warta telegram dinas nyata.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK PREVIEW MODAL FOR SURAT KELUAR */}
      {previewSK && (
        <div className="fixed inset-0 z-50 bg-[#000412]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-[#dae2fd] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-[#0f1e36] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                <h3 className="font-heading font-bold text-sm text-white">Pratinjau Naskah Surat Keluar</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSK(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#f8f9ff] rounded-xl border border-[#dae2fd]">
                <div>
                  <span className="text-[#7886a3] font-mono block">No. Agenda SK:</span>
                  <span className="font-bold font-mono text-[#0f1e36] text-sm">{previewSK.noAgenda}</span>
                </div>
                <div>
                  <span className="text-[#7886a3] font-mono block">Tanggal Kirim:</span>
                  <span className="font-semibold text-[#131b2e]">{previewSK.tglKirim}</span>
                </div>
                <div>
                  <span className="text-[#7886a3] font-mono block">No. Surat Keluar:</span>
                  <span className="font-bold text-[#131b2e]">{previewSK.noSurat}</span>
                </div>
                <div>
                  <span className="text-[#7886a3] font-mono block">Tanggal Surat:</span>
                  <span className="font-semibold text-[#131b2e]">{previewSK.tglSurat}</span>
                </div>
              </div>

              <div>
                <span className="text-[#7886a3] font-mono block mb-1">Tujuan Pengiriman:</span>
                <p className="p-2.5 rounded-lg bg-[#f2f3ff] text-[#131b2e] font-bold border border-[#dae2fd]">
                  {previewSK.tujuanSurat}
                </p>
              </div>

              <div>
                <span className="text-[#7886a3] font-mono block mb-1">Perihal:</span>
                <p className="p-2.5 rounded-lg bg-[#f2f3ff] text-[#131b2e] font-semibold border border-[#dae2fd]">
                  {previewSK.perihal}
                </p>
              </div>

              {previewSK.ringkasan && (
                <div>
                  <span className="text-[#7886a3] font-mono block mb-1">Ringkasan Berkas:</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 text-[#44474d] border border-slate-200 leading-relaxed">
                    {previewSK.ringkasan}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-[#f8f9ff] border border-[#dae2fd]">
                  <span className="text-[#7886a3] block">Klasifikasi:</span>
                  <span className="font-bold text-rose-700">{previewSK.klasifikasi}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#f8f9ff] border border-[#dae2fd]">
                  <span className="text-[#7886a3] block">Status TTE:</span>
                  <span className="font-bold text-blue-700">{previewSK.statusTTE}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#f8f9ff] border border-[#dae2fd]">
                  <span className="text-[#7886a3] block">Lampiran:</span>
                  <span className="font-bold text-[#0f1e36]">{previewSK.lampiranJumlah}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#f2f3ff] border-t border-[#dae2fd] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingSK(previewSK);
                  setPreviewSK(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
              >
                Ubah Berkas Ini
              </button>
              <button
                type="button"
                onClick={() => setPreviewSK(null)}
                className="px-3 py-1.5 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SURAT MASUK EDIT / ADD MODAL */}
      <SuratMasukEditModal
        isOpen={isAddSMOpen || !!editingSM}
        onClose={() => {
          setIsAddSMOpen(false);
          setEditingSM(null);
        }}
        initialData={editingSM}
        totalExisting={suratMasukList.length}
        onSave={(savedSurat) => {
          if (onSaveSuratMasuk) {
            onSaveSuratMasuk(savedSurat);
          }
          setIsAddSMOpen(false);
          setEditingSM(null);
        }}
      />

      {/* MODAL 2: SURAT KELUAR EDIT / ADD MODAL */}
      <SuratKeluarModal
        isOpen={isAddSKOpen || !!editingSK}
        onClose={() => {
          setIsAddSKOpen(false);
          setEditingSK(null);
        }}
        initialData={editingSK}
        totalExisting={suratKeluarList.length}
        onSave={(savedSK) => {
          if (onSaveSuratKeluar) {
            onSaveSuratKeluar(savedSK);
          }
          setIsAddSKOpen(false);
          setEditingSK(null);
        }}
      />

      {/* MODAL 3: TELEGRAM EDIT / ADD MODAL */}
      <TelegramModal
        isOpen={isAddTROpen || !!editingTR}
        onClose={() => {
          setIsAddTROpen(false);
          setEditingTR(null);
        }}
        initialData={editingTR}
        totalExisting={telegramList.length}
        onSave={(savedTR) => {
          if (onSaveTelegram) {
            onSaveTelegram(savedTR);
          }
          setIsAddTROpen(false);
          setEditingTR(null);
        }}
      />

      {/* MODAL 4: READ TELEGRAM MILITARY VIEW */}
      {selectedTRToRead && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-300 overflow-hidden font-mono text-xs">
            <div className="p-4 bg-[#0f1e36] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="font-bold uppercase tracking-wider text-sm">
                  SALINAN WARTA TELEGRAM ({selectedTRToRead.tipe})
                </span>
              </div>
              <button
                onClick={() => setSelectedTRToRead(null)}
                type="button"
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-amber-50/15 border-b border-slate-200">
              <div className="border-2 border-black divide-y-2 divide-black p-0.5">
                <div className="grid grid-cols-12 divide-x-2 divide-black p-2 bg-slate-50">
                  <div className="col-span-6">
                    <span className="text-[10px] text-slate-500 block uppercase">Nomor Telegram:</span>
                    <span className="font-bold text-sm text-slate-900">{selectedTRToRead.noTelegram}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-[10px] text-slate-500 block uppercase">Derajat:</span>
                    <span className="font-bold text-red-700">{selectedTRToRead.klasifikasi}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-[10px] text-slate-500 block uppercase">Keamanan:</span>
                    <span className="font-bold text-red-700">{selectedTRToRead.derajatKeamanan}</span>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <div><span className="text-slate-500">DARI:</span> <strong>{selectedTRToRead.dari}</strong></div>
                  <div><span className="text-slate-500">KEPADA:</span> <strong>{selectedTRToRead.kepada}</strong></div>
                  <div><span className="text-slate-500">TEMBUSAN:</span> <strong>{selectedTRToRead.tembusan}</strong></div>
                  <div><span className="text-slate-500">WAKTU:</span> <strong>{selectedTRToRead.tglWaktu} WIB</strong></div>
                </div>

                <div className="p-2 bg-slate-50">
                  <span className="text-slate-500 uppercase block text-[10px]">Perihal:</span>
                  <span className="font-bold text-slate-900">{selectedTRToRead.perihal}</span>
                </div>

                <div className="p-3 bg-white space-y-2">
                  <span className="text-slate-500 uppercase block text-[10px]">Isi Berita Sandi:</span>
                  <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                    {selectedTRToRead.isiBerita}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Sistem Registrasi Warta Sandi Militer Paban IV Konst</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tr = selectedTRToRead;
                    setSelectedTRToRead(null);
                    setEditingTR(tr);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-sans text-xs font-bold flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Ubah Telegram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTRToRead(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#0f1e36] text-white font-sans text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
