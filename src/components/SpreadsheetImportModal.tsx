/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  ArrowRight, 
  Check, 
  Inbox, 
  Send, 
  Radio, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  Upload, 
  Clipboard, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { SuratMasuk, SuratKeluar, WartaTelegram } from '../types';
import { getAccessToken } from '../services/googleAuth';

interface SpreadsheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted: (imported: {
    suratMasuk: SuratMasuk[];
    suratKeluar: SuratKeluar[];
    telegram: WartaTelegram[];
  }) => void;
  linkedSpreadsheetId?: string | null;
  googleUser?: { displayName: string | null; email: string | null } | null;
}

type ClassificationType = 'masuk' | 'keluar' | 'telegram' | 'skip';

interface ParsedRowItem {
  id: string;
  originalIndex: number;
  rawColumns: string[];
  classification: ClassificationType;
  noAgenda: string;
  noSurat: string;
  tglSurat: string;
  tglTerimaAtauKirim: string;
  asalAtauTujuan: string;
  perihal: string;
  ringkasan: string;
  klasifikasi: string;
  derajat: string;
  status: string;
}

export const SpreadsheetImportModal: React.FC<SpreadsheetImportModalProps> = ({
  isOpen,
  onClose,
  onImportCompleted,
  linkedSpreadsheetId,
  googleUser
}) => {
  const [activeStep, setActiveStep] = useState<'input' | 'classify' | 'review'>('input');
  const [inputMethod, setInputMethod] = useState<'paste' | 'sheets_api' | 'file'>('paste');
  const [pastedText, setPastedText] = useState<string>('');
  const [customSheetUrlOrId, setCustomSheetUrlOrId] = useState<string>(linkedSpreadsheetId || '');
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [headerRowIndex, setHeaderRowIndex] = useState<number>(0);
  const [hasHeader, setHasHeader] = useState<boolean>(true);

  // Column mapping indices (-1 means unmapped)
  const [colMap, setColMap] = useState<{
    noAgenda: number;
    noSurat: number;
    tglSurat: number;
    tglTerimaAtauKirim: number;
    asalAtauTujuan: number;
    perihal: number;
    ringkasan: number;
    klasifikasi: number;
  }>({
    noAgenda: 0,
    noSurat: 1,
    tglSurat: 2,
    tglTerimaAtauKirim: 3,
    asalAtauTujuan: 4,
    perihal: 5,
    ringkasan: 6,
    klasifikasi: 7,
  });

  const [rawTableRows, setRawTableRows] = useState<string[][]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRowItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'masuk' | 'keluar' | 'telegram' | 'skip'>('all');

  const fileInputId = useId();

  if (!isOpen) return null;

  // Simple parser for TSV (from Google Sheets copy-paste) or CSV
  const parseDelimitedText = (text: string): string[][] => {
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    return lines.map(line => {
      if (line.includes('\t')) {
        return line.split('\t').map(c => c.trim());
      }
      // Simple CSV split (handling quotes if basic)
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (matches && matches.length > 1) {
        return matches.map(c => c.replace(/^"|"$/g, '').trim());
      }
      return line.split(',').map(c => c.trim());
    });
  };

  const autoDetectColumnMapping = (headerCols: string[]) => {
    const newMap = { ...colMap };
    headerCols.forEach((col, idx) => {
      const lower = col.toLowerCase();
      if (lower.includes('agenda') || lower.includes('no. urut') || lower.includes('urut')) {
        newMap.noAgenda = idx;
      } else if (lower.includes('nomor') || lower.includes('no surat') || lower.includes('naskah')) {
        newMap.noSurat = idx;
      } else if (lower.includes('tgl surat') || lower.includes('tanggal surat')) {
        newMap.tglSurat = idx;
      } else if (lower.includes('terima') || lower.includes('kirim') || lower.includes('tgl terima')) {
        newMap.tglTerimaAtauKirim = idx;
      } else if (lower.includes('asal') || lower.includes('instansi') || lower.includes('tujuan') || lower.includes('pengirim') || lower.includes('kepada')) {
        newMap.asalAtauTujuan = idx;
      } else if (lower.includes('perihal') || lower.includes('hal') || lower.includes('judul')) {
        newMap.perihal = idx;
      } else if (lower.includes('isi') || lower.includes('ringkasan') || lower.includes('abstrak')) {
        newMap.ringkasan = idx;
      } else if (lower.includes('klasifikasi') || lower.includes('derajat')) {
        newMap.klasifikasi = idx;
      }
    });
    setColMap(newMap);
  };

  const handleProcessRawData = (rows: string[][]) => {
    if (!rows || rows.length === 0) {
      alert('Tidak ada data baris yang terdeteksi. Silakan periksa kembali teks atau berkas.');
      return;
    }

    setRawTableRows(rows);

    const headers = hasHeader && rows.length > 0 ? rows[0] : [];
    if (hasHeader && headers.length > 0) {
      autoDetectColumnMapping(headers);
    }

    const dataRows = hasHeader ? rows.slice(1) : rows;

    const parsed: ParsedRowItem[] = dataRows.map((r, i) => {
      const val = (colIdx: number) => (colIdx >= 0 && colIdx < r.length ? r[colIdx] : '');
      const noSurat = val(colMap.noSurat) || val(1) || '';
      const asalTujuan = val(colMap.asalAtauTujuan) || val(4) || '';
      const perihal = val(colMap.perihal) || val(5) || val(2) || '';
      
      // Default heuristic: If contains "Kepada" or outbound signs, mark keluar, otherwise default to masuk
      let initialType: ClassificationType = 'masuk';
      const rowCombined = r.join(' ').toLowerCase();
      if (rowCombined.includes('keluar') || rowCombined.includes('dikirim ke') || rowCombined.includes('yth.')) {
        initialType = 'keluar';
      } else if (rowCombined.includes('telegram') || rowCombined.includes('tr-in') || rowCombined.includes('tr-out') || noSurat.toLowerCase().startsWith('tr/')) {
        initialType = 'telegram';
      }

      return {
        id: `import-${Date.now()}-${i}`,
        originalIndex: i + 1,
        rawColumns: r,
        classification: initialType,
        noAgenda: val(colMap.noAgenda) || `${i + 1}`,
        noSurat: noSurat || `SURAT-${i + 1}`,
        tglSurat: val(colMap.tglSurat) || new Date().toISOString().slice(0, 10),
        tglTerimaAtauKirim: val(colMap.tglTerimaAtauKirim) || new Date().toISOString().slice(0, 10),
        asalAtauTujuan: asalTujuan || 'Instansi Terkait',
        perihal: perihal || 'Penyampaian Berkas Dinas',
        ringkasan: val(colMap.ringkasan) || perihal || '',
        klasifikasi: val(colMap.klasifikasi) || 'Biasa',
        derajat: 'Biasa',
        status: 'Registrasi Baru'
      };
    });

    setParsedRows(parsed);
    setActiveStep('classify');
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      alert('Silakan tempel teks tabel dari Google Spreadsheet terlebih dahulu.');
      return;
    }
    const rows = parseDelimitedText(pastedText);
    handleProcessRawData(rows);
  };

  const handleFetchFromGoogleSheetsApi = async () => {
    let cleanId = customSheetUrlOrId.trim();
    if (cleanId.includes('/spreadsheets/d/')) {
      const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        cleanId = match[1];
      }
    }

    if (!cleanId) {
      setApiError('Harap masukkan Spreadsheet ID atau URL Google Spreadsheet yang valid.');
      return;
    }

    setIsLoadingApi(true);
    setApiError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Belum terhubung ke Akun Google. Silakan klik "Hubungkan Google" di bilah atas.');
      }

      // Fetch metadata to find available sheets
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!metaRes.ok) {
        throw new Error(`Gagal membaca Spreadsheet (${metaRes.status}). Pastikan izin akses telah diberikan untuk akun admstaf76@gmail.com.`);
      }

      const meta = await metaRes.json();
      const firstSheetName = meta.sheets?.[0]?.properties?.title || 'Sheet1';

      // Fetch values from first sheet or A1:Z500
      const range = `${encodeURIComponent(firstSheetName)}!A1:Z500`;
      const valRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!valRes.ok) {
        throw new Error(`Gagal mengambil baris nilai dari lembar ${firstSheetName}.`);
      }

      const valData = await valRes.json();
      const rows: string[][] = valData.values || [];

      if (rows.length === 0) {
        throw new Error('Spreadsheet kosong atau tidak memiliki baris data.');
      }

      handleProcessRawData(rows);
    } catch (err: any) {
      setApiError(err.message || 'Terjadi kesalahan saat memuat data dari Google Sheets API.');
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseDelimitedText(text);
      handleProcessRawData(rows);
    };
    reader.readAsText(file);
  };

  // Classification mutators
  const updateRowClassification = (id: string, classification: ClassificationType) => {
    setParsedRows(prev => prev.map(item => item.id === id ? { ...item, classification } : item));
  };

  const setAllClassification = (classification: ClassificationType) => {
    setParsedRows(prev => prev.map(item => ({ ...item, classification })));
  };

  const updateRowField = (id: string, field: keyof ParsedRowItem, value: any) => {
    setParsedRows(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Final Commit to App State
  const handleCommitImport = () => {
    const finalSM: SuratMasuk[] = [];
    const finalSK: SuratKeluar[] = [];
    const finalTR: WartaTelegram[] = [];

    parsedRows.forEach((r, idx) => {
      if (r.classification === 'skip') return;

      if (r.classification === 'masuk') {
        finalSM.push({
          id: `sm-imported-${Date.now()}-${idx}`,
          noAgenda: r.noAgenda || `${idx + 1}`,
          noSurat: r.noSurat,
          tglSurat: r.tglSurat,
          tglTerima: r.tglTerimaAtauKirim,
          waktuTerima: '08:30 WIB',
          asalSurat: r.asalAtauTujuan,
          perihal: r.perihal,
          ringkasan: r.ringkasan,
          klasifikasi: (r.klasifikasi as any) || 'Biasa',
          derajat: 'Biasa',
          statusDisposisi: 'Proses Koordinasi Paban IV',
          kategoriUrusan: 'renbut',
          satkerTujuan: 'Paban IV Konst Slog TNI',
          lampiranJumlah: '1 Berkas',
          lampiranList: [],
          disposisi: {
            panglima: { checkedClauses: [], catatan: '', diparaf: false },
            aslog: { checkedClauses: [], catatan: '', diparaf: false },
            waaslog: { checkedClauses: [], catatan: '', diparaf: false },
            paban: { checkedClauses: [], catatan: '', diparaf: false },
          },
          ocrAccuracy: 100,
          tglDibuat: new Date().toISOString()
        });
      } else if (r.classification === 'keluar') {
        finalSK.push({
          id: `sk-imported-${Date.now()}-${idx}`,
          noAgenda: r.noAgenda || `${idx + 1}`,
          noSurat: r.noSurat,
          tglSurat: r.tglSurat,
          tglKirim: r.tglTerimaAtauKirim,
          tujuanSurat: r.asalAtauTujuan,
          perihal: r.perihal,
          ringkasan: r.ringkasan,
          klasifikasi: (r.klasifikasi as any) || 'Biasa',
          kategoriUrusan: 'laporan',
          konseptor: 'Paban IV Konst Slog TNI',
          statusTTE: 'TTE Aslog Sah',
          lampiranJumlah: 'Nihil',
          tglDibuat: new Date().toISOString()
        });
      } else if (r.classification === 'telegram') {
        finalTR.push({
          id: `tr-imported-${Date.now()}-${idx}`,
          noTelegram: r.noSurat,
          tipe: 'TR-IN',
          tglWaktu: `${r.tglSurat} 08:00 WIB`,
          dari: r.asalAtauTujuan,
          kepada: 'Aslog Panglima TNI',
          tembusan: 'Paban IV Konst',
          klasifikasi: 'BIASA',
          derajatKeamanan: 'BIASA',
          perihal: r.perihal,
          isiBerita: r.ringkasan || r.perihal,
          status: 'Diterima',
          tglDibuat: new Date().toISOString()
        });
      }
    });

    onImportCompleted({
      suratMasuk: finalSM,
      suratKeluar: finalSK,
      telegram: finalTR
    });

    onClose();
  };

  const countMasuk = parsedRows.filter(r => r.classification === 'masuk').length;
  const countKeluar = parsedRows.filter(r => r.classification === 'keluar').length;
  const countTelegram = parsedRows.filter(r => r.classification === 'telegram').length;
  const countSkip = parsedRows.filter(r => r.classification === 'skip').length;

  const filteredDisplayRows = parsedRows.filter(r => {
    if (selectedFilter === 'all') return true;
    return r.classification === selectedFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-[#0f1e36] text-white flex items-center justify-between border-b border-[#1b2b48]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-white tracking-wide flex items-center gap-2">
                Import &amp; Klasifikasi Data dari Google Spreadsheet
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  Manual Review
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Pindahkan data baris naskah dinas dan kelompokkan menjadi Surat Masuk atau Surat Keluar secara manual sesuai instruksi kedinasan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEPPER PROGRESS */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 font-medium ${activeStep === 'input' ? 'text-[#0f1e36] font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${activeStep === 'input' ? 'bg-[#0f1e36] text-white' : 'bg-slate-200'}`}>1</span>
              <span>Input Sumber Spreadsheet</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <div className={`flex items-center gap-2 font-medium ${activeStep === 'classify' ? 'text-[#0f1e36] font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${activeStep === 'classify' ? 'bg-[#0f1e36] text-white' : 'bg-slate-200'}`}>2</span>
              <span>Pengelompokan Manual (Masuk / Keluar)</span>
            </div>
          </div>
          {parsedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {parsedRows.length} Baris Terbaca
              </span>
            </div>
          )}
        </div>

        {/* STEP 1: INPUT DATA */}
        {activeStep === 'input' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* Tab Selection */}
            <div className="flex border-b border-slate-200 gap-4">
              <button
                onClick={() => setInputMethod('paste')}
                className={`pb-2.5 px-3 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
                  inputMethod === 'paste' 
                    ? 'border-[#0f1e36] text-[#0f1e36]' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Clipboard className="w-4 h-4" />
                <span>Salin &amp; Tempel Tabel (Copy-Paste)</span>
              </button>
              <button
                onClick={() => setInputMethod('sheets_api')}
                className={`pb-2.5 px-3 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
                  inputMethod === 'sheets_api' 
                    ? 'border-[#0f1e36] text-[#0f1e36]' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tarik via Link Google Spreadsheet</span>
              </button>
              <button
                onClick={() => setInputMethod('file')}
                className={`pb-2.5 px-3 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
                  inputMethod === 'file' 
                    ? 'border-[#0f1e36] text-[#0f1e36]' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Berkas CSV / TSV</span>
              </button>
            </div>

            {/* TAB CONTENT: PASTE */}
            {inputMethod === 'paste' && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Cara Cepat:</span> Buka Google Spreadsheet Anda, pilih baris tabel yang ingin dimasukkan (misal dari kolom No, No Surat, Tanggal, Perihal), tekan <b>Ctrl + C</b> di Google Sheets, lalu tempelkan (<b>Ctrl + V</b>) ke dalam kotak teks di bawah ini.
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tempelkan Baris Data Tabel di sini:</label>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Contoh tempel dari Google Spreadsheet:\n1\tB/124/V/2026\t2026-05-12\t2026-05-13\tSlog Mabes TNI\tPermohonan Matlog Satuan\tBiasa\n2\tB/125/V/2026\t2026-05-14\t2026-05-14\tKohanudnas\tLaporan Kesiapan Fasilitas\tRahasia`}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:border-[#0f1e36] focus:ring-1 focus:ring-[#0f1e36] outline-hidden bg-slate-50"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => setHasHeader(e.target.checked)}
                      className="rounded text-[#0f1e36] focus:ring-[#0f1e36]"
                    />
                    <span>Baris pertama adalah Judul Kolom (Header)</span>
                  </label>

                  <button
                    onClick={handleParsePastedText}
                    disabled={!pastedText.trim()}
                    className="px-5 py-2.5 bg-[#0f1e36] hover:bg-[#1a3158] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                  >
                    <span>Lanjutkan ke Pengelompokan Manual</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: GOOGLE SHEETS API */}
            {inputMethod === 'sheets_api' && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Integrasi Google Sheets Langsung</span>
                  </div>
                  <p className="text-slate-600">
                    Masukkan URL lengkap Google Spreadsheet Anda atau Spreadsheet ID. Sistem akan mengambil seluruh baris data secara otomatis.
                  </p>
                  {googleUser && (
                    <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                      ✓ Terotentikasi sebagai: {googleUser.email || 'admstaf76@gmail.com'}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">URL / Spreadsheet ID:</label>
                  <input
                    type="text"
                    value={customSheetUrlOrId}
                    onChange={(e) => setCustomSheetUrlOrId(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-[#0f1e36] outline-hidden"
                  />
                </div>

                {apiError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => setHasHeader(e.target.checked)}
                      className="rounded text-[#0f1e36]"
                    />
                    <span>Baris pertama adalah Judul Kolom (Header)</span>
                  </label>

                  <button
                    onClick={handleFetchFromGoogleSheetsApi}
                    disabled={isLoadingApi || !customSheetUrlOrId.trim()}
                    className="px-5 py-2.5 bg-[#0f1e36] hover:bg-[#1a3158] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                  >
                    {isLoadingApi ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengambil Data dari Google Sheets...</span>
                      </>
                    ) : (
                      <>
                        <span>Tarik &amp; Proses Baris</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FILE UPLOAD */}
            {inputMethod === 'file' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 hover:border-[#0f1e36] rounded-2xl p-8 text-center bg-slate-50 transition-colors">
                  <input
                    type="file"
                    id={fileInputId}
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor={fileInputId} className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="font-heading font-bold text-sm text-[#0f1e36]">
                      Pilih berkas CSV atau TSV dari komputer
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Format yang didukung: .csv, .tsv (ekspor dari Google Sheets atau Excel)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CLASSIFY MANUALLY (SURAT MASUK vs SURAT KELUAR) */}
        {activeStep === 'classify' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Toolbar for Batch Classification */}
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700 mr-1">Pengelompokan Cepat:</span>
                <button
                  onClick={() => setAllClassification('masuk')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Semua Surat Masuk</span>
                </button>
                <button
                  onClick={() => setAllClassification('keluar')}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Semua Surat Keluar</span>
                </button>
                <button
                  onClick={() => setAllClassification('telegram')}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Semua Telegram</span>
                </button>
              </div>

              {/* Counts Badge */}
              <div className="flex items-center gap-2 text-xs">
                <button 
                  onClick={() => setSelectedFilter('all')}
                  className={`px-2 py-1 rounded-md font-bold transition-all ${selectedFilter === 'all' ? 'bg-[#0f1e36] text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  Semua ({parsedRows.length})
                </button>
                <button 
                  onClick={() => setSelectedFilter('masuk')}
                  className={`px-2 py-1 rounded-md font-bold transition-all ${selectedFilter === 'masuk' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}
                >
                  Surat Masuk ({countMasuk})
                </button>
                <button 
                  onClick={() => setSelectedFilter('keluar')}
                  className={`px-2 py-1 rounded-md font-bold transition-all ${selectedFilter === 'keluar' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}
                >
                  Surat Keluar ({countKeluar})
                </button>
                <button 
                  onClick={() => setSelectedFilter('telegram')}
                  className={`px-2 py-1 rounded-md font-bold transition-all ${selectedFilter === 'telegram' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 border border-purple-200'}`}
                >
                  Telegram ({countTelegram})
                </button>
                {countSkip > 0 && (
                  <button 
                    onClick={() => setSelectedFilter('skip')}
                    className={`px-2 py-1 rounded-md font-bold transition-all ${selectedFilter === 'skip' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}
                  >
                    Diabaikan ({countSkip})
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Classification Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f1e36] text-white font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">No</th>
                      <th className="py-2.5 px-3 w-56">Pengelompokan Jenis (Manual)</th>
                      <th className="py-2.5 px-3 w-40">Nomor Naskah</th>
                      <th className="py-2.5 px-3 w-28">Tanggal</th>
                      <th className="py-2.5 px-3 w-48">Asal / Tujuan</th>
                      <th className="py-2.5 px-3">Perihal / Ringkasan Isi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredDisplayRows.map((row, idx) => (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-slate-50 transition-colors ${
                          row.classification === 'skip' ? 'opacity-40 bg-slate-50' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        
                        {/* MANUAL CLASSIFIER BUTTONS */}
                        <td className="py-2 px-3">
                          <div className="inline-flex rounded-lg shadow-2xs p-0.5 bg-slate-100 border border-slate-300">
                            <button
                              type="button"
                              onClick={() => updateRowClassification(row.id, 'masuk')}
                              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                                row.classification === 'masuk'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-emerald-700'
                              }`}
                            >
                              <Inbox className="w-3 h-3" />
                              <span>Masuk</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateRowClassification(row.id, 'keluar')}
                              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                                row.classification === 'keluar'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-blue-700'
                              }`}
                            >
                              <Send className="w-3 h-3" />
                              <span>Keluar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateRowClassification(row.id, 'telegram')}
                              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                                row.classification === 'telegram'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-purple-700'
                              }`}
                            >
                              <Radio className="w-3 h-3" />
                              <span>TR</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateRowClassification(row.id, 'skip')}
                              title="Abaikan baris ini"
                              className={`px-1.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                                row.classification === 'skip'
                                  ? 'bg-slate-600 text-white'
                                  : 'text-slate-400 hover:text-red-600'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* EDITABLE ROW DATA */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.noSurat}
                            onChange={(e) => updateRowField(row.id, 'noSurat', e.target.value)}
                            className="w-full p-1 font-mono text-xs border border-transparent hover:border-slate-300 focus:border-[#0f1e36] rounded-md outline-hidden bg-transparent focus:bg-white"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.tglSurat}
                            onChange={(e) => updateRowField(row.id, 'tglSurat', e.target.value)}
                            className="w-full p-1 text-xs border border-transparent hover:border-slate-300 focus:border-[#0f1e36] rounded-md outline-hidden bg-transparent focus:bg-white"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.asalAtauTujuan}
                            onChange={(e) => updateRowField(row.id, 'asalAtauTujuan', e.target.value)}
                            className="w-full p-1 text-xs border border-transparent hover:border-slate-300 focus:border-[#0f1e36] rounded-md outline-hidden bg-transparent focus:bg-white"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.perihal}
                            onChange={(e) => updateRowField(row.id, 'perihal', e.target.value)}
                            className="w-full p-1 text-xs border border-transparent hover:border-slate-300 focus:border-[#0f1e36] rounded-md outline-hidden bg-transparent focus:bg-white font-medium text-slate-800"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {activeStep === 'classify' && (
              <button
                onClick={() => setActiveStep('input')}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Kembali ke Sumber Data
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Batal
            </button>

            {activeStep === 'classify' && (
              <button
                onClick={handleCommitImport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan {countMasuk + countKeluar + countTelegram} Naskah ke Aplikasi</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
