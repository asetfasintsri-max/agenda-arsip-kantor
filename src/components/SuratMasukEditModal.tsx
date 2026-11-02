/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Inbox, 
  FileText, 
  Calendar, 
  AlertCircle,
  Building,
  Shield,
  Tag
} from 'lucide-react';
import { 
  DEFAULT_11_LAMPIRAN, 
  KategoriUrusan, 
  KlasifikasiKeamanan, 
  SuratMasuk 
} from '../types';
import { DocumentAiScanUploader } from './DocumentAiScanUploader';
import { AnalyzedDocumentData } from '../services/documentAnalysis';

interface SuratMasukEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (surat: SuratMasuk) => void;
  initialData?: SuratMasuk | null;
  totalExisting?: number;
}

export const SuratMasukEditModal: React.FC<SuratMasukEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  totalExisting = 100
}) => {
  const isEdit = !!initialData;

  const [noAgenda, setNoAgenda] = useState('');
  const [noSurat, setNoSurat] = useState('');
  const [tglSurat, setTglSurat] = useState('');
  const [tglTerima, setTglTerima] = useState('');
  const [waktuTerima, setWaktuTerima] = useState('');
  const [asalSurat, setAsalSurat] = useState('');
  const [perihal, setPerihal] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [klasifikasi, setKlasifikasi] = useState<KlasifikasiKeamanan>('Biasa');
  const [derajat, setDerajat] = useState<'Kilat' | 'Segera' | 'Biasa'>('Biasa');
  const [kategoriUrusan, setKategoriUrusan] = useState<KategoriUrusan>('renbut');
  const [statusDisposisi, setStatusDisposisi] = useState<SuratMasuk['statusDisposisi']>('Proses Koordinasi Paban IV');
  const [satkerTujuan, setSatkerTujuan] = useState('Paban IV Konst / Minlog');

  // AI OCR Scan & Missing Fields states
  const [scanFileName, setScanFileName] = useState<string | undefined>(initialData?.scanFileName);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setNoAgenda(initialData.noAgenda);
      setNoSurat(initialData.noSurat);
      setTglSurat(initialData.tglSurat);
      setTglTerima(initialData.tglTerima);
      setWaktuTerima(initialData.waktuTerima);
      setAsalSurat(initialData.asalSurat);
      setPerihal(initialData.perihal);
      setRingkasan(initialData.ringkasan);
      setKlasifikasi(initialData.klasifikasi);
      setDerajat(initialData.derajat);
      setKategoriUrusan(initialData.kategoriUrusan);
      setStatusDisposisi(initialData.statusDisposisi);
      setSatkerTujuan(initialData.satkerTujuan);
    } else {
      const nextNum = totalExisting + 1;
      setNoAgenda(`AG-SM/2025/${String(nextNum).padStart(5, '0')}`);
      setNoSurat(`B/${nextNum + 1400}/II/2025/LOG`);
      setTglSurat(new Date().toISOString().slice(0, 10));
      setTglTerima(new Date().toISOString().slice(0, 10));
      setWaktuTerima('09:00 WIB');
      setAsalSurat('');
      setPerihal('');
      setRingkasan('');
      setKlasifikasi('Kilat / Rahasia');
      setDerajat('Kilat');
      setKategoriUrusan('renbut');
      setStatusDisposisi('Proses Koordinasi Paban IV');
      setSatkerTujuan('Paban IV Konst / Minlog');
    }
  }, [initialData, isOpen, totalExisting]);

  const handleExtractedFromAi = (data: AnalyzedDocumentData, file: File) => {
    if (data.noSurat) setNoSurat(data.noSurat);
    if (data.tglSurat) setTglSurat(data.tglSurat);
    if (data.tglTerimaAtauKirim) setTglTerima(data.tglTerimaAtauKirim);
    if (data.asalPengirim) setAsalSurat(data.asalPengirim);
    if (data.perihal) setPerihal(data.perihal);
    if (data.ringkasan) setRingkasan(data.ringkasan);
    if (data.klasifikasi) setKlasifikasi(data.klasifikasi as any);
    if (data.derajat) setDerajat(data.derajat as any);
    if (data.satkerTujuan) setSatkerTujuan(data.satkerTujuan);
    setScanFileName(file.name);
    setMissingFields(data.missingFields || []);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noSurat.trim() || !asalSurat.trim() || !perihal.trim()) {
      alert('Harap lengkapi Nomor Surat, Asal Pengirim, dan Perihal!');
      return;
    }

    const updatedOrNew: SuratMasuk = {
      id: initialData ? initialData.id : `sm-${Date.now()}`,
      noAgenda,
      noSurat,
      tglSurat,
      tglTerima,
      waktuTerima,
      asalSurat,
      perihal,
      ringkasan,
      klasifikasi,
      derajat,
      lampiranJumlah: initialData?.lampiranJumlah || '1 Berkas',
      lampiranList: initialData?.lampiranList || DEFAULT_11_LAMPIRAN,
      disposisi: initialData?.disposisi || {
        panglima: { checkedClauses: ['Aksi/TDL'], catatan: 'Segera pelajari dan tindak lanjuti.', diparaf: true },
        aslog: { checkedClauses: ['ssi disposisi pang tni'], catatan: 'Paban IV koordinasikan.', diparaf: true },
        waaslog: { checkedClauses: ['koordinasi'], catatan: 'Sesuai arahan.', diparaf: true },
        paban: { checkedClauses: ['siapkan'], catatan: 'Takah berkas & siapkan konsep balasan.', diparaf: false }
      },
      statusDisposisi,
      kategoriUrusan,
      satkerTujuan,
      scanFileName: scanFileName || initialData?.scanFileName,
      tglDibuat: initialData?.tglDibuat || new Date().toISOString()
    };

    onSave(updatedOrNew);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#dae2fd] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#0f1e36] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 flex items-center justify-center border border-emerald-400/30">
              <Inbox className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm">
                {isEdit ? 'Ubah / Edit Agenda Surat Masuk' : 'Tambah Agenda Surat Masuk'}
              </h3>
              <p className="text-[11px] text-[#adc8f5]">
                {isEdit ? `ID: ${initialData?.id} • Nomor: ${initialData?.noSurat}` : 'Registrasi naskah masuk via input manual atau pemindai cerdas PDF/Foto'}
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* AI OCR SCANNER DROPZONE */}
          <DocumentAiScanUploader
            documentType="surat_masuk"
            onExtracted={handleExtractedFromAi}
          />

          {/* Row 1: No Agenda & No Surat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                No. Agenda Surat
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
                  No. Surat Dinas *
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
                placeholder="Contoh: B/1429/II/2025/LOG"
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                  (!noSurat.trim() && missingFields.length > 0)
                    ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                    : 'border-[#dae2fd] bg-white text-[#131b2e]'
                }`}
                required
              />
            </div>
          </div>

          {/* Row 2: Tanggal Surat, Tanggal & Waktu Terima */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                Tanggal Diterima
              </label>
              <input
                type="date"
                value={tglTerima}
                onChange={(e) => setTglTerima(e.target.value)}
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Waktu Terima
              </label>
              <input
                type="text"
                value={waktuTerima}
                onChange={(e) => setWaktuTerima(e.target.value)}
                placeholder="08:30 WIB"
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs"
              />
            </div>
          </div>

          {/* Row 3: Asal Pengirim & Satker Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase text-[#44474d] block">
                  Asal Pengirim / Instansi *
                </label>
                {(!asalSurat.trim() || missingFields.includes('asalPengirim')) && (
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                    Opsi Isi Manual
                  </span>
                )}
              </div>
              <input
                type="text"
                value={asalSurat}
                onChange={(e) => setAsalSurat(e.target.value)}
                placeholder="Contoh: Mabes TNI / Slog TNI"
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  (!asalSurat.trim() && missingFields.length > 0)
                    ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                    : 'border-[#dae2fd] bg-white text-[#131b2e]'
                }`}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Satuan Tujuan
              </label>
              <input
                type="text"
                value={satkerTujuan}
                onChange={(e) => setSatkerTujuan(e.target.value)}
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs"
              />
            </div>
          </div>

          {/* Row 4: Perihal Dokumen */}
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
              placeholder="Perihal surat kedinasan..."
              className={`w-full px-3 py-1.5 rounded-lg border text-xs font-medium ${
                (!perihal.trim() && missingFields.length > 0)
                  ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                  : 'border-[#dae2fd] bg-white text-[#131b2e]'
              }`}
              required
            />
          </div>

          {/* Row 5: Ringkasan Naskah */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase text-[#44474d] block">
                Ringkasan Isi / Ekstraksi
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
              placeholder="Catatan ringkas isi pokok surat..."
              className={`w-full px-3 py-1.5 rounded-lg border text-xs leading-relaxed ${
                (!ringkasan.trim() && missingFields.length > 0)
                  ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                  : 'border-[#dae2fd] bg-white text-[#131b2e]'
              }`}
            />
          </div>

          {/* Row 6: Klasifikasi, Derajat, Urusan & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Klasifikasi Keamanan
              </label>
              <select
                value={klasifikasi}
                onChange={(e) => setKlasifikasi(e.target.value as KlasifikasiKeamanan)}
                className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-semibold"
              >
                <option value="Kilat / Rahasia">Kilat / Rahasia</option>
                <option value="Kilat">Kilat</option>
                <option value="Rahasia">Rahasia</option>
                <option value="Biasa">Biasa</option>
                <option value="Sangat Rahasia">Sangat Rahasia</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Derajat Kecepatan
              </label>
              <select
                value={derajat}
                onChange={(e) => setDerajat(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-semibold"
              >
                <option value="Kilat">⚡ Kilat</option>
                <option value="Segera">Segera</option>
                <option value="Biasa">Biasa</option>
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
                <option value="legal_utilitas">Listrik &amp; Air</option>
                <option value="laporan">Laporan Berkala</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Status Disposisi
              </label>
              <select
                value={statusDisposisi}
                onChange={(e) => setStatusDisposisi(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-semibold"
              >
                <option value="Proses Koordinasi Paban IV">Koordinasi Paban IV</option>
                <option value="Selesai / Terarsip">Selesai / Terarsip</option>
                <option value="Perlu Koreksi / Kekurangan Lampiran">Perlu Koreksi</option>
                <option value="Draf OCR">Draf OCR</option>
              </select>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#dae2fd] flex items-center justify-between shrink-0">
            <span className="text-[11px] text-[#44474d]">
              * Wajib diisi untuk standarisasi arsip naskah dinas
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
                <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Surat Masuk'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
