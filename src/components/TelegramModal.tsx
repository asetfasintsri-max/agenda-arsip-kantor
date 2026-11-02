/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Radio, 
  FileText, 
  Calendar, 
  ShieldAlert,
  Send
} from 'lucide-react';
import { WartaTelegram } from '../types';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (telegram: WartaTelegram) => void;
  initialData?: WartaTelegram | null;
  totalExisting?: number;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  totalExisting = 40
}) => {
  const isEdit = !!initialData;

  const [tipe, setTipe] = useState<'TR-IN' | 'TR-OUT'>('TR-IN');
  const [noTelegram, setNoTelegram] = useState('');
  const [tglWaktu, setTglWaktu] = useState('');
  const [dari, setDari] = useState('ASLOG PANGLIMA TNI');
  const [kepada, setKepada] = useState('PABAN IV/KONST SLOG TNI');
  const [tembusan, setTembusan] = useState('ASLOG KASAD, IRJEN TNI');
  const [klasifikasi, setKlasifikasi] = useState<WartaTelegram['klasifikasi']>('KILAT');
  const [derajatKeamanan, setDerajatKeamanan] = useState<WartaTelegram['derajatKeamanan']>('RAHASIA');
  const [perihal, setPerihal] = useState('');
  const [isiBerita, setIsiBerita] = useState('');
  const [status, setStatus] = useState<WartaTelegram['status']>('Diterima');

  useEffect(() => {
    if (initialData) {
      setTipe(initialData.tipe);
      setNoTelegram(initialData.noTelegram);
      setTglWaktu(initialData.tglWaktu);
      setDari(initialData.dari);
      setKepada(initialData.kepada);
      setTembusan(initialData.tembusan);
      setKlasifikasi(initialData.klasifikasi);
      setDerajatKeamanan(initialData.derajatKeamanan);
      setPerihal(initialData.perihal);
      setIsiBerita(initialData.isiBerita);
      setStatus(initialData.status);
    } else {
      const nextNum = totalExisting + 1;
      setTipe('TR-IN');
      setNoTelegram(`TR/${nextNum + 42}/2025`);
      setTglWaktu(new Date().toISOString().replace('T', ' ').slice(0, 16));
      setDari('ASLOG PANGLIMA TNI');
      setKepada('PABAN IV/KONST SLOG TNI');
      setTembusan('ASLOG KASAD, IRJEN TNI');
      setKlasifikasi('KILAT');
      setDerajatKeamanan('RAHASIA');
      setPerihal('');
      setIsiBerita('AAA ... TTK BBB ... TTK HBS');
      setStatus('Diterima');
    }
  }, [initialData, isOpen, totalExisting]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noTelegram.trim() || !perihal.trim() || !isiBerita.trim()) {
      alert('Harap lengkapi No Telegram, Perihal, dan Isi Berita!');
      return;
    }

    const updatedOrNew: WartaTelegram = {
      id: initialData ? initialData.id : `tr-${Date.now()}`,
      tipe,
      noTelegram,
      tglWaktu: tglWaktu || new Date().toISOString().replace('T', ' ').slice(0, 16),
      dari,
      kepada,
      tembusan,
      klasifikasi,
      derajatKeamanan,
      perihal,
      isiBerita,
      status,
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
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 flex items-center justify-center border border-emerald-400/30">
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm">
                {isEdit ? 'Ubah / Edit Warta Telegram' : 'Buat Warta Telegram Baru'}
              </h3>
              <p className="text-[11px] text-[#adc8f5]">
                {isEdit ? `ID: ${initialData?.id} • Nomor: ${initialData?.noTelegram}` : 'Pencatatan jalur sandi & kawat kedinasan militer'}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Tipe Warta Telegram
              </label>
              <div className="inline-flex w-full p-1 rounded-lg bg-[#f2f3ff] border border-[#dae2fd]">
                <button
                  type="button"
                  onClick={() => setTipe('TR-IN')}
                  className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                    tipe === 'TR-IN' ? 'bg-[#0f1e36] text-white shadow-xs' : 'text-[#44474d]'
                  }`}
                >
                  TR-IN (Masuk)
                </button>
                <button
                  type="button"
                  onClick={() => setTipe('TR-OUT')}
                  className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                    tipe === 'TR-OUT' ? 'bg-[#0f1e36] text-white shadow-xs' : 'text-[#44474d]'
                  }`}
                >
                  TR-OUT (Keluar)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Nomor Telegram *
              </label>
              <input
                type="text"
                value={noTelegram}
                onChange={(e) => setNoTelegram(e.target.value)}
                placeholder="Contoh: TR/42/2025"
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-mono font-bold text-[#131b2e] focus:ring-1 focus:ring-[#0f1e36]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Dari (Pengirim)
              </label>
              <input
                type="text"
                value={dari}
                onChange={(e) => setDari(e.target.value)}
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-semibold uppercase"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Kepada (Tujuan)
              </label>
              <input
                type="text"
                value={kepada}
                onChange={(e) => setKepada(e.target.value)}
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-semibold uppercase"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
              Tembusan
            </label>
            <input
              type="text"
              value={tembusan}
              onChange={(e) => setTembusan(e.target.value)}
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs uppercase"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Derajat Kecepatan
              </label>
              <select
                value={klasifikasi}
                onChange={(e) => setKlasifikasi(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-bold text-red-700"
              >
                <option value="KILAT">KILAT</option>
                <option value="SEGERA">SEGERA</option>
                <option value="BIASA">BIASA</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Tingkat Keamanan
              </label>
              <select
                value={derajatKeamanan}
                onChange={(e) => setDerajatKeamanan(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-bold text-red-700"
              >
                <option value="RAHASIA">RAHASIA</option>
                <option value="BIASA">BIASA</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
                Status Warta
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-semibold"
              >
                <option value="Diterima">Diterima</option>
                <option value="Didisposisi">Didisposisi</option>
                <option value="Terkirim & Arsip">Terkirim &amp; Arsip</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
              Perihal Warta *
            </label>
            <input
              type="text"
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              placeholder="Perihal warta telegram..."
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#44474d] block mb-1">
              Isi Berita Telegram (Format Militer) *
            </label>
            <textarea
              rows={4}
              value={isiBerita}
              onChange={(e) => setIsiBerita(e.target.value)}
              placeholder="AAA TTK RENCANA PERGESERAN LOGISTIK TTK BBB ..."
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#dae2fd] text-xs font-mono leading-relaxed"
              required
            />
          </div>

          <div className="pt-4 border-t border-[#dae2fd] flex items-center justify-between shrink-0">
            <span className="text-[11px] text-[#44474d]">
              * Warta telegram resmi terarsip secara terenkripsi
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
                <span>{isEdit ? 'Simpan Perubahan TR' : 'Simpan Warta Telegram'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
