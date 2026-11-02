/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Search, X, Inbox, Send, Radio, ChevronRight } from 'lucide-react';
import { SuratKeluar, SuratMasuk, WartaTelegram } from '../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  suratMasukList: SuratMasuk[];
  suratKeluarList: SuratKeluar[];
  telegramList: WartaTelegram[];
  onSelectSuratMasuk: (surat: SuratMasuk) => void;
  onSelectSuratKeluar: (surat: SuratKeluar) => void;
  onSelectTelegram: (telegram: WartaTelegram) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  suratMasukList,
  suratKeluarList,
  telegramList,
  onSelectSuratMasuk,
  onSelectSuratKeluar,
  onSelectTelegram
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open handled in parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSM = query.trim()
    ? suratMasukList.filter(
        (s) =>
          s.noAgenda.toLowerCase().includes(query.toLowerCase()) ||
          s.noSurat.toLowerCase().includes(query.toLowerCase()) ||
          s.asalSurat.toLowerCase().includes(query.toLowerCase()) ||
          s.perihal.toLowerCase().includes(query.toLowerCase())
      )
    : suratMasukList.slice(0, 3);

  const filteredSK = query.trim()
    ? suratKeluarList.filter(
        (s) =>
          s.noAgenda.toLowerCase().includes(query.toLowerCase()) ||
          s.noSurat.toLowerCase().includes(query.toLowerCase()) ||
          s.tujuanSurat.toLowerCase().includes(query.toLowerCase()) ||
          s.perihal.toLowerCase().includes(query.toLowerCase())
      )
    : suratKeluarList.slice(0, 2);

  const filteredTR = query.trim()
    ? telegramList.filter(
        (t) =>
          t.noTelegram.toLowerCase().includes(query.toLowerCase()) ||
          t.dari.toLowerCase().includes(query.toLowerCase()) ||
          t.perihal.toLowerCase().includes(query.toLowerCase())
      )
    : telegramList.slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-12 sm:pt-20 p-2.5 sm:p-4 select-none">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#dae2fd] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 bg-[#f2f3ff] border-b border-[#dae2fd] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#455f87] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari naskah dinas, nomor agenda, asal instansi, atau perihal (Ctrl+K)..."
            className="w-full bg-transparent text-sm text-[#131b2e] placeholder:text-[#75777e] outline-none font-medium"
          />
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Surat Masuk Section */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase text-[#44474d] mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-[#0f1e36]" />
                <span>Agenda Surat Masuk ({filteredSM.length})</span>
              </span>
            </div>
            <div className="space-y-1">
              {filteredSM.map((sm) => (
                <button
                  key={sm.id}
                  onClick={() => {
                    onSelectSuratMasuk(sm);
                    onClose();
                  }}
                  type="button"
                  className="w-full p-2.5 rounded-lg bg-[#f2f3ff]/60 hover:bg-[#e2e7ff] text-left transition-colors flex items-center justify-between gap-3 group border border-transparent hover:border-[#dae2fd]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#0f1e36]">{sm.noAgenda}</span>
                      <span className="text-[11px] font-mono text-slate-600 truncate">{sm.noSurat}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#131b2e] truncate mt-0.5">{sm.perihal}</p>
                    <span className="text-[10px] text-[#75777e]">Asal: {sm.asalSurat}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0f1e36] shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Surat Keluar Section */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase text-[#44474d] mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#0f1e36]" />
                <span>Agenda Surat Keluar ({filteredSK.length})</span>
              </span>
            </div>
            <div className="space-y-1">
              {filteredSK.map((sk) => (
                <button
                  key={sk.id}
                  onClick={() => {
                    onSelectSuratKeluar(sk);
                    onClose();
                  }}
                  type="button"
                  className="w-full p-2.5 rounded-lg bg-[#f2f3ff]/60 hover:bg-[#e2e7ff] text-left transition-colors flex items-center justify-between gap-3 group border border-transparent hover:border-[#dae2fd]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#0f1e36]">{sk.noAgenda}</span>
                      <span className="text-[11px] font-mono text-slate-600 truncate">{sk.noSurat}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#131b2e] truncate mt-0.5">{sk.perihal}</p>
                    <span className="text-[10px] text-[#75777e]">Tujuan: {sk.tujuanSurat}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0f1e36] shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Telegram Section */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase text-[#44474d] mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#0f1e36]" />
                <span>Warta Telegram ({filteredTR.length})</span>
              </span>
            </div>
            <div className="space-y-1">
              {filteredTR.map((tr) => (
                <button
                  key={tr.id}
                  onClick={() => {
                    onSelectTelegram(tr);
                    onClose();
                  }}
                  type="button"
                  className="w-full p-2.5 rounded-lg bg-[#f2f3ff]/60 hover:bg-[#e2e7ff] text-left transition-colors flex items-center justify-between gap-3 group border border-transparent hover:border-[#dae2fd]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#0f1e36]">{tr.noTelegram}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#b5d0fd]/40 text-[#0f1e36] font-bold">
                        {tr.tipe}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#131b2e] truncate mt-0.5">{tr.perihal}</p>
                    <span className="text-[10px] text-[#75777e]">Dari: {tr.dari}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0f1e36] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#f2f3ff] border-t border-[#dae2fd] text-xs text-[#75777e] flex justify-between items-center">
          <span>Gunakan panah &amp; tekan Enter untuk navigasi cepat</span>
          <span className="font-mono text-[11px]">ESC untuk menutup</span>
        </div>
      </div>
    </div>
  );
};
