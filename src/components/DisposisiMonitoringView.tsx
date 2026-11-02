/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileCheck2, 
  Search, 
  Filter, 
  Printer, 
  Microscope, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  UserCheck,
  QrCode
} from 'lucide-react';
import { SuratMasuk } from '../types';

interface DisposisiMonitoringViewProps {
  suratMasukList: SuratMasuk[];
  onOpenOcr: (surat: SuratMasuk, mode?: 'ocr' | 'print' | 'split') => void;
  onOpenForensic: (surat: SuratMasuk) => void;
}

export const DisposisiMonitoringView: React.FC<DisposisiMonitoringViewProps> = ({
  suratMasukList,
  onOpenOcr,
  onOpenForensic
}) => {
  const [activeOfficerFilter, setActiveOfficerFilter] = useState<'all' | 'panglima' | 'aslog' | 'waaslog' | 'paban'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredList = suratMasukList.filter((s) => {
    const matchQuery =
      s.noAgenda.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.noSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.perihal.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeOfficerFilter === 'all') return matchQuery;
    if (activeOfficerFilter === 'waaslog') return matchQuery && s.disposisi.waaslog.checkedClauses.length > 0;
    if (activeOfficerFilter === 'aslog') return matchQuery && s.disposisi.aslog.checkedClauses.length > 0;
    if (activeOfficerFilter === 'panglima') return matchQuery && s.disposisi.panglima.checkedClauses.length > 0;
    if (activeOfficerFilter === 'paban') return matchQuery && s.disposisi.paban.checkedClauses.length > 0;
    return matchQuery;
  });

  const panglimaCount = suratMasukList.filter(s => s.disposisi?.panglima?.diparaf).length;
  const aslogCount = suratMasukList.filter(s => s.disposisi?.aslog?.diparaf).length;
  const waaslogPerluCek = suratMasukList.filter(s => s.disposisi?.waaslog?.perluVerifikasi).length;
  const waaslogCount = suratMasukList.filter(s => s.disposisi?.waaslog?.diparaf).length;
  const pabanCount = suratMasukList.filter(s => s.disposisi?.paban?.diparaf).length;

  return (
    <div className="space-y-5 pb-12 select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0f1e36] text-white flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="font-heading text-xl font-bold text-[#131b2e] tracking-tight">
              Tindak Lanjut &amp; Disposisi 4 Pejabat Kedinasan
            </h1>
          </div>
          <p className="text-xs text-[#44474d] mt-1">
            Monitoring berjenjang disposisi resmi: Panglima Komando, Aslog, Waaslog, dan Paban IV Konstruksi sesuai 19 istilah tata naskah TNI.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#0f1e36] text-xs font-semibold border border-[#dae2fd] shadow-xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-[#455f87]" />
          <span>Cetak Rekap Disposisi</span>
        </button>
      </div>

      {/* OFFICER PIPELINE TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <button
          onClick={() => setActiveOfficerFilter('all')}
          type="button"
          className={`col-span-2 sm:col-span-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeOfficerFilter === 'all'
              ? 'bg-[#0f1e36] text-white border-[#0f1e36] shadow-sm'
              : 'bg-white text-[#131b2e] border-[#dae2fd] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">Semua Hirarki</span>
          <span className="font-heading font-bold text-lg block mt-0.5">{suratMasukList.length} Berkas</span>
          <span className="text-[10px] opacity-75">Terkontrol Sentral</span>
        </button>

        <button
          onClick={() => setActiveOfficerFilter('panglima')}
          type="button"
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeOfficerFilter === 'panglima'
              ? 'bg-[#0f1e36] text-white border-[#0f1e36] shadow-sm'
              : 'bg-white text-[#131b2e] border-[#dae2fd] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block text-emerald-600">I. Panglima</span>
          <span className="font-heading font-bold text-lg block mt-0.5">{panglimaCount} Paraf</span>
          <span className="text-[10px] text-[#44474d]">{suratMasukList.length > 0 ? `${Math.round((panglimaCount / suratMasukList.length) * 100)}% Lengkap` : 'Siap Input'}</span>
        </button>

        <button
          onClick={() => setActiveOfficerFilter('aslog')}
          type="button"
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeOfficerFilter === 'aslog'
              ? 'bg-[#0f1e36] text-white border-[#0f1e36] shadow-sm'
              : 'bg-white text-[#131b2e] border-[#dae2fd] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block text-blue-600">II. Aslog</span>
          <span className="font-heading font-bold text-lg block mt-0.5">{aslogCount} Paraf</span>
          <span className="text-[10px] text-[#44474d]">{suratMasukList.length > 0 ? `${Math.round((aslogCount / suratMasukList.length) * 100)}% Lengkap` : 'Siap Input'}</span>
        </button>

        <button
          onClick={() => setActiveOfficerFilter('waaslog')}
          type="button"
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeOfficerFilter === 'waaslog'
              ? 'bg-[#0f1e36] text-white border-[#0f1e36] shadow-sm'
              : waaslogPerluCek > 0
              ? 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
              : 'bg-white text-[#131b2e] border-[#dae2fd] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block text-amber-800">III. Waaslog</span>
          <span className="font-heading font-bold text-lg block mt-0.5">{waaslogPerluCek > 0 ? `${waaslogPerluCek} Perlu Cek` : `${waaslogCount} Paraf`}</span>
          <span className="text-[10px] text-amber-800 font-semibold">{waaslogPerluCek > 0 ? 'Verifikasi Forensik' : 'Terverifikasi'}</span>
        </button>

        <button
          onClick={() => setActiveOfficerFilter('paban')}
          type="button"
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeOfficerFilter === 'paban'
              ? 'bg-[#0f1e36] text-white border-[#0f1e36] shadow-sm'
              : 'bg-white text-[#131b2e] border-[#dae2fd] hover:bg-[#f2f3ff]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block text-slate-600">IV. Paban IV</span>
          <span className="font-heading font-bold text-lg block mt-0.5">{pabanCount} Disposisi</span>
          <span className="text-[10px] text-[#44474d]">Aksi / Arahan</span>
        </button>
      </div>

      {/* DISPOSITION CARDS GRID */}
      <div className="grid grid-cols-1 gap-4">
        {filteredList.length === 0 && (
          <div className="p-12 text-center rounded-xl bg-white border border-[#dae2fd] text-xs text-[#75777e]">
            <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-[#131b2e] text-sm">Belum Ada Naskah Disposisi Riil</p>
            <p className="mt-1">Surat masuk yang dicatat melalui OCR atau Buku Agenda akan muncul di sini untuk penelusuran disposisi.</p>
          </div>
        )}
        {filteredList.map((surat) => (
          <div
            key={surat.id}
            className="bg-white rounded-xl shadow-sm border border-[#dae2fd] p-5 space-y-4 hover:border-[#b5d0fd] transition-all"
          >
            {/* Top Row: Meta info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-[#dae2fd]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-[#0f1e36] text-white">
                  {surat.noAgenda}
                </span>
                <span className="font-mono font-bold text-sm text-[#131b2e]">
                  {surat.noSurat}
                </span>
                <span className="text-xs text-[#75777e]">
                  ({surat.tglSurat} • Asal: <strong>{surat.asalSurat}</strong>)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">
                  {surat.klasifikasi}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {surat.statusDisposisi}
                </span>
              </div>
            </div>

            {/* Perihal */}
            <div>
              <h3 className="font-heading font-bold text-sm text-[#131b2e] leading-snug">
                {surat.perihal}
              </h3>
              <p className="text-xs text-[#44474d] mt-1 leading-relaxed">
                {surat.ringkasan}
              </p>
            </div>

            {/* 4 OFFICERS DISPOSITION CHAIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
              {/* Panglima */}
              <div className="p-3 rounded-lg bg-[#f2f3ff] border border-[#dae2fd] space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-bold text-[#131b2e]">
                    <span>1. Panglima Komando</span>
                    <span className="text-[10px] text-emerald-700 font-mono">Diparaf ✓</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {surat.disposisi.panglima.checkedClauses.map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-[#0f1e36] text-white text-[10px] font-bold">
                        [v] {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-blue-950 italic mt-1.5 leading-snug">
                    "{surat.disposisi.panglima.catatan}"
                  </p>
                </div>
                <span className="text-[9px] text-[#75777e] font-mono mt-1 pt-1 border-t border-slate-200">
                  Validasi: {surat.disposisi.panglima.tglParaf || '28 Feb 2025'}
                </span>
              </div>

              {/* Aslog */}
              <div className="p-3 rounded-lg bg-[#f2f3ff] border border-[#dae2fd] space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-bold text-[#131b2e]">
                    <span>2. Aslog</span>
                    <span className="text-[10px] text-emerald-700 font-mono">Diparaf ✓</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {surat.disposisi.aslog.checkedClauses.map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-[#0f1e36] text-white text-[10px] font-bold">
                        [v] {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-blue-950 italic mt-1.5 leading-snug">
                    "{surat.disposisi.aslog.catatan}"
                  </p>
                </div>
                <span className="text-[9px] text-[#75777e] font-mono mt-1 pt-1 border-t border-slate-200">
                  Validasi: {surat.disposisi.aslog.tglParaf || '28 Feb 2025'}
                </span>
              </div>

              {/* Waaslog */}
              <div className={`p-3 rounded-lg border space-y-1.5 flex flex-col justify-between ${
                surat.disposisi.waaslog.perluVerifikasi
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-[#f2f3ff] border-[#dae2fd]'
              }`}>
                <div>
                  <div className="flex items-center justify-between font-bold text-[#131b2e]">
                    <span>3. Waaslog</span>
                    {surat.disposisi.waaslog.perluVerifikasi ? (
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-200 px-1.5 py-0.2 rounded">
                        Perlu Verif!
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-mono">Diparaf ✓</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {surat.disposisi.waaslog.checkedClauses.map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-[#0f1e36] text-white text-[10px] font-bold">
                        [v] {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-blue-950 italic mt-1.5 leading-snug">
                    "{surat.disposisi.waaslog.catatan}"
                  </p>
                </div>

                {surat.disposisi.waaslog.perluVerifikasi ? (
                  <button
                    onClick={() => onOpenForensic(surat)}
                    type="button"
                    className="w-full mt-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Microscope className="w-3 h-3" />
                    <span>Buka Lensa Forensik</span>
                  </button>
                ) : (
                  <span className="text-[9px] text-[#75777e] font-mono mt-1 pt-1 border-t border-slate-200">
                    Validasi: {surat.disposisi.waaslog.tglParaf || '28 Feb 2025'}
                  </span>
                )}
              </div>

              {/* Paban IV */}
              <div className="p-3 rounded-lg bg-[#f2f3ff] border border-[#dae2fd] space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-bold text-[#131b2e]">
                    <span>4. Paban IV / Minlog</span>
                    <span className="text-[10px] text-emerald-700 font-mono">Diparaf ✓</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {surat.disposisi.paban.checkedClauses.map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-[#0f1e36] text-white text-[10px] font-bold">
                        [v] {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-blue-950 italic mt-1.5 leading-snug">
                    "{surat.disposisi.paban.catatan}"
                  </p>
                </div>
                <span className="text-[9px] text-[#75777e] font-mono mt-1 pt-1 border-t border-slate-200">
                  Validasi: {surat.disposisi.paban.tglParaf || '28 Feb 2025'}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
              <span className="text-xs text-[#75777e]">
                {surat.lampiranList?.filter((l) => l.terlampir).length || 8} dari 11 Data Pendukung Terverifikasi
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenOcr(surat, 'print')}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Cetak Lembar Disposisi Fisik A4 Lengkap dengan Kode QR Pelacakan Digital"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cetak Disposisi (+QR)</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
