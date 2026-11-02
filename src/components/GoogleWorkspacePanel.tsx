/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  HardDrive, 
  UploadCloud, 
  DownloadCloud, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  FileText, 
  FolderPlus,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { SuratMasuk, SuratKeluar, WartaTelegram } from '../types';
import { 
  createSIMONASSpreadsheet, 
  findExistingSpreadsheet, 
  syncDataToGoogleSheets, 
  pullDataFromGoogleSheets,
  findOrCreateDriveFolder,
  uploadFileToDrive,
  backupDatabaseToDrive,
  listDriveFiles,
  deleteDriveFile,
  getLinkedSpreadsheetId,
  saveLinkedSpreadsheetId,
  getLinkedDriveFolderId,
  saveLinkedDriveFolderId,
  OFFICIAL_TARGET_DRIVE_FOLDER_ID,
  OFFICIAL_TARGET_DRIVE_FOLDER_URL,
  DriveFileInfo,
  SpreadsheetInfo
} from '../services/googleWorkspace';
import { getAccessToken } from '../services/googleAuth';

interface GoogleWorkspacePanelProps {
  suratMasukList: SuratMasuk[];
  suratKeluarList: SuratKeluar[];
  telegramList: WartaTelegram[];
  onUpdateData: (data: { suratMasuk?: SuratMasuk[]; suratKeluar?: SuratKeluar[]; telegram?: WartaTelegram[] }) => void;
  onClearAllData: () => void;
  googleUser: { displayName: string | null; email: string | null; photoURL: string | null } | null;
  onGoogleSignIn: () => void;
  isLoggingIn: boolean;
  autoSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime?: string | null;
  isAutoSyncEnabled?: boolean;
  onToggleAutoSync?: (enabled: boolean) => void;
}

export const GoogleWorkspacePanel: React.FC<GoogleWorkspacePanelProps> = ({
  suratMasukList,
  suratKeluarList,
  telegramList,
  onUpdateData,
  onClearAllData,
  googleUser,
  onGoogleSignIn,
  isLoggingIn,
  autoSyncStatus = 'idle',
  lastSyncTime,
  isAutoSyncEnabled = true,
  onToggleAutoSync
}) => {
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(getLinkedDriveFolderId());
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Custom Confirmation Modal state for destructive actions (Workspace skill mandate)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Lanjutkan',
    isDestructive: false,
    onConfirm: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-discover or initialize spreadsheet on login
  useEffect(() => {
    const initWorkspace = async () => {
      if (!googleUser) return;
      const token = await getAccessToken();
      if (!token) return;

      try {
        setIsLoading(true);
        // 1. Check existing saved ID or search Drive
        const savedId = getLinkedSpreadsheetId();
        if (savedId) {
          setSpreadsheetInfo({
            id: savedId,
            name: 'SIMONAS - Buku Agenda Naskah Dinas (Real)',
            webViewLink: `https://docs.google.com/spreadsheets/d/${savedId}/edit`
          });
        } else {
          const found = await findExistingSpreadsheet(token);
          if (found) {
            setSpreadsheetInfo(found);
            saveLinkedSpreadsheetId(found.id);
          }
        }

        // 2. Discover or create Drive folder
        const folder = await findOrCreateDriveFolder(token);
        if (folder) {
          setDriveFolderId(folder.id);
          saveLinkedDriveFolderId(folder.id);
          const files = await listDriveFiles(token, folder.id);
          setDriveFiles(files);
        }
      } catch (err: any) {
        console.warn('Workspace discovery warning:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initWorkspace();
  }, [googleUser]);

  const handleCreateSpreadsheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      onGoogleSignIn();
      return;
    }

    try {
      setIsLoading(true);
      const created = await createSIMONASSpreadsheet(token);
      setSpreadsheetInfo(created);
      setStatusMessage({
        text: 'Google Spreadsheet SIMONAS berhasil dibuat di akun Google Anda!',
        type: 'success'
      });
      // Immediately sync current data
      await syncDataToGoogleSheets(token, created.id, {
        suratMasuk: suratMasukList,
        suratKeluar: suratKeluarList,
        telegram: telegramList
      });
    } catch (err: any) {
      setStatusMessage({
        text: 'Gagal membuat Google Spreadsheet: ' + err.message,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToSheets = async () => {
    const token = await getAccessToken();
    if (!token) {
      onGoogleSignIn();
      return;
    }

    if (!spreadsheetInfo) {
      await handleCreateSpreadsheet();
      return;
    }

    // MANDATORY confirmation dialog before mutating Google Sheets
    setConfirmDialog({
      isOpen: true,
      title: 'Perbarui Data di Google Spreadsheet?',
      description: `Operasi ini akan memperbarui tab 'Agenda Surat Masuk' (${suratMasukList.length} data), 'Agenda Surat Keluar' (${suratKeluarList.length} data), dan 'Agenda Telegram' (${telegramList.length} data) di Google Spreadsheet Anda. Data lama di baris tabel spreadsheet akan disinkronkan sesuai data riil terkini.`,
      confirmText: 'Sinkronkan Sekarang',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          setIsLoading(true);
          const res = await syncDataToGoogleSheets(token, spreadsheetInfo.id, {
            suratMasuk: suratMasukList,
            suratKeluar: suratKeluarList,
            telegram: telegramList
          });
          setStatusMessage({ text: res.message, type: 'success' });
        } catch (err: any) {
          setStatusMessage({ text: 'Sinkronisasi gagal: ' + err.message, type: 'error' });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handlePullFromSheets = async () => {
    const token = await getAccessToken();
    if (!token || !spreadsheetInfo) {
      onGoogleSignIn();
      return;
    }

    // MANDATORY confirmation dialog before overwriting local state
    setConfirmDialog({
      isOpen: true,
      title: 'Tarik Data dari Google Spreadsheet?',
      description: 'Data naskah dinas riil yang tercatat di Google Spreadsheet akan dimuat ke dalam aplikasi SIMONAS.',
      confirmText: 'Muat Data Spreadsheet',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          setIsLoading(true);
          const data = await pullDataFromGoogleSheets(token, spreadsheetInfo.id);
          onUpdateData(data);
          setStatusMessage({
            text: `Berhasil memuat ${data.suratMasuk.length} Surat Masuk, ${data.suratKeluar.length} Surat Keluar, dan ${data.telegram.length} Telegram dari Google Spreadsheet!`,
            type: 'success'
          });
        } catch (err: any) {
          setStatusMessage({ text: 'Gagal menarik data: ' + err.message, type: 'error' });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleBackupToDrive = async () => {
    const token = await getAccessToken();
    if (!token) {
      onGoogleSignIn();
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Cadangkan Basis Data ke Google Drive?',
      description: `Aplikasi akan membuat berkas arsip JSON cadangan lengkap di folder Google Drive 'SIMONAS - Berkas & Lampiran Naskah Dinas'. Berisi ${suratMasukList.length} SM, ${suratKeluarList.length} SK, dan ${telegramList.length} TR.`,
      confirmText: 'Unggah Cadangan ke Drive',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          setIsLoading(true);
          const folder = await findOrCreateDriveFolder(token);
          setDriveFolderId(folder.id);
          const uploaded = await backupDatabaseToDrive(token, folder.id, {
            suratMasuk: suratMasukList,
            suratKeluar: suratKeluarList,
            telegram: telegramList
          });
          const files = await listDriveFiles(token, folder.id);
          setDriveFiles(files);
          setStatusMessage({
            text: `Berkas cadangan '${uploaded.name}' berhasil disimpan ke Google Drive!`,
            type: 'success'
          });
        } catch (err: any) {
          setStatusMessage({ text: 'Gagal mencadangkan ke Drive: ' + err.message, type: 'error' });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleUploadScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = await getAccessToken();
    if (!token) {
      onGoogleSignIn();
      return;
    }

    try {
      setIsLoading(true);
      const folder = await findOrCreateDriveFolder(token);
      setDriveFolderId(folder.id);
      const uploaded = await uploadFileToDrive(token, folder.id, file, file.name, file.type || 'application/pdf');
      const files = await listDriveFiles(token, folder.id);
      setDriveFiles(files);
      setStatusMessage({
        text: `Berkas '${uploaded.name}' berhasil diunggah ke Google Drive!`,
        type: 'success'
      });
    } catch (err: any) {
      setStatusMessage({ text: 'Gagal mengunggah berkas: ' + err.message, type: 'error' });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDriveFile = async (file: DriveFileInfo) => {
    const token = await getAccessToken();
    if (!token) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Berkas dari Google Drive?',
      description: `Apakah Anda yakin ingin menghapus berkas '${file.name}' dari Google Drive? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Berkas',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          setIsLoading(true);
          await deleteDriveFile(token, file.id);
          if (driveFolderId) {
            const files = await listDriveFiles(token, driveFolderId);
            setDriveFiles(files);
          }
          setStatusMessage({ text: `Berkas '${file.name}' berhasil dihapus dari Drive.`, type: 'info' });
        } catch (err: any) {
          setStatusMessage({ text: 'Gagal menghapus berkas: ' + err.message, type: 'error' });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleConfirmClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan Seluruh Data Lokal (Mulai Riil)?',
      description: 'Seluruh catatan lokal surat masuk, keluar, dan telegram akan dikosongkan (0 berkas) agar siap digunakan untuk mencatat dokumen nyata. Anda tetap dapat menyimpan atau menyinkronkannya kembali dari Google Sheets.',
      confirmText: 'Ya, Kosongkan Semua',
      isDestructive: true,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        onClearAllData();
        setStatusMessage({ text: 'Basis data lokal telah dikosongkan. Siap digunakan untuk input data nyata!', type: 'info' });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* STATUS BANNER */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : statusMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-[11px] underline ml-3 cursor-pointer opacity-70 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* GOOGLE ACCOUNT CONNECTION CARD */}
      <div className="bg-gradient-to-r from-[#0f1e36] to-[#1e3a5f] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {googleUser?.photoURL ? (
              <img 
                src={googleUser.photoURL} 
                alt="Google User" 
                className="w-14 h-14 rounded-2xl border-2 border-emerald-400 shadow-md object-cover" 
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <svg className="w-8 h-8" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold">
                  {googleUser ? googleUser.displayName || 'Akun Google Terhubung' : 'Integrasi Google Workspace Resmi'}
                </h2>
                {googleUser && (
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1 ${
                    googleUser.email === 'admstaf76@gmail.com'
                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    {googleUser.email === 'admstaf76@gmail.com' ? 'admstaf76 Terverifikasi' : 'Aktif'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#b8c7e6] mt-0.5 font-mono">
                {googleUser ? (
                  <span>Akun Aktif: <strong>{googleUser.email}</strong></span>
                ) : (
                  <span>Target Akun Resmi: <strong>admstaf76@gmail.com</strong> (Google Drive &amp; Google Spreadsheet)</span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-[#adc8f5]">
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  Google Spreadsheet (Auto-Update Realtime)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-blue-300" />
                  Google Drive (admstaf76@gmail.com)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!googleUser ? (
              <button
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                type="button"
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white text-[#0f1e36] text-xs font-bold hover:bg-[#e2e7ff] transition-all transform hover:scale-105 active:scale-95 shadow-md cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Memproses Masuk...' : 'Masuk admstaf76@gmail.com'}</span>
              </button>
            ) : (
              <button
                onClick={handleConfirmClearAll}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
                title="Kosongkan data lokal agar bersih untuk penginputan naskah baru"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Bersihkan Data Lokal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: GOOGLE SPREADSHEET SYNC HUB */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#dae2fd] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dae2fd]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#131b2e] flex items-center gap-2">
                <span>Google Spreadsheet - Buku Agenda Terpadu</span>
                {spreadsheetInfo && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Tersambung
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#44474d] mt-0.5">
                Mencatat dan menyinkronkan seluruh naskah dinas riil ke dalam 3 lembar kerja otomatis (Surat Masuk, Surat Keluar, Telegram).
              </p>
            </div>
          </div>

          {spreadsheetInfo?.webViewLink && (
            <a
              href={spreadsheetInfo.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              <span>Buka di Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* AUTO-SYNC REALTIME LIVE BANNER */}
        <div className="p-3.5 rounded-xl bg-[#e2e7ff]/70 border border-[#b5d0fd] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0 mt-1 sm:mt-0"></span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0f1e36]">Sinkronisasi Otomatis Google Spreadsheet:</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] border border-emerald-300">
                  {isAutoSyncEnabled ? 'AKTIF (REAL-TIME)' : 'NONAKTIF'}
                </span>
              </div>
              <p className="text-[11px] text-[#44474d] mt-0.5">
                Setiap kali Anda menambah, mengedit, atau menghapus naskah (Surat Masuk, Surat Keluar, Warta Telegram), Google Spreadsheet akan terupdate otomatis secara real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {lastSyncTime && (
              <span className="text-[10px] font-mono text-[#0f1e36] bg-white px-2.5 py-1 rounded-lg border border-[#dae2fd]">
                Terakhir: {lastSyncTime}
              </span>
            )}
            {onToggleAutoSync && (
              <button
                type="button"
                onClick={() => onToggleAutoSync(!isAutoSyncEnabled)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  isAutoSyncEnabled 
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Auto-Update: {isAutoSyncEnabled ? 'ON' : 'OFF'}
              </button>
            )}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#faf8ff] border border-[#dae2fd] space-y-2">
            <div className="text-xs font-bold text-[#131b2e] flex items-center justify-between">
              <span>Status Dokumen Real</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                100% Real Data
              </span>
            </div>
            <div className="space-y-1 text-xs text-[#44474d]">
              <div className="flex justify-between">
                <span>Surat Masuk:</span>
                <span className="font-mono font-bold text-[#0f1e36]">{suratMasukList.length} naskah</span>
              </div>
              <div className="flex justify-between">
                <span>Surat Keluar:</span>
                <span className="font-mono font-bold text-[#0f1e36]">{suratKeluarList.length} naskah</span>
              </div>
              <div className="flex justify-between">
                <span>Warta Telegram:</span>
                <span className="font-mono font-bold text-[#0f1e36]">{telegramList.length} warta</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#faf8ff] border border-[#dae2fd] space-y-2 md:col-span-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#131b2e]">Operasi Sinkronisasi Spreadsheet</span>
              <p className="text-[11px] text-[#75777e] mt-0.5">
                {spreadsheetInfo 
                  ? `Spreadsheet ID: ${spreadsheetInfo.id}` 
                  : 'Belum ada Spreadsheet terhubung. Klik tombol di bawah untuk membuat secara otomatis.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {!spreadsheetInfo ? (
                <button
                  onClick={handleCreateSpreadsheet}
                  disabled={isLoading}
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f1e36] hover:bg-[#1e3a5f] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Buat Spreadsheet SIMONAS Baru</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSyncToSheets}
                    disabled={isLoading}
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f1e36] hover:bg-[#1e3a5f] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    title="Kirim data dari aplikasi ke Google Spreadsheet"
                  >
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span>Sinkronkan ke Google Sheets</span>
                  </button>

                  <button
                    onClick={handlePullFromSheets}
                    disabled={isLoading}
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0f1e36] text-xs font-bold border border-[#dae2fd] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Tarik data dari Google Spreadsheet ke aplikasi"
                  >
                    <DownloadCloud className="w-4 h-4 text-[#455f87]" />
                    <span>Muat dari Google Sheets</span>
                  </button>

                  <button
                    onClick={handleCreateSpreadsheet}
                    disabled={isLoading}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#44474d] text-xs font-semibold transition-colors cursor-pointer"
                    title="Buat ulang lembar kerja spreadsheet baru"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Perbarui Tautan</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: GOOGLE DRIVE STORAGE & BACKUP VAULT */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#dae2fd] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dae2fd]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#131b2e] flex items-center gap-2">
                <span>Google Drive - Vault Berkas &amp; Cadangan</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  Folder Kedinasan Resmi
                </span>
              </h3>
              <p className="text-xs text-[#44474d] mt-0.5">
                Simpan scan dokumen resmi, lampiran naskah dinas, dan berkas cadangan langsung ke Google Drive.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadScanFile}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !googleUser}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#0f1e36] text-xs font-bold border border-[#dae2fd] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
              <span>Unggah Berkas ke Drive</span>
            </button>

            <button
              onClick={handleBackupToDrive}
              disabled={isLoading || !googleUser}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0f1e36] hover:bg-[#1e3a5f] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cadangkan Database ke Drive</span>
            </button>
          </div>
        </div>

        {/* OFFICIAL TARGET DRIVE FOLDER INFO BANNER */}
        <div className="bg-gradient-to-r from-blue-50/80 to-slate-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-[#0f1e36]">Lokasi Penyimpanan Google Drive Terintegrasi:</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-900 font-bold">
                ID: {OFFICIAL_TARGET_DRIVE_FOLDER_ID}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono truncate max-w-xl">
              {OFFICIAL_TARGET_DRIVE_FOLDER_URL}
            </p>
          </div>

          <a
            href={OFFICIAL_TARGET_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all transform hover:scale-105 active:scale-95 shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Folder di Google Drive</span>
          </a>
        </div>

        {/* DRIVE FILES LIST */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#44474d]">
            <span>Berkas Tersimpan di Folder Drive ({driveFiles.length})</span>
            {driveFiles.length > 0 && (
              <span className="text-[11px] font-normal text-[#75777e]">
                Disinkronkan secara aman dengan Google Drive API
              </span>
            )}
          </div>

          {driveFiles.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#faf8ff] border border-dashed border-[#dae2fd] text-xs text-[#75777e]">
              <HardDrive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-[#131b2e]">Belum ada berkas lampiran yang diunggah ke Google Drive</p>
              <p className="mt-1">Gunakan tombol di atas untuk mengunggah scan surat atau membuat cadangan database.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {driveFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="p-3 rounded-xl bg-[#faf8ff] hover:bg-white border border-[#dae2fd] shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="text-xs font-bold text-[#131b2e] truncate" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-[10px] text-[#75777e] font-mono">
                        {file.createdTime ? new Date(file.createdTime).toLocaleDateString('id-ID') : 'Drive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Buka berkas di Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteDriveFile(file)}
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus berkas dari Google Drive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE / MUTATING WORKSPACE OPERATIONS */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-[#000412]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#dae2fd] p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmDialog.isDestructive ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {confirmDialog.isDestructive ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <h3 className="font-heading font-bold text-base text-[#131b2e]">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-[#44474d] leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#dae2fd]">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#44474d] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                  confirmDialog.isDestructive 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-[#0f1e36] hover:bg-[#1e3a5f]'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
