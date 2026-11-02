/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Mail, 
  Radio, 
  FileCheck2, 
  ScanLine, 
  BarChart3, 
  Database,
  ShieldCheck,
  ChevronRight,
  Pin,
  PinOff,
  Menu,
  Sparkles,
  X
} from 'lucide-react';

export type ActivePage = 
  | 'dashboard'
  | 'agenda-surat'
  | 'surat-masuk'
  | 'surat-keluar'
  | 'telegram'
  | 'disposisi'
  | 'ocr-scanner'
  | 'rekapitulasi'
  | 'database';

interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  telegramCount?: number;
  suratMasukCount?: number;
  suratKeluarCount?: number;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isHovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  telegramCount = 0,
  suratMasukCount = 0,
  suratKeluarCount = 0,
  isPinned = false,
  onTogglePin,
  isHovered: externalHovered,
  onHoverChange
}) => {
  const [internalHovered, setInternalHovered] = useState(false);
  const isHovered = externalHovered !== undefined ? externalHovered : internalHovered;

  const setHoveredState = (val: boolean) => {
    setInternalHovered(val);
    if (onHoverChange) {
      onHoverChange(val);
    }
  };

  const totalSurat = suratMasukCount + suratKeluarCount;

  const navItems = [
    {
      id: 'dashboard' as ActivePage,
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'agenda-surat' as ActivePage,
      label: 'Agenda Surat (Masuk & Keluar)',
      icon: Mail,
      badge: totalSurat ? `${totalSurat}` : null
    },
    {
      id: 'telegram' as ActivePage,
      label: 'Agenda Telegram',
      icon: Radio,
      badge: `${telegramCount}`
    },
    {
      id: 'disposisi' as ActivePage,
      label: 'Tindak Lanjut & Konsep',
      icon: FileCheck2,
      badge: null
    },
    {
      id: 'ocr-scanner' as ActivePage,
      label: 'Scanner OCR / Berkas',
      icon: ScanLine,
      badge: 'Cerdas'
    },
    {
      id: 'rekapitulasi' as ActivePage,
      label: 'Monitor Rekapitulasi',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'database' as ActivePage,
      label: 'Pengaturan & Basis Data',
      icon: Database,
      badge: null
    }
  ];

  const isVisible = isPinned || isHovered;

  return (
    <>
      {/* Light backdrop when overlaying while not pinned or on mobile/tablet */}
      {isVisible && (
        <div 
          onClick={() => {
            setHoveredState(false);
          }}
          className={`fixed inset-0 bg-[#000412]/50 backdrop-blur-xs z-35 transition-opacity duration-300 ${isPinned ? 'lg:hidden' : ''}`}
          title="Klik di luar untuk menutup menu"
        />
      )}

      {/* Primary Left Navigation Rail (aside) - Auto-hide with smooth animation, expands on hover */}
      <aside 
        onMouseEnter={() => setHoveredState(true)}
        onMouseLeave={() => setHoveredState(false)}
        className={`fixed left-0 top-0 h-full w-[85vw] max-w-72 sm:w-80 bg-[#0f1e36] text-white z-40 flex flex-col justify-between shadow-2xl border-r border-[#1e3a5f]/60 select-none transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Full-height invisible hover zone on the right edge of hidden aside so touching the left screen edge reveals it */}
        <div 
          className="absolute top-0 bottom-0 -right-4 w-4 pointer-events-auto"
          aria-hidden="true"
        />

        {/* Floating Protruding Edge Trigger Tab - Stays visible on screen edge when sidebar is hidden */}
        <div
          onClick={() => setHoveredState(!isHovered)}
          className={`absolute top-20 -right-11 z-50 flex items-center shadow-2xl transition-all duration-300 cursor-pointer ${
            isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          title="Sorot atau klik untuk membuka Menu Navigasi"
        >
          <div className="flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-r-xl bg-[#0f1e36] text-white border-y border-r border-[#455f87] shadow-2xl hover:bg-[#1e3a5f] hover:pl-2.5 transition-all group/tab">
            <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold font-mono tracking-widest [writing-mode:vertical-rl] text-[#adc8f5] group-hover/tab:text-white uppercase py-1">
              MENU
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#b5d0fd] group-hover/tab:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Main Sidebar Content Container */}
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header Emblem Brand + Pin Control */}
          <div className="h-16 px-4 flex items-center justify-between bg-[#000412]/70 border-b border-[#1e3a5f]/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#455f87] to-[#0f1e36] flex items-center justify-center text-white border border-white/20 shadow-inner shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-sm text-white tracking-wide leading-none truncate">
                    SIMONAS
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    REAL
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#adc8f5] tracking-wider uppercase leading-none mt-1 truncate">
                  Paban IV Konst • Slog TNI
                </span>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1.5">
              {onTogglePin && (
                <button
                  onClick={onTogglePin}
                  type="button"
                  className={`hidden lg:block p-1.5 rounded-lg border text-xs transition-all duration-200 transform hover:scale-110 cursor-pointer ${
                    isPinned
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-400/30'
                      : 'bg-[#1e3a5f]/40 text-[#adc8f5] hover:text-white hover:bg-[#1e3a5f] border-[#455f87]/40'
                  }`}
                  title={isPinned ? 'Buka Kunci (Kembali ke Sembunyi Otomatis)' : 'Kunci Menu agar Tetap Terbuka'}
                >
                  {isPinned ? <Pin className="w-4 h-4 fill-white" /> : <PinOff className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={() => setHoveredState(false)}
                type="button"
                className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer active:scale-95 transition-all"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sync Status Badge & Auto-hide Indicator */}
          <div className="px-4 py-2 flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1e3a5f]/30 border border-[#455f87]/30 text-[#b8c7e6] text-[11px] font-mono">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
                <span className="truncate">SINKRON: DB_PABAN_IV_KONST</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[10px] font-mono text-[#adc8f5]/80 px-1">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isPinned ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
                {isPinned ? 'Posisi: Terkunci (Pinned)' : 'Posisi: Otomatis Sembunyi'}
              </span>
              <span className="text-[9px] text-[#7886a3] hidden sm:inline">
                {isPinned ? 'Desktop Mode' : 'Touch & Click Ready'}
              </span>
            </div>
          </div>

          {/* Navigation List - Animated, larger size for the selected item */}
          <nav className="flex flex-col gap-1.5 px-3 py-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id || (item.id === 'agenda-surat' && (activePage === 'surat-masuk' || activePage === 'surat-keluar'));
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    // On mobile & tablet (< 1024px), close sidebar automatically upon navigation
                    if (typeof window !== 'undefined' && (window.innerWidth < 1024 || !isPinned)) {
                      setHoveredState(false);
                    }
                  }}
                  type="button"
                  className={`relative flex items-center justify-between rounded-xl transition-all duration-200 transform cursor-pointer group ${
                    isActive
                      ? 'px-4 py-3 text-sm font-extrabold scale-[1.02] sm:scale-[1.04] bg-gradient-to-r from-white via-[#f0f4ff] to-[#dce6ff] text-[#0a1628] shadow-xl ring-2 ring-blue-400/80 border border-white'
                      : 'px-3.5 py-3 sm:py-2.5 text-xs font-medium text-[#adc8f5] hover:bg-[#1e3a5f]/80 hover:text-white hover:scale-[1.02] hover:shadow-md active:scale-95'
                  }`}
                >
                  {/* Left accent bar for active item */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-blue-600 shadow-sm" />
                  )}

                  <div className="flex items-center gap-3 truncate min-w-0">
                    <div className={`p-1 rounded-lg shrink-0 transition-transform duration-200 ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700 shadow-xs scale-110' 
                        : 'text-[#8da0c4] group-hover:text-white group-hover:scale-110'
                    }`}>
                      <Icon className={isActive ? 'w-5 h-5 text-blue-700' : 'w-4 h-4'} />
                    </div>
                    
                    <div className="flex flex-col truncate text-left">
                      <span className={`truncate leading-snug ${isActive ? 'font-black tracking-tight text-[#0a1628]' : 'tracking-normal'}`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono font-bold text-blue-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                          Halaman Aktif
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono font-bold shrink-0 transition-all ${
                        isActive
                          ? 'text-xs bg-[#0f1e36] text-white shadow-xs ring-1 ring-blue-900/30'
                          : item.badge === 'Cerdas'
                          ? 'text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-[10px] bg-[#1e3a5f] text-[#adc8f5] group-hover:bg-[#254670] group-hover:text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Info */}
          <div className="p-3.5 bg-[#000412]/50 border-t border-[#1e3a5f]/40 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b5d0fd] animate-pulse"></span>
                <span className="text-[11px] font-mono text-[#adc8f5]">v4.2.0 • Jalur Terenkripsi</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                MILSPEC
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
