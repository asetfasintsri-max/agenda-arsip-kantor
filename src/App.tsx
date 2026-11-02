/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { ActivePage, Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AgendaSuratView } from './components/AgendaSuratView';
import { SuratMasukView } from './components/SuratMasukView';
import { SuratKeluarView } from './components/SuratKeluarView';
import { TelegramView } from './components/TelegramView';
import { DisposisiMonitoringView } from './components/DisposisiMonitoringView';
import { RekapitulasiView } from './components/RekapitulasiView';
import { DatabaseSettingsView } from './components/DatabaseSettingsView';
import { OcrProcessingModalHub } from './components/OcrProcessingModalHub';
import { ForensicMagnifierModal } from './components/ForensicMagnifierModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { 
  loadSuratKeluar, 
  loadSuratMasuk, 
  loadTelegram, 
  resetAllDataToDefault, 
  saveSuratKeluar, 
  saveSuratMasuk, 
  saveTelegram 
} from './data/initialData';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken 
} from './services/googleAuth';
import { 
  findExistingSpreadsheet, 
  createSIMONASSpreadsheet, 
  syncDataToGoogleSheets, 
  getLinkedSpreadsheetId, 
  saveLinkedSpreadsheetId 
} from './services/googleWorkspace';
import { SuratKeluar, SuratMasuk, WartaTelegram } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [history, setHistory] = useState<ActivePage[]>(['dashboard']);
  const [userRole, setUserRole] = useState<string>('Staf 3 / Admin');
  
  // Data state (clean, real input mode)
  const [suratMasukList, setSuratMasukList] = useState<SuratMasuk[]>(() => loadSuratMasuk());
  const [suratKeluarList, setSuratKeluarList] = useState<SuratKeluar[]>(() => loadSuratKeluar());
  const [telegramList, setTelegramList] = useState<WartaTelegram[]>(() => loadTelegram());

  // Google Workspace auth & sync state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [linkedSpreadsheetId, setLinkedSpreadsheetId] = useState<string | null>(getLinkedSpreadsheetId());

  // Realtime Automatic Synchronization State
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('simonas_autosync_enabled') !== 'false';
  });
  const [autoSyncStatus, setAutoSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('simonas_last_sync_time') || null;
  });

  // Modal states
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [selectedSuratForOcr, setSelectedSuratForOcr] = useState<SuratMasuk | undefined>(undefined);
  
  const [isForensicOpen, setIsForensicOpen] = useState<boolean>(false);
  const [selectedSuratForForensic, setSelectedSuratForForensic] = useState<SuratMasuk | undefined>(undefined);

  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState<boolean>(false);

  // Sidebar auto-hide / pin states
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);

  const isInitialMount = useRef(true);

  // Save auto-sync preference
  useEffect(() => {
    localStorage.setItem('simonas_autosync_enabled', String(isAutoSyncEnabled));
  }, [isAutoSyncEnabled]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      const res = await googleSignIn();
      setGoogleUser(res.user);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      alert('Gagal menghubungkan Akun Google: ' + (err.message || 'Error otentikasi'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setAutoSyncStatus('idle');
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Core Sync Worker
  const executeSync = useCallback(async (isSilent = false) => {
    const token = await getAccessToken();
    if (!token) {
      if (!isSilent) await handleGoogleSignIn();
      return;
    }

    try {
      setAutoSyncStatus('syncing');
      let sheetId = linkedSpreadsheetId;
      if (!sheetId) {
        const found = await findExistingSpreadsheet(token);
        if (found) {
          sheetId = found.id;
        } else {
          const created = await createSIMONASSpreadsheet(token);
          sheetId = created.id;
        }
        setLinkedSpreadsheetId(sheetId);
        saveLinkedSpreadsheetId(sheetId);
      }

      const res = await syncDataToGoogleSheets(token, sheetId, {
        suratMasuk: suratMasukList,
        suratKeluar: suratKeluarList,
        telegram: telegramList
      });

      const timeStr = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date());

      setAutoSyncStatus('synced');
      setLastSyncTime(timeStr);
      localStorage.setItem('simonas_last_sync_time', timeStr);

      if (!isSilent) {
        alert(res.message);
      }
    } catch (err: any) {
      console.error('Sync failed:', err);
      setAutoSyncStatus('error');
      if (!isSilent) {
        alert('Gagal menyinkronkan ke Google Sheets: ' + (err.message || 'Koneksi terputus'));
      }
    }
  }, [linkedSpreadsheetId, suratMasukList, suratKeluarList, telegramList]);

  // Realtime Automatic Sync with Debounce (1500ms) on data changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!googleUser || !isAutoSyncEnabled) {
      return;
    }

    setAutoSyncStatus('syncing');
    const timer = setTimeout(() => {
      executeSync(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [suratMasukList, suratKeluarList, telegramList, googleUser, isAutoSyncEnabled, executeSync]);

  const handleQuickSyncSheets = async () => {
    await executeSync(false);
  };

  const handleNavigate = (page: ActivePage) => {
    if (page === activePage) return;
    setHistory((prev) => [...prev, page]);
    setActivePage(page);
  };

  const handleBack = () => {
    if (history.length > 1) {
      const nextHistory = [...history];
      nextHistory.pop(); // remove current page
      const previousPage = nextHistory[nextHistory.length - 1];
      setHistory(nextHistory);
      setActivePage(previousPage);
    } else {
      setActivePage('dashboard');
    }
  };

  const handleHome = () => {
    setHistory(['dashboard']);
    setActivePage('dashboard');
  };

  // Sync to localStorage
  useEffect(() => {
    saveSuratMasuk(suratMasukList);
  }, [suratMasukList]);

  useEffect(() => {
    saveSuratKeluar(suratKeluarList);
  }, [suratKeluarList]);

  useEffect(() => {
    saveTelegram(telegramList);
  }, [telegramList]);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [ocrInitialViewMode, setOcrInitialViewMode] = useState<'ocr' | 'print' | 'split'>('ocr');

  const handleOpenOcrModal = (surat?: SuratMasuk, mode: 'ocr' | 'print' | 'split' = 'ocr') => {
    setSelectedSuratForOcr(surat || suratMasukList[0]);
    setOcrInitialViewMode(mode);
    setIsOcrOpen(true);
  };

  const handleOpenForensicModal = (surat: SuratMasuk) => {
    setSelectedSuratForForensic(surat);
    setIsForensicOpen(true);
  };

  const handleSaveSuratMasuk = (savedSurat: SuratMasuk) => {
    setSuratMasukList((prev) => {
      const idx = prev.findIndex((s) => s.id === savedSurat.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedSurat;
        return next;
      }
      return [savedSurat, ...prev];
    });
  };

  const handleDeleteSuratMasuk = (id: string) => {
    setSuratMasukList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveSuratKeluar = (savedSK: SuratKeluar) => {
    setSuratKeluarList((prev) => {
      const idx = prev.findIndex((s) => s.id === savedSK.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedSK;
        return next;
      }
      return [savedSK, ...prev];
    });
  };

  const handleDeleteSuratKeluar = (id: string) => {
    setSuratKeluarList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveTelegram = (savedTR: WartaTelegram) => {
    setTelegramList((prev) => {
      const idx = prev.findIndex((t) => t.id === savedTR.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedTR;
        return next;
      }
      return [savedTR, ...prev];
    });
  };

  const handleDeleteTelegram = (id: string) => {
    setTelegramList((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCommitForensicCorrection = (updatedSurat: SuratMasuk) => {
    handleSaveSuratMasuk(updatedSurat);
  };

  const handleImportData = (data: { suratMasuk?: SuratMasuk[]; suratKeluar?: SuratKeluar[]; telegram?: WartaTelegram[] }) => {
    if (data.suratMasuk && Array.isArray(data.suratMasuk)) {
      setSuratMasukList(data.suratMasuk);
    }
    if (data.suratKeluar && Array.isArray(data.suratKeluar)) {
      setSuratKeluarList(data.suratKeluar);
    }
    if (data.telegram && Array.isArray(data.telegram)) {
      setTelegramList(data.telegram);
    }
  };

  const handleResetData = () => {
    resetAllDataToDefault();
    setSuratMasukList([]);
    setSuratKeluarList([]);
    setTelegramList([]);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col font-sans">
      {/* Primary Left Navigation Rail */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          if (page === 'ocr-scanner') {
            handleOpenOcrModal();
          } else {
            handleNavigate(page);
          }
          if (!isSidebarPinned) {
            setIsSidebarHovered(false);
          }
        }}
        suratMasukCount={suratMasukList.length}
        suratKeluarCount={suratKeluarList.length}
        telegramCount={telegramList.length}
        isPinned={isSidebarPinned}
        onTogglePin={() => setIsSidebarPinned((prev) => !prev)}
        isHovered={isSidebarHovered}
        onHoverChange={setIsSidebarHovered}
      />

      {/* Main Content Area */}
      <div className={`${isSidebarPinned ? 'lg:pl-72 xl:pl-80' : 'pl-0 sm:pl-2'} transition-all duration-300 flex-1 flex flex-col min-w-0`}>
        {/* Fixed Top Bar with Google Workspace Sign-In & Status */}
        <Header
          activePage={activePage}
          onNavigate={handleNavigate}
          onBack={handleBack}
          onHome={handleHome}
          canGoBack={history.length > 1}
          onOpenSearch={() => setIsQuickSearchOpen(true)}
          userRole={userRole}
          onSelectRole={(r) => setUserRole(r)}
          isSidebarPinned={isSidebarPinned}
          onToggleSidebar={() => {
            if (isSidebarPinned) {
              setIsSidebarPinned(false);
              setIsSidebarHovered(false);
            } else {
              setIsSidebarHovered((prev) => !prev);
            }
          }}
          onHoverSidebar={setIsSidebarHovered}
          googleUser={googleUser}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          isLoggingIn={isLoggingIn}
          linkedSpreadsheetId={linkedSpreadsheetId}
          autoSyncStatus={autoSyncStatus}
          lastSyncTime={lastSyncTime}
        />

        {/* Viewport Content */}
        <main className="flex-1 pt-18 sm:pt-20 px-2.5 sm:px-6 lg:px-8 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {activePage === 'dashboard' && (
            <DashboardView
              suratMasukList={suratMasukList}
              suratKeluarList={suratKeluarList}
              telegramList={telegramList}
              onNavigate={handleNavigate}
              onOpenOcr={handleOpenOcrModal}
              onOpenForensic={handleOpenForensicModal}
              onSaveSuratMasuk={handleSaveSuratMasuk}
              onDeleteSuratMasuk={handleDeleteSuratMasuk}
              onSaveSuratKeluar={handleSaveSuratKeluar}
              onDeleteSuratKeluar={handleDeleteSuratKeluar}
              onSaveTelegram={handleSaveTelegram}
              onDeleteTelegram={handleDeleteTelegram}
            />
          )}

          {(activePage === 'agenda-surat' || activePage === 'surat-masuk' || activePage === 'surat-keluar') && (
            <AgendaSuratView
              suratMasukList={suratMasukList}
              suratKeluarList={suratKeluarList}
              telegramList={telegramList}
              onOpenOcr={handleOpenOcrModal}
              onOpenForensic={handleOpenForensicModal}
              onSaveSuratMasuk={handleSaveSuratMasuk}
              onDeleteSuratMasuk={handleDeleteSuratMasuk}
              onSaveSuratKeluar={handleSaveSuratKeluar}
              onDeleteSuratKeluar={handleDeleteSuratKeluar}
              onBack={handleBack}
              onHome={handleHome}
              onSyncSheets={handleQuickSyncSheets}
              onImportData={handleImportData}
              googleUser={googleUser}
              linkedSpreadsheetId={linkedSpreadsheetId}
            />
          )}

          {activePage === 'telegram' && (
            <TelegramView
              telegramList={telegramList}
              onAddTelegram={handleSaveTelegram}
              onSaveTelegram={handleSaveTelegram}
              onDeleteTelegram={handleDeleteTelegram}
              onSyncSheets={handleQuickSyncSheets}
            />
          )}

          {activePage === 'disposisi' && (
            <DisposisiMonitoringView
              suratMasukList={suratMasukList}
              onOpenOcr={handleOpenOcrModal}
              onOpenForensic={handleOpenForensicModal}
            />
          )}

          {activePage === 'rekapitulasi' && (
            <RekapitulasiView 
              suratMasukList={suratMasukList} 
              suratKeluarList={suratKeluarList}
              telegramList={telegramList}
              onBack={handleBack}
              onHome={handleHome}
            />
          )}

          {activePage === 'database' && (
            <DatabaseSettingsView
              suratMasukList={suratMasukList}
              suratKeluarList={suratKeluarList}
              telegramList={telegramList}
              onImportData={handleImportData}
              onResetData={handleResetData}
              googleUser={googleUser}
              onGoogleSignIn={handleGoogleSignIn}
              isLoggingIn={isLoggingIn}
              autoSyncStatus={autoSyncStatus}
              lastSyncTime={lastSyncTime}
              isAutoSyncEnabled={isAutoSyncEnabled}
              onToggleAutoSync={setIsAutoSyncEnabled}
            />
          )}
        </main>
      </div>

      {/* DUAL-VIEW OCR & LEMBAR DISPOSISI PRINT MODAL HUB */}
      {isOcrOpen && (
        <OcrProcessingModalHub
          isOpen={isOcrOpen}
          initialViewMode={ocrInitialViewMode}
          onClose={() => {
            setIsOcrOpen(false);
            setSelectedSuratForOcr(undefined);
            setOcrInitialViewMode('ocr');
          }}
          initialSurat={selectedSuratForOcr}
          onSaveSurat={handleSaveSuratMasuk}
          existingSurats={suratMasukList}
          onOpenForensic={(surat) => {
            setIsOcrOpen(false);
            handleOpenForensicModal(surat);
          }}
        />
      )}

      {/* FORENSIC MAGNIFIER & HUMAN-IN-THE-LOOP INK VERIFIER */}
      {isForensicOpen && selectedSuratForForensic && (
        <ForensicMagnifierModal
          isOpen={isForensicOpen}
          onClose={() => {
            setIsForensicOpen(false);
            setSelectedSuratForForensic(undefined);
          }}
          surat={selectedSuratForForensic}
          onCommitCorrection={handleCommitForensicCorrection}
        />
      )}

      {/* GLOBAL CTRL+K FAST SEARCH MODAL */}
      {isQuickSearchOpen && (
        <QuickSearchModal
          isOpen={isQuickSearchOpen}
          onClose={() => setIsQuickSearchOpen(false)}
          suratMasukList={suratMasukList}
          suratKeluarList={suratKeluarList}
          telegramList={telegramList}
          onSelectSuratMasuk={(sm) => {
            setActivePage('agenda-surat');
            handleOpenOcrModal(sm);
          }}
          onSelectSuratKeluar={() => {
            setActivePage('agenda-surat');
          }}
          onSelectTelegram={() => {
            setActivePage('telegram');
          }}
        />
      )}
    </div>
  );
}
