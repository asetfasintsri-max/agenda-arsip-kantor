/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Send, 
  Search, 
  Plus, 
  Printer, 
  Download, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  X, 
  Save, 
  Trash2,
  FileCheck2,
  Pencil
} from 'lucide-react';
import { KategoriUrusan, KlasifikasiKeamanan, SuratKeluar } from '../types';
import { SuratKeluarModal } from './SuratKeluarModal';

interface SuratKeluarViewProps {
  suratKeluarList: SuratKeluar[];
  onAddSuratKeluar: (surat: SuratKeluar) => void;
  onSaveSuratKeluar?: (surat: SuratKeluar) => void;
  onDeleteSuratKeluar: (id: string) => void;
}

export const SuratKeluarView: React.FC<SuratKeluarViewProps> = ({
  suratKeluarList,
  onAddSuratKeluar,
  onSaveSuratKeluar,
  onDeleteSuratKeluar
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState<string>('all');
  const [filterTTE, setFilterTTE] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSK, setEditingSK] = useState<SuratKeluar | null>(null);

  // New Outbound Form State
  const [noAgenda, setNoAgenda] = useState<string>(`AG-SK/2025/000${suratKeluarList.length + 90}`);
  const [noSurat, setNoSurat] = useState<string>(`B/${suratKeluarList.length + 895}/II/2025/KONST`);
  const [tglSurat, setTglSurat] = useState<string>(new Date().toISOString().slice(0, 10));
  const [tglKirim, setTglKirim] = useState<string>(new Date().toISOString().slice(0, 10));
  const [tujuanSurat, setTujuanSurat] = useState<string>('');
  const [perihal, setPerihal] = useState<string>('');
  const [ringkasan, setRingkasan] = useState<string>('');
  const [klasifikasi, setKlasifikasi] = useState<KlasifikasiKeamanan>('Biasa');
  const [kategoriUrusan, setKategoriUrusan] = useState<KategoriUrusan>('renbut');
  const [konseptor, setKonseptor] = useState<string>('Kolonel Kav. Hartono (Kaur Reg. Minlog)');
  const [statusTTE, setStatusTTE] = useState<SuratKeluar['statusTTE']>('Diparaf Waaslog');
  const [lampiranJumlah, setLampiranJumlah] = useState<string>('1 Lembar');

  const filteredList = suratKeluarList.filter((s) => {
    const matchQuery =
      s.noAgenda.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.noSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tujuanSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.perihal.toLowerCase().includes(searchQuery.toLowerCase());

    const matchKlasifikasi =
      filterKlasifikasi === 'all' || s.klasifikasi.toLowerCase().includes(filterKlasifikasi.toLowerCase());

    const matchTTE =
      filterTTE === 'all' || s.statusTTE.toLowerCase().includes(filterTTE.toLowerCase());

    return matchQuery && matchKlasifikasi && matchTTE;
  });

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noSurat || !tujuanSurat || !perihal) {
      alert('Harap isi No Surat, Tujuan, dan Perihal!');
      return;
    }

    const newSK: SuratKeluar = {
      id: `sk-${Date.now()}`,
      noAgenda,
      noSurat,
      tglSurat,
      tglKirim,
      tujuanSurat,
      perihal,
      ringkasan,
      klasifikasi,
      kategoriUrusan,
      konseptor,
      statusTTE,
      lampiranJumlah,
      tglDibuat: new Date().toISOString()
    };

    onAddSuratKeluar(newSK);
    setIsModalOpen(false);
    // Reset form
    setTujuanSurat('');
    setPerihal('');
    setRingkasan('');
    alert('Agenda Surat Keluar Berhasil Diregistrasi ke SIMONAS_DB!');
  };

  const exportCsv = () => {
    const headers = ['No Agenda', 'No Surat', 'Tgl Surat', 'Tujuan', 'Perihal', 'Konseptor', 'Status TTE'];
    const rows = filteredList.map((s) => [
      `"${s.noAgenda}"`,
      `"${s.noSurat}"`,
      `"${s.tglSurat}"`,
      `"${s.tujuanSurat.replace(/"/g, '""')}"`,
      `"${s.perihal.replace(/"/g, '""')}"`,
      `"${s.konseptor}"`,
      `"${s.statusTTE}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agenda_surat_keluar_${new Date().toISOString().slice(0, 10)}.csv`);
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
              <Send className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="font-heading text-xl font-bold text-[#131b2e] tracking-tight">
              Buku Agenda Surat Keluar Kedinasan
            </h1>
          </div>
          <p className="text-xs text-[#44474d] mt-1">
            Penomoran, registrasi konseptor, dan pelacakan otentikasi Tanda Tangan Elektronik (TTE) naskah dinas keluar.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCsv}
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
            onClick={() => setIsModalOpen(true)}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Registrasi Surat Keluar</span>
          </button>
        </div>
      </div>

      {/* FILTER HUB */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd] space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no agenda, no surat, tujuan satker, perihal..."
              className="w-full px-3 py-2 pl-9 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs outline-none focus:bg-white text-[#131b2e]"
            />
            <Search className="w-4 h-4 text-[#75777e] absolute left-3 top-2.5" />
          </div>

          <div className="md:col-span-3">
            <select
              value={filterKlasifikasi}
              onChange={(e) => setFilterKlasifikasi(e.target.value)}
              className="w-full px-3 py-2 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs font-medium text-[#131b2e] outline-none"
            >
              <option value="all">Semua Klasifikasi</option>
              <option value="Biasa">Biasa</option>
              <option value="Rahasia">Rahasia</option>
              <option value="Kilat">Kilat</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={filterTTE}
              onChange={(e) => setFilterTTE(e.target.value)}
              className="w-full px-3 py-2 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs font-medium text-[#131b2e] outline-none"
            >
              <option value="all">Semua Status TTE</option>
              <option value="TTE Aslog Sah">TTE Aslog Sah</option>
              <option value="Diparaf Waaslog">Diparaf Waaslog</option>
              <option value="Menunggu Paraf">Menunggu Paraf</option>
              <option value="Terkirim">Terkirim &amp; Arsip</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dae2fd] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f2f3ff] text-[#44474d] font-bold uppercase tracking-wider text-[11px] border-b border-[#dae2fd]">
                <th className="py-3 px-4">No. Agenda SK</th>
                <th className="py-3 px-3">No. Surat &amp; Tgl</th>
                <th className="py-3 px-3">Tujuan Instansi / Satker</th>
                <th className="py-3 px-4">Perihal Surat Keluar</th>
                <th className="py-3 px-3">Konseptor</th>
                <th className="py-3 px-3 text-center">Status TTE</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dae2fd]">
              {filteredList.map((sk) => (
                <tr key={sk.id} className="hover:bg-[#f2f3ff]/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0f1e36]">
                    {sk.noAgenda}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-slate-900 block truncate max-w-[190px]">
                      {sk.noSurat}
                    </span>
                    <span className="text-[10px] text-[#75777e] block">
                      Tgl: {sk.tglSurat} • Kirim: {sk.tglKirim}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-[#131b2e] truncate max-w-[180px]">
                    {sk.tujuanSurat}
                  </td>
                  <td className="py-3.5 px-4 text-[#131b2e] leading-snug max-w-sm">
                    <p className="font-medium line-clamp-2">{sk.perihal}</p>
                    {sk.ringkasan && (
                      <p className="text-[10px] text-[#75777e] line-clamp-1 mt-0.5">{sk.ringkasan}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-[#44474d]">
                    <span className="block font-medium truncate max-w-[160px]">{sk.konseptor}</span>
                    <span className="text-[10px] text-[#75777e]">Lampiran: {sk.lampiranJumlah}</span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                        sk.statusTTE.includes('Sah')
                          ? 'bg-emerald-100 text-emerald-800'
                          : sk.statusTTE.includes('Diparaf')
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {sk.statusTTE}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => alert(`Rincian Surat Keluar:\nNomor: ${sk.noSurat}\nTujuan: ${sk.tujuanSurat}\nPerihal: ${sk.perihal}\nKonseptor: ${sk.konseptor}\nStatus: ${sk.statusTTE}`)}
                        type="button"
                        className="px-2.5 py-1 rounded bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#0f1e36] text-[11px] font-semibold"
                      >
                        Detail
                      </button>

                      {/* TOMBOL UBAH / EDIT */}
                      <button
                        onClick={() => setEditingSK(sk)}
                        type="button"
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] transition-colors"
                        title="Ubah / Edit Surat Keluar"
                      >
                        <Pencil className="w-3 h-3 text-amber-700" />
                        <span>Ubah</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus agenda surat keluar nomor ${sk.noSurat}?`)) {
                            onDeleteSuratKeluar(sk.id);
                          }
                        }}
                        type="button"
                        className="p-1 rounded text-slate-400 hover:text-red-700"
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

      {/* SURAT KELUAR ADD / EDIT MODAL */}
      <SuratKeluarModal
        isOpen={isModalOpen || !!editingSK}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSK(null);
        }}
        initialData={editingSK}
        totalExisting={suratKeluarList.length}
        onSave={(savedSK) => {
          if (onSaveSuratKeluar) {
            onSaveSuratKeluar(savedSK);
          } else {
            onAddSuratKeluar(savedSK);
          }
          setIsModalOpen(false);
          setEditingSK(null);
        }}
      />
    </div>
  );
};
