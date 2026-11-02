/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Search, 
  Bell, 
  Database, 
  ChevronRight,
  ShieldCheck,
  Menu,
  LogOut,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { ActivePage } from './Sidebar';

interface HeaderProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onBack?: () => void;
  onHome?: () => void;
  canGoBack?: boolean;
  onOpenSearch: () => void;
  userRole: string;
  onSelectRole: (role: string) => void;
  notificationCount?: number;
  isSidebarPinned?: boolean;
  onToggleSidebar?: () => void;
  onHoverSidebar?: (hovered: boolean) => void;
  googleUser?: { displayName: string | null; email: string | null; photoURL: string | null } | null;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
  isLoggingIn?: boolean;
  linkedSpreadsheetId?: string | null;
  autoSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  onBack,
  onHome,
  canGoBack = true,
  onOpenSearch,
  userRole,
  onSelectRole,
  notificationCount = 2,
  isSidebarPinned = false,
  onToggleSidebar,
  onHoverSidebar,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isLoggingIn = false,
  linkedSpreadsheetId,
  autoSyncStatus = 'idle',
  lastSyncTime
}) => {
  const getPageTitle = (page: ActivePage): { title: string; parent: string } => {
    switch (page) {
      case 'dashboard':
        return { parent: 'Beranda', title: 'Dashboard Utama' };
      case 'agenda-surat':
        return { parent: 'Buku Agenda', title: 'Agenda Surat (Masuk & Keluar)' };
      case 'surat-masuk':
        return { parent: 'Buku Agenda', title: 'Agenda Surat Masuk' };
      case 'surat-keluar':
        return { parent: 'Buku Agenda', title: 'Agenda Surat Keluar' };
      case 'telegram':
        return { parent: 'Buku Agenda', title: 'Agenda Warta Telegram' };
      case 'disposisi':
        return { parent: 'Tindak Lanjut', title: 'Disposisi 4 Pejabat' };
      case 'ocr-scanner':
        return { parent: 'Alat Cerdas', title: 'Pusat Pemrosesan OCR' };
      case 'rekapitulasi':
        return { parent: 'Monitoring & Laporan', title: 'Rekapitulasi Berkas' };
      case 'database':
        return { parent: 'Sistem', title: 'Pengaturan & Basis Data' };
      default:
        return { parent: 'Beranda', title: 'SIMONAS' };
    }
  };

  const { parent, title } = getPageTitle(activePage);

  return (
    <header className={`fixed top-0 ${isSidebarPinned ? 'lg:left-72 xl:left-80' : 'left-0'} right-0 transition-all duration-300 h-16 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#dae2fd] z-30 flex items-center justify-between px-2 sm:px-5 lg:px-6 shadow-xs select-none`}>
      {/* SECTION 1: MENU TOGGLE + DEDICATED BACK & HOME BUTTONS */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {/* TOMBOL BUKA MENU (JIKA SIDEBAR OTOMATIS SEMBUNYI ATAU DI LAYAR HP/TABLET) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            onMouseEnter={() => onHoverSidebar?.(true)}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0f1e36] hover:bg-[#1e3a5f] text-white text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 border border-[#3b5998] shadow-xs cursor-pointer group ${
              isSidebarPinned ? 'lg:hidden' : ''
            }`}
            title="Buka Menu Navigasi (Sorot atau Klik)"
          >
            <Menu className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform duration-300" />
            <span className="hidden sm:inline font-mono text-[11px] tracking-wide">MENU</span>
          </button>
        )}

        {/* BREADCRUMB TRAIL */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-[#44474d] min-w-0">
          <span className="hidden sm:inline hover:text-[#131b2e] transition-colors">{parent}</span>
          <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-[#75777e]" />
          <span className="font-bold text-[#0f1e36] bg-[#e2e7ff] px-2 py-0.5 rounded border border-[#dae2fd] truncate text-[11px] sm:text-xs max-w-[110px] sm:max-w-none">
            {title}
          </span>
        </div>
      </div>

      {/* SECTION 2: SEARCH PILL WITH ANIMATION */}
      <div className="flex-1 max-w-md mx-3 hidden lg:block">
        <button
          onClick={onOpenSearch}
          type="button"
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#44474d] hover:text-[#0f1e36] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.99] border border-[#dae2fd] text-xs shadow-xs hover:shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#455f87]" />
            <span>Pencarian Cepat Berkas (Ctrl+K)...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-[#f2f3ff] text-[#455f87] border border-[#dae2fd]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* SECTION 3: ROLE SWITCHER, NOTIFICATIONS & USER PROFILE */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile / Tablet Search Trigger Button */}
        <button
          onClick={onOpenSearch}
          type="button"
          className="lg:hidden p-2 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#0f1e36] border border-[#dae2fd] shadow-xs cursor-pointer active:scale-95"
          title="Pencarian Cepat (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-[#455f87]" />
        </button>

        {/* ROLE SWITCHER: DESKTOP TABS (lg:) VS TABLET/MOBILE COMPACT SELECT */}
        <div className="hidden lg:flex items-center bg-[#f2f3ff] p-1 rounded-xl border border-[#dae2fd] shadow-xs">
          {['Pelihat', 'Staf 1', 'Staf 3 / Admin'].map((role) => {
            const isSelected = userRole === role;
            return (
              <button
                key={role}
                onClick={() => onSelectRole(role)}
                type="button"
                className={`px-2.5 py-1 text-xs rounded-lg transition-all duration-200 transform cursor-pointer ${
                  isSelected
                    ? 'bg-[#0f1e36] text-white font-bold scale-105 shadow-md ring-2 ring-[#0f1e36]/20'
                    : 'text-[#44474d] hover:text-[#0f1e36] hover:scale-102 hover:bg-white/60'
                }`}
                title={`Pilih Hak Akses: ${role}`}
              >
                {role}
              </button>
            );
          })}
        </div>

        {/* Mobile / Tablet Compact Role Selector */}
        <div className="lg:hidden">
          <select
            value={userRole}
            onChange={(e) => onSelectRole(e.target.value)}
            className="px-2 py-1 bg-[#f2f3ff] border border-[#dae2fd] rounded-lg text-xs font-bold text-[#0f1e36] cursor-pointer"
            title="Pilih Role Pengguna"
          >
            <option value="Pelihat">Pelihat</option>
            <option value="Staf 1">Staf 1</option>
            <option value="Staf 3 / Admin">Admin</option>
          </select>
        </div>

        {/* GOOGLE WORKSPACE CONNECTION & SIGN IN */}
        {googleUser ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Auto-Sync Google Sheets Indicator */}
            <div 
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-xs transition-all ${
                autoSyncStatus === 'syncing'
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
              title={
                autoSyncStatus === 'syncing' 
                  ? 'Sedang menyinkronkan data riil ke Google Spreadsheet...' 
                  : `Data otomatis terupdate ke Google Spreadsheet ${lastSyncTime ? `(Pukul ${lastSyncTime})` : ''}`
              }
            >
              {autoSyncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span className="text-[11px] font-mono whitespace-nowrap">
                {autoSyncStatus === 'syncing' ? 'Sync Sheets...' : 'Sheets Auto-Update'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-xl bg-white border border-emerald-300 shadow-xs hover:border-emerald-400 transition-all">
              {googleUser.photoURL ? (
                <img src={googleUser.photoURL} alt="Google" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-emerald-400 object-cover shrink-0" />
              ) : (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  G
                </div>
              )}
              <div className="flex flex-col text-left max-w-[80px] xs:max-w-[110px] sm:max-w-[140px] lg:max-w-[170px] truncate">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#131b2e] leading-tight truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="truncate">
                    {googleUser.email === 'admstaf76@gmail.com' ? 'admstaf76 (Resmi)' : (googleUser.displayName || 'Google')}
                  </span>
                </span>
                <span className="text-[9px] text-[#44474d] truncate font-mono hidden xs:inline">
                  {googleUser.email || 'admstaf76@gmail.com'}
                </span>
              </div>
              {onGoogleSignOut && (
                <button
                  onClick={onGoogleSignOut}
                  type="button"
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-0.5 cursor-pointer"
                  title="Keluar dari Google Workspace"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : onGoogleSignIn ? (
          <button
            onClick={onGoogleSignIn}
            disabled={isLoggingIn}
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold border border-[#dae2fd] shadow-xs hover:shadow-sm transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Hubungkan Google Drive & Sheets admstaf76@gmail.com"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span className="hidden sm:inline">{isLoggingIn ? 'Menghubungkan...' : 'Masuk admstaf76@gmail.com'}</span>
            <span className="sm:hidden">{isLoggingIn ? '...' : 'admstaf76'}</span>
          </button>
        ) : null}

        {/* STATUS DATABASE AKTIF */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#e2e7ff] text-[#0f1e36] text-xs font-semibold border border-[#dae2fd]">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>DB Real</span>
        </div>

        {/* NOTIFICATION BUTTON - ANIMASI MEMBESAR JIKA DIPILIH / DIKLIK */}
        <button
          onClick={() => alert('Notifikasi SIMONAS: Terdapat 1 berkas disposisi menunggu konfirmasi manual (Waaslog).')}
          type="button"
          className="relative p-2 rounded-xl bg-white hover:bg-[#e2e7ff] text-[#0f1e36] transition-all duration-200 transform hover:scale-110 active:scale-95 border border-[#dae2fd] shadow-xs hover:shadow-md cursor-pointer"
          title="Notifikasi Masuk"
        >
          <Bell className="w-4 h-4 text-[#0f1e36]" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#ba1a1a] ring-2 ring-white animate-pulse"></span>
          )}
        </button>
      </div>
    </header>
  );
};
