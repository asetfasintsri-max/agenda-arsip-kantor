/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Microscope, 
  AlertCircle, 
  CheckCircle, 
  Search, 
  RotateCcw, 
  CloudCheck, 
  FileCheck2,
  ZoomIn,
  Eye,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Home
} from 'lucide-react';
import { KLAUSUL_RESMI_19, SuratMasuk } from '../types';

interface ForensicMagnifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  surat: SuratMasuk;
  onCommitCorrection: (updatedSurat: SuratMasuk) => void;
}

export const ForensicMagnifierModal: React.FC<ForensicMagnifierModalProps> = ({
  isOpen,
  onClose,
  surat,
  onCommitCorrection
}) => {
  if (!isOpen) return null;

  const [activeOfficer, setActiveOfficer] = useState<'panglima' | 'aslog' | 'waaslog' | 'paban'>('waaslog');
  const [filterMode, setFilterMode] = useState<'normal' | 'contrast' | 'mono'>('normal');
  const [zoomLevel, setZoomLevel] = useState<number>(250);
  const [clauseSearch, setClauseSearch] = useState<string>('');
  
  // Waaslog specific correction state
  const [selectedClauses, setSelectedClauses] = useState<string[]>(
    surat.disposisi.waaslog.checkedClauses.length > 0 
      ? surat.disposisi.waaslog.checkedClauses 
      : ['koordinasi']
  );
  const [notes, setNotes] = useState<string>(
    surat.disposisi.waaslog.catatan || 'Koordinasikan dengan Paban IV terkait kesiapan dermaga bongkar muat Lanud Manuhua Biak sebelum H-3.'
  );
  const [verifierStatus, setVerifierStatus] = useState<string>('confirmed');

  const toggleClause = (clause: string) => {
    setSelectedClauses((prev) =>
      prev.includes(clause) ? prev.filter((c) => c !== clause) : [...prev, clause]
    );
  };

  const handleReset = () => {
    setNotes('kord. dg Paban IV ttg alokasi munisi / rapim');
    setSelectedClauses(['koordinasi']);
    alert('Teks dikembalikan ke pembacaan mentah OCR untuk pemeriksaan ulang.');
  };

  const handleCommit = () => {
    const updated: SuratMasuk = {
      ...surat,
      disposisi: {
        ...surat.disposisi,
        waaslog: {
          checkedClauses: selectedClauses,
          catatan: notes,
          diparaf: true,
          tglParaf: '28 Feb 2025',
          akurasiOcr: 95,
          perluVerifikasi: false
        }
      },
      statusDisposisi: 'Selesai / Terarsip'
    };
    onCommitCorrection(updated);
    alert('Koreksi berhasil divalidasi! Data tersimpan di SIMONAS_DB dan status dokumen diperbarui.');
    onClose();
  };

  const filteredClauses = KLAUSUL_RESMI_19.filter((c) =>
    c.toLowerCase().includes(clauseSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#000412]/80 backdrop-blur-md flex flex-col justify-start items-center p-3 sm:p-5 select-none">
      <div className="w-full max-w-[1520px] bg-[#faf8ff] rounded-2xl shadow-2xl border border-[#dae2fd] overflow-hidden flex flex-col mb-4">
        {/* TOP CONTEXT BANNER */}
        <header className="w-full bg-[#0f1e36] text-white p-4 sm:p-5 flex flex-col gap-3 border-b border-[#1e3a5f]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* BACK & HOME BUTTONS */}
              <div className="flex items-center gap-1.5 mr-1">
                <button
                  onClick={onClose}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#e2e7ff] text-[#0f1e36] text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 border-2 border-[#b5d0fd] shadow-xs cursor-pointer"
                  title="Kembali ke Dokumen"
                >
                  <ArrowLeft className="w-4 h-4 text-[#0f1e36]" />
                  <span>Kembali</span>
                </button>
                <button
                  onClick={onClose}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#e2e7ff] text-[#0f1e36] text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 border-2 border-[#b5d0fd] shadow-xs cursor-pointer"
                  title="Ke Home Dashboard"
                >
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>Home</span>
                </button>
              </div>

              <div className="h-6 w-px bg-white/20 hidden sm:block"></div>

              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#455f87] to-[#0f1e36] text-white flex items-center justify-center border border-white/20 shadow-inner">
                <Microscope className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-base font-bold text-white tracking-tight">
                    Verifikasi &amp; Koreksi Hasil Ekstraksi Tulisan Tangan Disposisi
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b5d0fd]/20 text-[#b5d0fd] border border-[#b5d0fd]/30">
                    HUMAN-IN-THE-LOOP ACTIVE
                  </span>
                </div>
                <p className="text-xs text-[#adc8f5] mt-0.5">
                  Prosedur Standar SIMONAS: Mitigasi ambiguitas coretan pena basah sebelum komitmen data ke basis data terenkripsi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ba1a1a]/20 border border-[#ba1a1a]/40 text-red-200 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                <span className="font-bold uppercase tracking-wider text-[10px]">Perhatian Khusus</span>
                <span className="font-mono text-[11px]">Keyakinan OCR: 68.2% Ambigu (Waaslog)</span>
              </div>
              <button
                onClick={onClose}
                type="button"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* METADATA STRIP */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center pt-2 border-t border-[#1e3a5f]/60">
            <div className="lg:col-span-8 flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#1e3a5f]/40 px-3.5 py-2 rounded-lg text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-[#adc8f5]">No. Agenda:</span>
                <span className="font-mono font-bold text-white">{surat.noAgenda}</span>
              </div>
              <span className="text-[#455f87]">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-[#adc8f5]">No. Surat:</span>
                <span className="font-mono font-bold text-white">{surat.noSurat}</span>
              </div>
              <span className="text-[#455f87]">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-[#adc8f5]">Asal:</span>
                <span className="font-semibold text-white">{surat.asalSurat}</span>
              </div>
              <span className="text-[#455f87]">•</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ba1a1a] text-white">
                {surat.klasifikasi}
              </span>
            </div>

            <div className="lg:col-span-4 flex items-center gap-2 bg-[#1e3a5f]/40 px-3.5 py-2 rounded-lg text-xs text-[#adc8f5]">
              <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
              <p className="leading-tight text-[11px]">
                <strong>Panduan Staf:</strong> Bandingkan potongan resolusi tinggi dengan 19 klausul resmi satuan. Hindari spekulasi redaksi.
              </p>
            </div>
          </div>
        </header>

        {/* WORKBENCH BODY: SIDE-BY-SIDE SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-5">
          {/* LEFT PANEL: FORENSIC INK MAGNIFIER */}
          <section className="lg:col-span-5 bg-white shadow-sm rounded-xl p-4 border border-[#dae2fd] flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5">
                  <Microscope className="w-4 h-4 text-[#455f87]" />
                  <span className="font-heading font-bold text-sm text-[#131b2e]">Lensa Forensik Naskah</span>
                </div>
                <div className="flex items-center gap-1 bg-[#f2f3ff] p-1 rounded-lg border border-[#dae2fd]">
                  <button
                    onClick={() => setFilterMode('normal')}
                    type="button"
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      filterMode === 'normal'
                        ? 'bg-white shadow-xs font-bold text-[#0f1e36]'
                        : 'text-[#44474d] hover:text-[#131b2e]'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setFilterMode('contrast')}
                    type="button"
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      filterMode === 'contrast'
                        ? 'bg-white shadow-xs font-bold text-[#0f1e36]'
                        : 'text-[#44474d] hover:text-[#131b2e]'
                    }`}
                  >
                    High-Cont
                  </button>
                  <button
                    onClick={() => setFilterMode('mono')}
                    type="button"
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      filterMode === 'mono'
                        ? 'bg-white shadow-xs font-bold text-[#0f1e36]'
                        : 'text-[#44474d] hover:text-[#131b2e]'
                    }`}
                  >
                    Invert B/W
                  </button>
                </div>
              </div>

              {/* Viewport canvas */}
              <div className="relative w-full rounded-lg bg-[#e2e7ff] overflow-hidden shadow-inner p-2 border border-[#dae2fd]">
                <div className="flex items-center justify-between text-xs text-[#44474d] pb-1.5 font-mono">
                  <span>FOV: Sektor Disposisi III [Waaslog]</span>
                  <span className="bg-white px-2 py-0.5 rounded text-[#131b2e] font-bold border border-[#dae2fd]">
                    {zoomLevel}% Pembesaran
                  </span>
                </div>

                <div className="relative w-full h-64 rounded bg-white flex items-center justify-center overflow-hidden border border-slate-200">
                  <div
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      filter:
                        filterMode === 'contrast'
                          ? 'contrast(240%) brightness(95%)'
                          : filterMode === 'mono'
                          ? 'grayscale(100%) invert(85%) contrast(200%)'
                          : 'none',
                      transition: 'transform 0.2s, filter 0.2s'
                    }}
                    className="w-full h-full p-4 flex flex-col justify-center items-center relative select-none"
                  >
                    {/* Simulated High-Res Physical Paper & Wet Cursive SVG */}
                    <div className="relative w-full max-w-sm p-3 bg-amber-50/20 rounded border border-slate-200">
                      <div className="flex items-center justify-between pb-1 text-[10px] text-slate-500 font-mono">
                        <span className="uppercase">Kolom: WAASLOG (Coretan Basah)</span>
                        <span className="text-red-700 font-bold">Tumpang Tindih Paraf</span>
                      </div>

                      {/* SVG Cursive Pen Stroke Simulation */}
                      <svg className="w-full h-24 overflow-visible" viewBox="0 0 380 90">
                        <path
                          d="M 20 45 Q 35 20, 50 48 T 80 40 T 115 52 T 145 35 T 175 50"
                          fill="none"
                          stroke="#1d4ed8"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          opacity="0.95"
                        />
                        <path
                          d="M 185 45 Q 200 30, 220 50 T 255 42 T 280 48 T 320 38"
                          fill="none"
                          stroke="#1e40af"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          opacity="0.90"
                        />
                        <text
                          x="24"
                          y="44"
                          fill="#1e3a8a"
                          fontFamily="serif"
                          fontSize="21"
                          fontStyle="italic"
                          fontWeight="bold"
                          letterSpacing="1"
                        >
                          Koor. dg Paban IV
                        </text>
                        <text
                          x="205"
                          y="44"
                          fill="#1d4ed8"
                          fontFamily="serif"
                          fontSize="19"
                          fontStyle="italic"
                          fontWeight="bold"
                          letterSpacing="0.5"
                        >
                          ttg alokasi / rapim
                        </text>
                        <path
                          d="M 285 20 C 310 10, 340 30, 320 60 C 300 90, 270 70, 300 45 C 330 20, 360 55, 345 80"
                          fill="none"
                          stroke="#0f172a"
                          strokeWidth="2"
                          strokeLinecap="round"
                          opacity="0.85"
                        />
                        {/* Bounding box overlays */}
                        <rect x="18" y="22" width="168" height="34" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="4 2" />
                        <rect x="195" y="24" width="170" height="34" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="3 3" />
                      </svg>

                      <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                        <span className="text-amber-800 bg-amber-100 px-1.5 rounded">Zona 1: 'Koor...' (74%)</span>
                        <span className="text-red-800 bg-red-100 px-1.5 rounded">Zona 2: Ambiguitas Paraf</span>
                      </div>
                    </div>
                  </div>

                  {/* Optical Focus Reticle UI */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-[#455f87]/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#455f87]"></div>
                    </div>
                  </div>
                </div>

                {/* Zoom buttons */}
                <div className="flex items-center justify-between pt-2 text-xs text-[#44474d]">
                  <div className="flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-[#455f87]" />
                    {[100, 200, 250, 300].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setZoomLevel(lvl)}
                        type="button"
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                          zoomLevel === lvl
                            ? 'bg-[#0f1e36] text-white font-bold'
                            : 'bg-white hover:bg-[#e2e7ff] text-[#131b2e]'
                        }`}
                      >
                        {lvl}%
                      </button>
                    ))}
                  </div>
                  <span className="font-mono text-[10px]">Lens: 1200 DPI Matrix</span>
                </div>
              </div>

              {/* AI CONFIDENCE BREAKDOWN MATRIX */}
              <div className="bg-[#f2f3ff] rounded-lg p-3 flex flex-col gap-2 border border-[#dae2fd]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#44474d]">
                    Rincian Keyakinan OCR (Per Kata)
                  </span>
                  <span className="font-mono text-xs text-[#455f87] font-semibold">Engine: Vision-OCR v2.8</span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div className="p-2 rounded bg-white border border-[#dae2fd] flex flex-col text-center">
                    <span className="text-[10px] text-slate-500">Token 1</span>
                    <span className="text-xs font-bold text-slate-900 truncate">"Koor..."</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded mt-1 font-bold">
                      74% Prediksi
                    </span>
                  </div>
                  <div className="p-2 rounded bg-white border border-[#dae2fd] flex flex-col text-center">
                    <span className="text-[10px] text-slate-500">Token 2</span>
                    <span className="text-xs font-bold text-slate-900 truncate">"dg..."</span>
                    <span className="text-[10px] text-blue-800 bg-blue-100 px-1 py-0.2 rounded mt-1 font-bold">
                      82% Prediksi
                    </span>
                  </div>
                  <div className="p-2 rounded bg-white border border-[#dae2fd] flex flex-col text-center">
                    <span className="text-[10px] text-slate-500">Token 3</span>
                    <span className="text-xs font-bold text-slate-900 truncate">"Paban..."</span>
                    <span className="text-[10px] text-red-800 bg-red-100 px-1 py-0.2 rounded mt-1 font-bold">
                      61% Rendah
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-amber-900 leading-tight text-[11px]">
                    <strong>Catatan AI Engine:</strong> Coretan miring rapat disertai tarikan garis paraf pejabat yang memotong kata sandi disposisi sehingga memicu ambiguitas leksikal.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#dae2fd] flex items-center justify-between text-xs text-[#44474d] font-mono">
              <span>SHA-256: e8b9ca42...f4a18902</span>
              <span>Pemindai: Kodiklat-02</span>
            </div>
          </section>

          {/* RIGHT PANEL: HUMAN-IN-THE-LOOP CORRECTION WORKBENCH */}
          <section className="lg:col-span-7 bg-white shadow-sm rounded-xl p-4 sm:p-5 border border-[#dae2fd] flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              {/* Hierarchy selector tabs */}
              <div>
                <div className="flex items-center justify-between pb-2">
                  <span className="font-heading font-bold text-sm text-[#131b2e]">
                    Pusat Penetapan Pilihan Disposisi Resmi
                  </span>
                  <span className="text-xs text-[#44474d] font-mono">Format 19 Klausul Kodiklat TNI</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => setActiveOfficer('panglima')}
                    type="button"
                    className={`p-2.5 rounded-xl text-left transition-all duration-200 transform cursor-pointer border ${
                      activeOfficer === 'panglima'
                        ? 'bg-[#0f1e36] text-white border-[#0f1e36] scale-105 shadow-md ring-2 ring-[#0f1e36]/30 font-bold'
                        : 'bg-[#f2f3ff] text-[#131b2e] border-[#dae2fd] hover:bg-[#e2e7ff] hover:scale-102'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#adc8f5]">I. PANGLIMA</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold truncate block mt-0.5">96% Terverifikasi</span>
                  </button>

                  <button
                    onClick={() => setActiveOfficer('aslog')}
                    type="button"
                    className={`p-2.5 rounded-xl text-left transition-all duration-200 transform cursor-pointer border ${
                      activeOfficer === 'aslog'
                        ? 'bg-[#0f1e36] text-white border-[#0f1e36] scale-105 shadow-md ring-2 ring-[#0f1e36]/30 font-bold'
                        : 'bg-[#f2f3ff] text-[#131b2e] border-[#dae2fd] hover:bg-[#e2e7ff] hover:scale-102'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#adc8f5]">II. ASLOG</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold truncate block mt-0.5">94% Terverifikasi</span>
                  </button>

                  <button
                    onClick={() => setActiveOfficer('waaslog')}
                    type="button"
                    className={`p-2.5 rounded-xl text-left transition-all duration-200 transform cursor-pointer border ${
                      activeOfficer === 'waaslog'
                        ? 'bg-[#0f1e36] text-white border-[#0f1e36] scale-105 shadow-md ring-2 ring-[#0f1e36]/30 font-bold'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:scale-102'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#adc8f5]">III. WAASLOG</span>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-xs font-bold truncate block mt-0.5">Koreksi Manual</span>
                  </button>

                  <button
                    onClick={() => setActiveOfficer('paban')}
                    type="button"
                    className={`p-2.5 rounded-xl text-left transition-all duration-200 transform cursor-pointer border ${
                      activeOfficer === 'paban'
                        ? 'bg-[#0f1e36] text-white border-[#0f1e36] scale-105 shadow-md ring-2 ring-[#0f1e36]/30 font-bold'
                        : 'bg-[#f2f3ff] text-[#131b2e] border-[#dae2fd] hover:bg-[#e2e7ff] hover:scale-102'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#adc8f5]">IV. PABAN IV</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold truncate block mt-0.5">92% Terverifikasi</span>
                  </button>
                </div>
              </div>

              {/* ACTIVE WAASLOG CORRECTION WORKBENCH */}
              {activeOfficer === 'waaslog' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase font-bold text-amber-900">
                        Hasil Bacaan OCR Mentah (Perlu Dikonfirmasi):
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                        Skor: 68.2% Ambigu
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-800 bg-white p-2 rounded border border-amber-200">
                      "kord. dg Paban IV ttg alokasi munisi / rapim"
                    </p>
                  </div>

                  {/* 19 Klausul Grid */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-[#0f1e36]" />
                        <span className="text-xs font-bold text-[#131b2e]">
                          Pilih dari 19 Pilihan Disposisi Resmi Satuan:
                        </span>
                      </div>
                      <div className="relative w-48">
                        <input
                          type="text"
                          value={clauseSearch}
                          onChange={(e) => setClauseSearch(e.target.value)}
                          placeholder="Cari klausul..."
                          className="w-full px-2.5 py-1 text-xs bg-[#f2f3ff] rounded border border-[#dae2fd] outline-none pr-7"
                        />
                        <Search className="w-3.5 h-3.5 text-[#75777e] absolute right-2 top-1.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-[#f2f3ff] rounded-lg border border-[#dae2fd]">
                      {filteredClauses.map((clause) => {
                        const isChecked = selectedClauses.includes(clause);
                        return (
                          <label
                            key={clause}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-xs font-mono ${
                              isChecked
                                ? 'bg-[#0f1e36] text-white font-bold shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-[#131b2e]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleClause(clause)}
                              className="rounded text-[#0f1e36] focus:ring-0"
                            />
                            <span className="truncate">{clause}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Redaksi Catatan Staf */}
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-[#44474d] font-bold block mb-1">
                      Redaksi Catatan Tambahan Manual Hasil Verifikasi Staf:
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 rounded bg-[#f2f3ff] border border-[#dae2fd] text-xs text-[#131b2e] leading-relaxed outline-none focus:bg-white"
                    />
                  </div>

                  {/* Status Ketetapan Verifikator */}
                  <div className="p-2.5 rounded-lg bg-[#f2f3ff] border border-[#dae2fd] space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-[#44474d] font-bold block">
                      Status Ketetapan Verifikator:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2 rounded bg-white border border-[#dae2fd] cursor-pointer">
                        <input
                          type="radio"
                          name="status-verif"
                          checked={verifierStatus === 'confirmed'}
                          onChange={() => setVerifierStatus('confirmed')}
                          className="text-[#0f1e36] focus:ring-0"
                        />
                        <span className="font-semibold text-emerald-800">Telah Dikonfirmasi Fisik</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded bg-white border border-[#dae2fd] cursor-pointer">
                        <input
                          type="radio"
                          name="status-verif"
                          checked={verifierStatus === 'escalated'}
                          onChange={() => setVerifierStatus('escalated')}
                          className="text-[#0f1e36] focus:ring-0"
                        />
                        <span className="text-slate-700">Tidak Terbaca (Eskalasi)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded bg-white border border-[#dae2fd] cursor-pointer">
                        <input
                          type="radio"
                          name="status-verif"
                          checked={verifierStatus === 'corrected'}
                          onChange={() => setVerifierStatus('corrected')}
                          className="text-[#0f1e36] focus:ring-0"
                        />
                        <span className="text-blue-800 font-medium">Koreksi Redaksional</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* Information preview for Panglima, Aslog, or Paban IV */
                <div className="p-4 rounded-xl bg-[#f2f3ff] border border-[#dae2fd] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-[#131b2e]">
                      Disposisi {activeOfficer === 'panglima' ? 'Panglima Komando' : activeOfficer === 'aslog' ? 'Asisten Logistik (Aslog)' : 'Paban IV / Minlog'}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      Telah Terverifikasi Otomatis
                    </span>
                  </div>
                  <p className="text-xs text-[#44474d] leading-relaxed">
                    Tingkat akurasi pembacaan AI di atas 92%. Nilai klausul dan paraf basah telah dicocokkan dengan basis data naskah resmi Mabes TNI tanpa mendeteksi anomali leksikal.
                  </p>
                  <button
                    onClick={() => setActiveOfficer('waaslog')}
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-[#0f1e36] text-white text-xs font-semibold"
                  >
                    Kembali ke Antrean Koreksi Waaslog
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-[#dae2fd] flex items-center justify-between text-xs text-[#44474d]">
              <span>Kepatuhan: SOP Minlog Mabes TNI Pasal 14 Ayat (2)</span>
              <span className="font-mono">Otentikasi: Level 3 Staf 3</span>
            </div>
          </section>
        </div>

        {/* BOTTOM AUDIT TRAIL LOG & COMMIT BAR */}
        <footer className="w-full bg-[#f2f3ff] border-t border-[#dae2fd] p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#dae2fd] text-[#0f1e36] flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#131b2e]">Operator Verifikator:</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#dae2fd] text-[#0f1e36]">
                  Kol. Kav. Hartono (Staf 3 / Admin Minlog)
                </span>
                <span className="text-xs font-mono text-[#44474d]">28 Feb 2025, 08:42:15 WIB</span>
              </div>
              <p className="text-[11px] text-[#44474d] mt-0.5">
                Jejak audit forensik mencatat pergeseran nilai raw OCR ke hasil verifikasi staf berwenang secara permanen.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleReset}
              type="button"
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#131b2e] text-xs font-semibold border border-[#dae2fd] flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#455f87]" />
              <span>Reset ke Raw OCR</span>
            </button>
            <button
              onClick={handleCommit}
              type="button"
              className="px-5 py-2 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-bold shadow-md flex items-center gap-2"
            >
              <CloudCheck className="w-4 h-4 text-emerald-400" />
              <span>Simpan Koreksi ke SIMONAS_DB</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
