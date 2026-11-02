/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  Plus, 
  Printer, 
  Download, 
  Eye, 
  X, 
  Save, 
  Trash2,
  ShieldAlert,
  Pencil,
  FileSpreadsheet
} from 'lucide-react';
import { WartaTelegram } from '../types';
import { TelegramModal } from './TelegramModal';

interface TelegramViewProps {
  telegramList: WartaTelegram[];
  onAddTelegram: (telegram: WartaTelegram) => void;
  onSaveTelegram?: (telegram: WartaTelegram) => void;
  onDeleteTelegram: (id: string) => void;
  onSyncSheets?: () => void;
}

export const TelegramView: React.FC<TelegramViewProps> = ({
  telegramList,
  onAddTelegram,
  onSaveTelegram,
  onDeleteTelegram,
  onSyncSheets
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'TR-IN' | 'TR-OUT'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTelegram, setSelectedTelegram] = useState<WartaTelegram | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTR, setEditingTR] = useState<WartaTelegram | null>(null);

  // New Telegram Form State
  const [tipe, setTipe] = useState<'TR-IN' | 'TR-OUT'>('TR-IN');
  const [noTelegram, setNoTelegram] = useState<string>(`TR/${telegramList.length + 42}/2025`);
  const [dari, setDari] = useState<string>('ASLOG PANGLIMA TNI');
  const [kepada, setKepada] = useState<string>('PABAN IV/KONST SLOG TNI');
  const [tembusan, setTembusan] = useState<string>('ASLOG KASAD, IRJEN TNI');
  const [klasifikasi, setKlasifikasi] = useState<WartaTelegram['klasifikasi']>('KILAT');
  const [derajatKeamanan, setDerajatKeamanan] = useState<WartaTelegram['derajatKeamanan']>('RAHASIA');
  const [perihal, setPerihal] = useState<string>('');
  const [isiBerita, setIsiBerita] = useState<string>('AAA ... TTK BBB ... TTK HBS');

  const filteredList = telegramList.filter((tr) => {
    const matchTab = activeTab === 'all' || tr.tipe === activeTab;
    const matchQuery =
      tr.noTelegram.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tr.dari.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tr.kepada.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tr.perihal.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchQuery;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noTelegram || !perihal || !isiBerita) {
      alert('Harap lengkapi semua field warta telegram!');
      return;
    }

    const newTR: WartaTelegram = {
      id: `tr-${Date.now()}`,
      tipe,
      noTelegram,
      tglWaktu: new Date().toISOString().replace('T', ' ').slice(0, 16),
      dari,
      kepada,
      tembusan,
      klasifikasi,
      derajatKeamanan,
      perihal,
      isiBerita,
      status: tipe === 'TR-IN' ? 'Diterima' : 'Terkirim & Arsip',
      tglDibuat: new Date().toISOString()
    };

    onAddTelegram(newTR);
    setIsModalOpen(false);
    setPerihal('');
    alert('Warta Telegram Berhasil Ditambahkan!');
  };

  return (
    <div className="space-y-5 pb-12 select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0f1e36] text-white flex items-center justify-center">
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="font-heading text-xl font-bold text-[#131b2e] tracking-tight">
              Buku Agenda Warta Telegram Kedinasan
            </h1>
          </div>
          <p className="text-xs text-[#44474d] mt-1">
            Pengelolaan warta telegram dinas (TR-IN &amp; TR-OUT) jalur sandi dan kawat militer Paban IV Konst.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSyncSheets && (
            <button
              onClick={onSyncSheets}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Sinkronkan data warta telegram ke Google Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Sinkron Google Sheets</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#0f1e36] text-xs font-semibold border border-[#dae2fd] shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#455f87]" />
            <span>Cetak Agenda</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Buat Warta Telegram</span>
          </button>
        </div>
      </div>

      {/* FILTER & TABS */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center p-1 rounded-lg bg-[#f2f3ff] border border-[#dae2fd]">
          {(['all', 'TR-IN', 'TR-OUT'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-[#0f1e36] text-white shadow-xs'
                  : 'text-[#44474d] hover:text-[#131b2e]'
              }`}
            >
              {tab === 'all' ? 'Semua Telegram' : tab === 'TR-IN' ? 'Telegram Masuk (TR-IN)' : 'Telegram Keluar (TR-OUT)'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no telegram, dari, kepada..."
            className="w-full px-3 py-1.5 pl-9 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs outline-none focus:bg-white text-[#131b2e]"
          />
          <Search className="w-4 h-4 text-[#75777e] absolute left-3 top-2" />
        </div>
      </div>

      {/* LIST TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dae2fd] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-body-sm">
            <thead>
              <tr className="bg-[#f2f3ff] text-[#44474d] font-bold uppercase tracking-wider text-[11px] border-b border-[#dae2fd]">
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-3">No. Telegram</th>
                <th className="py-3 px-3">Tgl &amp; Waktu</th>
                <th className="py-3 px-3">Dari / Kepada</th>
                <th className="py-3 px-4">Perihal Warta</th>
                <th className="py-3 px-3 text-center">Derajat</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dae2fd]">
              {filteredList.map((tr) => (
                <tr key={tr.id} className="hover:bg-[#f2f3ff]/70 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        tr.tipe === 'TR-IN'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      {tr.tipe}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#0f1e36]">
                    {tr.noTelegram}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-[#44474d]">
                    {tr.tglWaktu}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-[#131b2e] block truncate max-w-[180px]">
                      DARI: {tr.dari}
                    </span>
                    <span className="text-[10px] text-[#75777e] block truncate max-w-[180px]">
                      KPD: {tr.kepada}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#131b2e] font-medium leading-snug max-w-sm">
                    <p className="line-clamp-1">{tr.perihal}</p>
                    <p className="font-mono text-[10px] text-[#75777e] line-clamp-1 mt-0.5">{tr.isiBerita}</p>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                      {tr.klasifikasi} / {tr.derajatKeamanan}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {tr.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedTelegram(tr)}
                        type="button"
                        className="px-2.5 py-1 rounded bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#0f1e36] text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Baca</span>
                      </button>

                      {/* TOMBOL UBAH / EDIT */}
                      <button
                        onClick={() => setEditingTR(tr)}
                        type="button"
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] transition-colors"
                        title="Ubah / Edit Warta Telegram"
                      >
                        <Pencil className="w-3 h-3 text-amber-700" />
                        <span>Ubah</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus warta telegram ${tr.noTelegram}?`)) {
                            onDeleteTelegram(tr.id);
                          }
                        }}
                        type="button"
                        className="p-1 text-slate-400 hover:text-red-700"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* READ TELEGRAM MODAL (MILITARY FORMAT) */}
      {selectedTelegram && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-300 overflow-hidden font-mono text-xs">
            {/* Kop telegram */}
            <div className="p-4 bg-[#0f1e36] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="font-bold uppercase tracking-wider text-sm">
                  SALINAN WARTA TELEGRAM ({selectedTelegram.tipe})
                </span>
              </div>
              <button
                onClick={() => setSelectedTelegram(null)}
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
                    <span className="font-bold text-sm text-slate-900">{selectedTelegram.noTelegram}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-[10px] text-slate-500 block uppercase">Derajat:</span>
                    <span className="font-bold text-red-700">{selectedTelegram.klasifikasi}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-[10px] text-slate-500 block uppercase">Keamanan:</span>
                    <span className="font-bold text-red-700">{selectedTelegram.derajatKeamanan}</span>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <p><strong>DARI:</strong> {selectedTelegram.dari}</p>
                  <p><strong>KEPADA:</strong> {selectedTelegram.kepada}</p>
                  <p><strong>TEMBUSAN:</strong> {selectedTelegram.tembusan}</p>
                </div>

                <div className="p-2">
                  <p className="font-bold text-slate-800">PERIHAL: {selectedTelegram.perihal}</p>
                </div>

                <div className="p-4 bg-white font-mono text-xs leading-relaxed space-y-2 whitespace-pre-wrap">
                  {selectedTelegram.isiBerita}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 flex items-center justify-between font-sans">
              <span className="text-[11px] text-slate-500 font-mono">
                Terverifikasi Sentral Komunikasi Slog TNI
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tr = selectedTelegram;
                    setSelectedTelegram(null);
                    setEditingTR(tr);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Ubah Warta</span>
                </button>
                <button
                  onClick={() => window.print()}
                  type="button"
                  className="px-4 py-2 rounded-lg bg-[#0f1e36] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cetak Lembar Warta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TELEGRAM ADD / EDIT MODAL */}
      <TelegramModal
        isOpen={isModalOpen || !!editingTR}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTR(null);
        }}
        initialData={editingTR}
        totalExisting={telegramList.length}
        onSave={(savedTR) => {
          if (onSaveTelegram) {
            onSaveTelegram(savedTR);
          } else {
            onAddTelegram(savedTR);
          }
          setIsModalOpen(false);
          setEditingTR(null);
        }}
      />
    </div>
  );
};
