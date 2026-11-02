/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Inbox, 
  Search, 
  Filter, 
  Sparkles, 
  Printer, 
  Microscope, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  FileCheck2,
  ArrowLeft,
  Home,
  Pencil,
  QrCode
} from 'lucide-react';
import { SuratMasuk } from '../types';
import { SuratMasukEditModal } from './SuratMasukEditModal';

interface SuratMasukViewProps {
  suratMasukList: SuratMasuk[];
  onOpenOcr: (surat?: SuratMasuk, mode?: 'ocr' | 'print' | 'split') => void;
  onOpenForensic: (surat: SuratMasuk) => void;
  onSaveSurat?: (surat: SuratMasuk) => void;
  onDeleteSurat: (id: string) => void;
  onBack?: () => void;
  onHome?: () => void;
}

export const SuratMasukView: React.FC<SuratMasukViewProps> = ({
  suratMasukList,
  onOpenOcr,
  onOpenForensic,
  onSaveSurat,
  onDeleteSurat,
  onBack,
  onHome
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState<string>('all');
  const [filterUrusan, setFilterUrusan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modal states for Add and Edit
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingSurat, setEditingSurat] = useState<SuratMasuk | null>(null);

  const filteredList = suratMasukList.filter((s) => {
    const matchQuery =
      s.noAgenda.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.noSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.asalSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.perihal.toLowerCase().includes(searchQuery.toLowerCase());

    const matchKlasifikasi =
      filterKlasifikasi === 'all' || s.klasifikasi.toLowerCase().includes(filterKlasifikasi.toLowerCase());

    const matchUrusan =
      filterUrusan === 'all' || s.kategoriUrusan === filterUrusan;

    const matchStatus =
      filterStatus === 'all' || s.statusDisposisi.toLowerCase().includes(filterStatus.toLowerCase());

    return matchQuery && matchKlasifikasi && matchUrusan && matchStatus;
  });

  const exportCsv = () => {
    const headers = ['No Agenda', 'No Surat', 'Tgl Surat', 'Tgl Terima', 'Asal Surat', 'Perihal', 'Klasifikasi', 'Status Disposisi'];
    const rows = filteredList.map((s) => [
      `"${s.noAgenda}"`,
      `"${s.noSurat}"`,
      `"${s.tglSurat}"`,
      `"${s.tglTerima}"`,
      `"${s.asalSurat.replace(/"/g, '""')}"`,
      `"${s.perihal.replace(/"/g, '""')}"`,
      `"${s.klasifikasi}"`,
      `"${s.statusDisposisi}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agenda_surat_masuk_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-12 select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0f1e36] text-white flex items-center justify-center">
              <Inbox className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="font-heading text-xl font-bold text-[#131b2e] tracking-tight">
              Buku Agenda Surat Masuk Kedinasan
            </h1>
          </div>
          <p className="text-xs text-[#44474d] mt-1">
            Pencatatan dan pengarsipan surat masuk Paban IV Konstruksi Slog TNI dengan disposisi 4 pejabat dan 11 lampiran wajib.
          </p>
        </div>

        {/* Action Buttons with Back & Home */}
        <div className="flex flex-wrap items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#e2e7ff] text-[#0f1e36] text-xs font-semibold border border-[#dae2fd] shadow-xs cursor-pointer"
              title="Kembali ke Halaman Sebelumnya"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#455f87]" />
              <span>Kembali</span>
            </button>
          )}
          {onHome && (
            <button
              onClick={onHome}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#e2e7ff] text-[#0f1e36] text-xs font-semibold border border-[#dae2fd] shadow-xs cursor-pointer"
              title="Kembali ke Dashboard Utama"
            >
              <Home className="w-3.5 h-3.5 text-[#455f87]" />
              <span>Home</span>
            </button>
          )}
          <button
            onClick={() => exportCsv()}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#0f1e36] text-xs font-semibold border border-[#dae2fd] shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#455f87]" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#0f1e36] text-xs font-semibold border border-[#dae2fd] shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#455f87]" />
            <span>Cetak Agenda</span>
          </button>
          <button
            onClick={() => onOpenOcr()}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-bold shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Input OCR Cerdas</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Manual SM</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS HUB */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no agenda, no surat, asal pengirim, perihal..."
              className="w-full px-3 py-2 pl-9 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs outline-none focus:bg-white text-[#131b2e]"
            />
            <Search className="w-4 h-4 text-[#75777e] absolute left-3 top-2.5" />
          </div>

          {/* Klasifikasi Filter */}
          <div className="md:col-span-3">
            <select
              value={filterKlasifikasi}
              onChange={(e) => setFilterKlasifikasi(e.target.value)}
              className="w-full px-3 py-2 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs font-medium text-[#131b2e] outline-none"
            >
              <option value="all">Semua Klasifikasi</option>
              <option value="Kilat">⚡ KILAT / RAHASIA</option>
              <option value="Rahasia">RAHASIA</option>
              <option value="Biasa">BIASA</option>
            </select>
          </div>

          {/* Urusan Filter */}
          <div className="md:col-span-2">
            <select
              value={filterUrusan}
              onChange={(e) => setFilterUrusan(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs font-medium text-[#131b2e] outline-none"
            >
              <option value="all">Semua Urusan</option>
              <option value="renbut">Renbut / Faslat</option>
              <option value="perbaikan">Perbaikan Gedung</option>
              <option value="legal_utilitas">Listrik / Air</option>
              <option value="laporan">Laporan Evaluasi</option>
            </select>
          </div>

          {/* Status Disposisi Filter */}
          <div className="md:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs font-medium text-[#131b2e] outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="Selesai">Selesai / Terarsip</option>
              <option value="Koordinasi">Koordinasi Paban IV</option>
              <option value="Koreksi">Perlu Koreksi</option>
            </select>
          </div>
        </div>

        {/* Quick Statistics Strip */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#44474d] pt-1">
          <span>Menampilkan <strong>{filteredList.length}</strong> dari {suratMasukList.length} naskah masuk dinas.</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 94.2% Kepatuhan Lampiran
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Tervalidasi Minlog
            </span>
          </div>
        </div>
      </div>

      {/* REGISTRY DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dae2fd] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f2f3ff] text-[#44474d] font-bold uppercase tracking-wider text-[11px] border-b border-[#dae2fd]">
                <th className="py-3 px-4">No. Agenda</th>
                <th className="py-3 px-3">No. Surat &amp; Tanggal</th>
                <th className="py-3 px-3">Asal Pengirim</th>
                <th className="py-3 px-4">Perihal Naskah Dinas</th>
                <th className="py-3 px-3 text-center">Klasifikasi</th>
                <th className="py-3 px-3 text-center">11 Lampiran</th>
                <th className="py-3 px-3 text-center">Status Disposisi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dae2fd]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#75777e]">
                    <Inbox className="w-8 h-8 text-[#dae2fd] mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#131b2e]">Tidak ada naskah surat masuk yang sesuai filter.</p>
                    <p className="text-xs text-[#75777e] mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((surat) => {
                  const attachedCount = surat.lampiranList?.filter((l) => l.terlampir).length || 8;
                  const isWaaslogAmbigu = surat.disposisi.waaslog.perluVerifikasi;

                  return (
                    <tr key={surat.id} className="hover:bg-[#f2f3ff]/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0f1e36]">
                        {surat.noAgenda}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-slate-900 block truncate max-w-[200px]">
                          {surat.noSurat}
                        </span>
                        <span className="text-[10px] text-[#75777e] block">
                          Tgl: {surat.tglSurat} • Diterima: {surat.tglTerima}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#131b2e] truncate max-w-[180px]">
                        {surat.asalSurat}
                      </td>
                      <td className="py-3.5 px-4 text-[#131b2e] leading-snug max-w-sm">
                        <p className="font-medium line-clamp-2">{surat.perihal}</p>
                        <p className="text-[10px] text-[#75777e] line-clamp-1 mt-0.5">{surat.ringkasan}</p>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                            surat.klasifikasi.includes('Kilat') || surat.klasifikasi.includes('Rahasia')
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {surat.klasifikasi}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-flex items-center gap-1 ${
                            attachedCount >= 10
                              ? 'bg-emerald-100 text-emerald-800'
                              : attachedCount >= 7
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {attachedCount} / 11 Dok
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-block ${
                            surat.statusDisposisi.includes('Selesai')
                              ? 'bg-emerald-100 text-emerald-800'
                              : surat.statusDisposisi.includes('Koreksi')
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {surat.statusDisposisi}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenOcr(surat, 'print')}
                            type="button"
                            className="p-1.5 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#0f1e36] transition-colors"
                            title="Pratinjau Cetak Lembar Disposisi & QR Pelacakan"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#455f87]" />
                          </button>

                          {isWaaslogAmbigu && (
                            <button
                              onClick={() => onOpenForensic(surat)}
                              type="button"
                              className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors"
                              title="Lensa Forensik Tinta Basah"
                            >
                              <Microscope className="w-3.5 h-3.5 text-amber-800" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenOcr(surat)}
                            type="button"
                            className="px-2.5 py-1 rounded bg-[#0f1e36] hover:bg-[#000412] text-white font-semibold text-[11px] transition-colors"
                          >
                            Detail
                          </button>

                          {/* TOMBOL UBAH / EDIT */}
                          <button
                            onClick={() => setEditingSurat(surat)}
                            type="button"
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] transition-colors"
                            title="Ubah / Edit Agenda Surat Masuk"
                          >
                            <Pencil className="w-3 h-3 text-amber-700" />
                            <span>Ubah</span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Hapus agenda berkas surat nomor ${surat.noSurat}?`)) {
                                onDeleteSurat(surat.id);
                              }
                            }}
                            type="button"
                            className="p-1 rounded text-slate-400 hover:text-red-700 transition-colors"
                            title="Hapus Entri"
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
      </div>

      {/* SURAT MASUK EDIT / ADD MODAL */}
      <SuratMasukEditModal
        isOpen={isAddModalOpen || !!editingSurat}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSurat(null);
        }}
        initialData={editingSurat}
        totalExisting={suratMasukList.length}
        onSave={(saved) => {
          if (onSaveSurat) {
            onSaveSurat(saved);
          }
          setIsAddModalOpen(false);
          setEditingSurat(null);
        }}
      />
    </div>
  );
};
