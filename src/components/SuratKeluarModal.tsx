/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Send, 
  FileText, 
  Calendar, 
  ShieldCheck,
  Building
} from 'lucide-react';
import { KategoriUrusan, KlasifikasiKeamanan, SuratKeluar } from '../types';
import { DocumentAiScanUploader } from './DocumentAiScanUploader';
import { AnalyzedDocumentData } from '../services/documentAnalysis';

interface SuratKeluarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (surat: SuratKeluar) => void;
  initialData?: SuratKeluar | null;
  totalExisting?: number;
}

export const SuratKeluarModal: React.FC<SuratKeluarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  totalExisting = 90
}) => {
  const isEdit = !!initialData;

  const [noAgenda, setNoAgenda] = useState('');
  const [noSurat, setNoSurat] = useState('');
  const [tglSurat, setTglSurat] = useState('');
  const [tglKirim, setTglKirim] = useState('');
  const [tujuanSurat, setTujuanSurat] = useState('');
  const [perihal, setPerihal] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [klasifikasi, setKlasifikasi] = useState<KlasifikasiKeamanan>('Biasa');
  const [kategoriUrusan, setKategoriUrusan] = useState<KategoriUrusan>('renbut');
  const [konseptor, setKonseptor] = useState('Kolonel Kav. Hartono (Kaur Reg. Minlog)');
  const [statusTTE, setStatusTTE] = useState<SuratKeluar['statusTTE']>('Diparaf Waaslog');
  const [lampiranJumlah, setLampiranJumlah] = useState('1 Lembar');

  // AI OCR Scan & Missing Fields states
  const [scanFileName, setScanFileName] = useState<string | undefined>(undefined);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const handleExtractedFromAi = (data: AnalyzedDocumentData, file: File) => {
    if (data.noSurat) setNoSurat(data.noSurat);
    if (data.tglSurat) setTglSurat(data.tglSurat);
    if (data.tglTerimaAtauKirim) setTglKirim(data.tglTerimaAtauKirim);
    if (data.tujuanPenerima) setTujuanSurat(data.tujuanPenerima);
    if (data.perihal) setPerihal(data.perihal);
    if (data.ringkasan) setRingkasan(data.ringkasan);
    if (data.klasifikasi) setKlasifikasi(data.klasifikasi as any);
    if (data.konseptor) setKonseptor(data.konseptor);
    if (data.statusTTE) setStatusTTE(data.statusTTE as any);
    setScanFileName(file.name);
    setMissingFields(data.missingFields || []);
  };

  useEffect(() => {
    if (initialData) {
      setNoAgenda(initialData.noAgenda);
      setNoSurat(initialData.noSurat);
      setTglSurat(initialData.tglSurat);
      setTglKirim(initialData.tglKirim);
      setTujuanSurat(initialData.tujuanSurat);
      setPerihal(initialData.perihal);
      setRingkasan(initialData.ringkasan);
      setKlasifikasi(initialData.klasifikasi);
      setKategoriUrusan(initialData.kategoriUrusan);
      setKonseptor(initialData.konseptor);
      setStatusTTE(initialData.statusTTE);
      setLampiranJumlah(initialData.lampiranJumlah);
    } else {
      const nextNum = totalExisting + 1;
      setNoAgenda(`AG-SK/2025/${String(nextNum).padStart(5, '0')}`);
      setNoSurat(`B/${nextNum + 895}/II/2025/KONST`);
      setTglSurat(new Date().toISOString().slice(0, 10));
      setTglKirim(new Date().toISOString().slice(0, 10));
      setTujuanSurat('');
      setPerihal('');
      setRingkasan('');
      setKlasifikasi('Biasa');
      setKategoriUrusan('renbut');
      setKonseptor('Kolonel Kav. Hartono (Kaur Reg. Minlog)');
      setStatusTTE('Diparaf Waaslog');
      setLampiranJumlah('1 Berkas');
    }
  }, [initialData, isOpen, totalExisting]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noSurat.trim() || !tujuanSurat.trim() || !perihal.trim()) {
      alert('Harap lengkapi No Surat, Tujuan Satker, dan Perihal!');
      return;
    }

    const updatedOrNew: SuratKeluar = {
      id: initialData ? initialData.id : `sk-${Date.now()}`,
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
      tglDibuat: initialData?.tglDibuat || new Date().toISOString()
    };

    onSave(updatedOrNew);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#dae2fd] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-[#0f1e36] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center border border-white/20">
              <Send className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm">
                {isEdit ? 'Ubah / Edit Agenda Surat Keluar' : 'Registrasi Agenda Surat Keluar Baru'}
              </h3>
              <p className="text-[11px] text-[#adc8f5]">
                {isEdit ? `ID: ${initialData?.id} • Nomor: ${initialData?.noSurat}` : 'Pencatatan naskah keluar dan alur tanda tangan elektronik'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* AI OCR SCANNER FOR PDF & PHOTO */}
          <DocumentAiScanUploader
            documentType="surat_keluar"
            onExtracted={handleExtractedFromAi}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                No. Agenda SK
              </label>
              <input
                type="text"
                value={noAgenda}
                onChange={(e) => setNoAgenda(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#f2f3ff] rounded-lg border border-[#dae2fd] text-xs font-mono font-bold text-[#0f1e36]"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase text-[#44474d] block">
                  No. Surat Keluar *
                </label>
                {(!noSurat.trim() || missingFields.includes('noSurat')) && (
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                    Opsi Isi Manual
                  </span>
                )}
              </div>
              <input
                type="text"
                value={noSurat}
                onChange={(e) => setNoSurat(e.target.value)}
                placeholder="Contoh: B/899/II/2025/KONST"
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                  (!noSurat.trim() && missingFields.length > 0)
                    ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                    : 'border-[#dae2fd] bg-white text-[#131b2e]'
                }`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Tanggal Surat
              </label>
              <input
                type="date"
                value={tglSurat}
                onChange={(e) => setTglSurat(e.target.value)}
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Tanggal Kirim
              </label>
              <input
                type="date"
                value={tglKirim}
                onChange={(e) => setTglKirim(e.target.value)}
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase text-[#44474d] block">
                Tujuan Satker / Instansi *
              </label>
              {(!tujuanSurat.trim() || missingFields.includes('tujuanPenerima')) && (
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                  Opsi Isi Manual
                </span>
              )}
            </div>
            <input
              type="text"
              value={tujuanSurat}
              onChange={(e) => setTujuanSurat(e.target.value)}
              placeholder="Contoh: Pangdam Jaya / Aslog Kasdam Jaya"
              className={`w-full px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                (!tujuanSurat.trim() && missingFields.length > 0)
                  ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                  : 'border-[#dae2fd] bg-white text-[#131b2e]'
              }`}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase text-[#44474d] block">
                Perihal Dokumen Resmi *
              </label>
              {(!perihal.trim() || missingFields.includes('perihal')) && (
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                  Opsi Isi Manual
                </span>
              )}
            </div>
            <input
              type="text"
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              placeholder="Perihal naskah surat keluar..."
              className={`w-full px-3 py-1.5 rounded-lg border text-xs font-medium ${
                (!perihal.trim() && missingFields.length > 0)
                  ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                  : 'border-[#dae2fd] bg-white text-[#131b2e]'
              }`}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase text-[#44474d] block">
                Ringkasan Isi
              </label>
              {(!ringkasan.trim() || missingFields.includes('ringkasan')) && (
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                  Opsi Isi Manual
                </span>
              )}
            </div>
            <textarea
              rows={2}
              value={ringkasan}
              onChange={(e) => setRingkasan(e.target.value)}
              placeholder="Ringkasan atau poin penting surat..."
              className={`w-full px-3 py-1.5 rounded-lg border text-xs leading-relaxed ${
                (!ringkasan.trim() && missingFields.length > 0)
                  ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                  : 'border-[#dae2fd] bg-white text-[#131b2e]'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Konseptor Naskah
              </label>
              <input
                type="text"
                value={konseptor}
                onChange={(e) => setKonseptor(e.target.value)}
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Status TTE &amp; Distribusi
              </label>
              <select
                value={statusTTE}
                onChange={(e) => setStatusTTE(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-semibold"
              >
                <option value="TTE Aslog Sah">TTE Aslog Sah</option>
                <option value="Diparaf Waaslog">Diparaf Waaslog</option>
                <option value="Menunggu Paraf">Menunggu Paraf</option>
                <option value="Terkirim & Arsip">Terkirim &amp; Arsip</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Klasifikasi
              </label>
              <select
                value={klasifikasi}
                onChange={(e) => setKlasifikasi(e.target.value as KlasifikasiKeamanan)}
                className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-semibold"
              >
                <option value="Biasa">Biasa</option>
                <option value="Rahasia">Rahasia</option>
                <option value="Kilat / Rahasia">Kilat / Rahasia</option>
                <option value="Kilat">Kilat</option>
                <option value="Sangat Rahasia">Sangat Rahasia</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Kategori Urusan
              </label>
              <select
                value={kategoriUrusan}
                onChange={(e) => setKategoriUrusan(e.target.value as KategoriUrusan)}
                className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-semibold"
              >
                <option value="renbut">Renbut / Faslat</option>
                <option value="perbaikan">Perbaikan Gedung</option>
                <option value="legal_utilitas">Listrik / Air</option>
                <option value="laporan">Laporan Berkala</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Lampiran
              </label>
              <input
                type="text"
                value={lampiranJumlah}
                onChange={(e) => setLampiranJumlah(e.target.value)}
                placeholder="1 Berkas"
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#dae2fd] flex items-center justify-between shrink-0">
            <span className="text-[11px] text-[#44474d]">
              * Wajib diisi untuk keabsahan registrasi surat keluar
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#131b2e] text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all transform hover:scale-105 active:scale-95"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isEdit ? 'Simpan Perubahan SK' : 'Simpan ke Agenda SK'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
