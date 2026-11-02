/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  HardDrive, 
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SuratKeluar, SuratMasuk, WartaTelegram } from '../types';
import { GoogleWorkspacePanel } from './GoogleWorkspacePanel';
import { SpreadsheetImportModal } from './SpreadsheetImportModal';

interface DatabaseSettingsViewProps {
  suratMasukList: SuratMasuk[];
  suratKeluarList: SuratKeluar[];
  telegramList: WartaTelegram[];
  onImportData: (data: { suratMasuk?: SuratMasuk[]; suratKeluar?: SuratKeluar[]; telegram?: WartaTelegram[] }) => void;
  onResetData: () => void;
  googleUser: { displayName: string | null; email: string | null; photoURL: string | null } | null;
  onGoogleSignIn: () => void;
  isLoggingIn: boolean;
  autoSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime?: string | null;
  isAutoSyncEnabled?: boolean;
  onToggleAutoSync?: (enabled: boolean) => void;
}

export const DatabaseSettingsView: React.FC<DatabaseSettingsViewProps> = ({
  suratMasukList,
  suratKeluarList,
  telegramList,
  onImportData,
  onResetData,
  googleUser,
  onGoogleSignIn,
  isLoggingIn,
  autoSyncStatus = 'idle',
  lastSyncTime,
  isAutoSyncEnabled = true,
  onToggleAutoSync
}) => {
  const [isSpreadsheetImportOpen, setIsSpreadsheetImportOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSpreadsheetImportComplete = (imported: {
    suratMasuk: SuratMasuk[];
    suratKeluar: SuratKeluar[];
    telegram: WartaTelegram[];
  }) => {
    onImportData({
      suratMasuk: [...suratMasukList, ...imported.suratMasuk],
      suratKeluar: [...suratKeluarList, ...imported.suratKeluar],
      telegram: [...telegramList, ...imported.telegram],
    });
    alert(`Berhasil mengintegrasikan ${imported.suratMasuk.length} Surat Masuk, ${imported.suratKeluar.length} Surat Keluar, dan ${imported.telegram.length} Telegram ke dalam sistem SIMONAS!`);
  };

  const handleExportBackup = () => {
    const backupObj = {
      version: '4.2.0',
      timestamp: new Date().toISOString(),
      system: 'SIMONAS_REAL_DATABASE',
      suratMasuk: suratMasukList,
      suratKeluar: suratKeluarList,
      telegram: telegramList
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `simonas_real_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (parsed.suratMasuk || parsed.suratKeluar || parsed.telegram)) {
          onImportData(parsed);
          alert('Basis Data SIMONAS Berhasil Dipulihkan dari File!');
        } else {
          alert('Format berkas tidak valid untuk cadangan SIMONAS.');
        }
      } catch (err) {
        alert('Gagal membaca berkas cadangan JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0f1e36] text-white flex items-center justify-center">
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <h1 className="font-heading text-xl font-bold text-[#131b2e] tracking-tight">
            Pengaturan Basis Data Riil &amp; Integrasi Google Workspace
          </h1>
        </div>
        <p className="text-xs text-[#44474d] mt-1">
          Sinkronisasi Google Spreadsheet, penyimpanan berkas Google Drive, cadangan offline (JSON), dan manajemen data nyata.
        </p>
      </div>

      {/* SYSTEM STATUS & METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd]">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#44474d] mb-2">
            <span>Status Mode</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-heading font-bold text-base text-[#131b2e]">DATA NYATA (REAL PRODUCTION)</span>
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-semibold">Seluruh Data Dummy Telah Dibersihkan</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd]">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#44474d] mb-2">
            <span>Total Dokumen Riil</span>
            <HardDrive className="w-4 h-4 text-[#455f87]" />
          </div>
          <div className="font-heading font-bold text-2xl text-[#131b2e]">
            {suratMasukList.length + suratKeluarList.length + telegramList.length} Naskah
          </div>
          <p className="text-xs text-[#75777e] mt-1">
            SM: {suratMasukList.length} • SK: {suratKeluarList.length} • TR: {telegramList.length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#dae2fd]">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#44474d] mb-2">
            <span>Integrasi Cloud</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-heading font-bold text-base text-[#0f1e36]">
            {googleUser ? 'Google Workspace Terhubung' : 'Siap Dihubungkan'}
          </div>
          <p className="text-xs text-[#75777e] mt-1 truncate">
            {googleUser ? googleUser.email : 'Google Sheets & Drive'}
          </p>
        </div>
      </div>

      {/* DEDICATED GOOGLE WORKSPACE PANEL (SHEETS & DRIVE) */}
      <GoogleWorkspacePanel
        suratMasukList={suratMasukList}
        suratKeluarList={suratKeluarList}
        telegramList={telegramList}
        onUpdateData={onImportData}
        onClearAllData={onResetData}
        googleUser={googleUser}
        onGoogleSignIn={onGoogleSignIn}
        isLoggingIn={isLoggingIn}
        autoSyncStatus={autoSyncStatus}
        lastSyncTime={lastSyncTime}
        isAutoSyncEnabled={isAutoSyncEnabled}
        onToggleAutoSync={onToggleAutoSync}
      />

      {/* GOOGLE SPREADSHEET IMPORTER & MANUAL CLASSIFIER CARD */}
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl shadow-sm border border-emerald-200 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h3 className="font-heading font-bold text-sm text-[#0f1e36]">
                Import &amp; Klasifikasi Data dari Google Spreadsheet (Manual Review)
              </h3>
            </div>
            <p className="text-xs text-[#44474d] leading-relaxed max-w-2xl">
              Salin baris tabel langsung dari Google Spreadsheet Anda atau tarik via Google Sheets API. Anda dapat mengelompokkan setiap baris secara manual sebagai <b>Surat Masuk</b>, <b>Surat Keluar</b>, atau <b>Warta Telegram</b> sebelum dimasukkan ke aplikasi.
            </p>
          </div>
          <button
            onClick={() => setIsSpreadsheetImportOpen(true)}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <Layers className="w-4 h-4 text-emerald-200" />
            <span>Buka Wizard Klasifikasi Manual</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* OFFLINE BACKUP & RESTORE ACTIONS */}
      <div className="bg-white rounded-xl shadow-sm border border-[#dae2fd] p-5 space-y-4">
        <h3 className="font-heading font-bold text-sm text-[#131b2e]">
          Pencadangan Berkas Offline (Lokal JSON)
        </h3>
        <p className="text-xs text-[#44474d] leading-relaxed">
          Unduh cadangan data lokal dalam format JSON atau pulihkan data dari komputer tanpa jaringan internet.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f1e36] hover:bg-[#000412] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Cadangan JSON</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0f1e36] text-xs font-bold border border-[#dae2fd] shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#455f87]" />
            <span>Pulihkan dari File Cadangan (JSON)</span>
          </button>

          <button
            onClick={() => {
              if (confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh data lokal naskah dinas?')) {
                onResetData();
                alert('Seluruh data lokal telah dikosongkan.');
              }
            }}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors ml-auto cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kosongkan Semua Data</span>
          </button>
        </div>
      </div>

      {/* SPREADSHEET IMPORT MODAL */}
      <SpreadsheetImportModal
        isOpen={isSpreadsheetImportOpen}
        onClose={() => setIsSpreadsheetImportOpen(false)}
        onImportCompleted={handleSpreadsheetImportComplete}
        googleUser={googleUser}
      />

      {/* SECURITY CLEARANCE & PROTOCOL INFO */}
      <div className="bg-[#f2f3ff] rounded-xl p-4 border border-[#dae2fd] text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#0f1e36]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Protokol Keamanan Sistem SIMONAS Real Production</span>
        </div>
        <p className="text-[#44474d] leading-relaxed">
          Semua dokumen yang diproses melalui OCR Vision dan disposisi otomatis dienkripsi dengan standar pengamanan naskah kedinasan. Seluruh akses sinkronisasi Google Sheets dan Google Drive diproteksi dengan otorisasi resmi Google OAuth 2.0.
        </p>
      </div>
    </div>
  );
};
