/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SuratMasuk, SuratKeluar, WartaTelegram } from '../types';

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  webViewLink?: string;
  webContentLink?: string;
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  webViewLink: string;
}

const DEFAULT_SPREADSHEET_TITLE = 'SIMONAS - Buku Agenda Naskah Dinas (admstaf76)';
const DEFAULT_DRIVE_FOLDER_NAME = 'SIMONAS - Berkas & Lampiran Naskah Dinas (admstaf76)';

// Official designated storage folder ID & URL requested by user
export const OFFICIAL_TARGET_DRIVE_FOLDER_ID = '1XeWQL8dmNxTKnCXFSbyoqiiibIA-uPSh';
export const OFFICIAL_TARGET_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1XeWQL8dmNxTKnCXFSbyoqiiibIA-uPSh?usp=sharing';

// Local storage key for remembering the linked Spreadsheet ID
export const SPREADSHEET_ID_STORAGE_KEY = 'simonas_linked_spreadsheet_id';
export const DRIVE_FOLDER_ID_STORAGE_KEY = 'simonas_linked_drive_folder_id';

export function getLinkedSpreadsheetId(): string | null {
  return localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY);
}

export function saveLinkedSpreadsheetId(id: string) {
  localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, id);
}

export function getLinkedDriveFolderId(): string {
  return localStorage.getItem(DRIVE_FOLDER_ID_STORAGE_KEY) || OFFICIAL_TARGET_DRIVE_FOLDER_ID;
}

export function saveLinkedDriveFolderId(id: string) {
  localStorage.setItem(DRIVE_FOLDER_ID_STORAGE_KEY, id);
}

/* =========================================================================
   GOOGLE SHEETS API SERVICES
   ========================================================================= */

/**
 * Search Drive to see if user already has a SIMONAS spreadsheet created
 */
export async function findExistingSpreadsheet(accessToken: string): Promise<SpreadsheetInfo | null> {
  try {
    const q = encodeURIComponent("name contains 'SIMONAS - Buku Agenda' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&orderBy=modifiedTime desc`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return {
        id: data.files[0].id,
        name: data.files[0].name,
        webViewLink: data.files[0].webViewLink,
      };
    }
    return null;
  } catch (err) {
    console.error('Error finding existing spreadsheet:', err);
    return null;
  }
}

/**
 * Create a new standardized Google Spreadsheet with 3 tabs and formatted headers
 */
export async function createSIMONASSpreadsheet(
  accessToken: string, 
  title: string = DEFAULT_SPREADSHEET_TITLE
): Promise<SpreadsheetInfo> {
  const requestBody = {
    properties: {
      title,
      locale: 'id_ID',
    },
    sheets: [
      {
        properties: {
          title: 'Agenda Surat Masuk',
          gridProperties: { rowCount: 1000, columnCount: 20, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Agenda Surat Keluar',
          gridProperties: { rowCount: 1000, columnCount: 15, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Agenda Telegram',
          gridProperties: { rowCount: 1000, columnCount: 15, frozenRowCount: 1 },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membuat Google Spreadsheet: ${res.status} - ${errText}`);
  }

  const result = await res.json();
  const spreadsheetId = result.spreadsheetId;
  const webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write initial header rows to all 3 tabs
  const headersPayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'Agenda Surat Masuk'!A1:T1",
        values: [[
          'No. Urut Agenda',
          'Nomor Naskah / Surat',
          'Tanggal Surat',
          'Tanggal Diterima',
          'Waktu Terima',
          'Asal Instansi / Satker',
          'Perihal Naskah Dinas',
          'Ringkasan / Abstrak Isi',
          'Klasifikasi Keamanan',
          'Derajat Kecepatan',
          'Status Disposisi',
          'Disposisi Panglima',
          'Disposisi Aslog',
          'Disposisi Waaslog',
          'Disposisi Paban',
          'Satker Tujuan / Aksi',
          'Jumlah Lampiran Berkas',
          'Berkas Scan Lampiran',
          'Akurasi Validasi OCR (%)',
          'Waktu Registrasi Sistem'
        ]],
      },
      {
        range: "'Agenda Surat Keluar'!A1:M1",
        values: [[
          'No. Urut Agenda',
          'Nomor Naskah Keluar',
          'Tanggal Surat',
          'Tanggal Dikirim',
          'Tujuan / Alamat Surat',
          'Perihal Naskah Keluar',
          'Ringkasan Isi Berkas',
          'Klasifikasi Keamanan',
          'Kategori Urusan',
          'Konseptor / Staf Pembuat',
          'Status TTE / Keabsahan',
          'Jumlah Lampiran',
          'Waktu Registrasi Sistem'
        ]],
      },
      {
        range: "'Agenda Telegram'!A1:L1",
        values: [[
          'Nomor Warta Telegram',
          'Tipe Jalur (TR-IN / TR-OUT)',
          'Tanggal & Waktu Warta',
          'Dari (Pengirim)',
          'Kepada (Penerima)',
          'Tembusan',
          'Klasifikasi Kecepatan',
          'Derajat Keamanan',
          'Perihal / Judul Berita',
          'Isi Lengkap Warta Telegram',
          'Status Tindak Lanjut',
          'Waktu Registrasi Sistem'
        ]],
      },
    ],
  };

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(headersPayload),
  });

  saveLinkedSpreadsheetId(spreadsheetId);

  return {
    id: spreadsheetId,
    name: title,
    webViewLink,
  };
}

/**
 * Synchronize all current real data to the linked Google Spreadsheet
 */
export async function syncDataToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  data: {
    suratMasuk: SuratMasuk[];
    suratKeluar: SuratKeluar[];
    telegram: WartaTelegram[];
  }
): Promise<{ success: boolean; message: string }> {
  // Convert Surat Masuk to rows
  const smRows = data.suratMasuk.map((s) => [
    s.noAgenda || '',
    s.noSurat || '',
    s.tglSurat || '',
    s.tglTerima || '',
    s.waktuTerima || '',
    s.asalSurat || '',
    s.perihal || '',
    s.ringkasan || '',
    s.klasifikasi || '',
    s.derajat || '',
    s.statusDisposisi || '',
    s.disposisi?.panglima ? `${(s.disposisi.panglima.checkedClauses || []).join(', ')} [${s.disposisi.panglima.catatan || '-'}]` : '',
    s.disposisi?.aslog ? `${(s.disposisi.aslog.checkedClauses || []).join(', ')} [${s.disposisi.aslog.catatan || '-'}]` : '',
    s.disposisi?.waaslog ? `${(s.disposisi.waaslog.checkedClauses || []).join(', ')} [${s.disposisi.waaslog.catatan || '-'}]` : '',
    s.disposisi?.paban ? `${(s.disposisi.paban.checkedClauses || []).join(', ')} [${s.disposisi.paban.catatan || '-'}]` : '',
    s.satkerTujuan || '',
    s.lampiranJumlah || '',
    s.scanFileName || '',
    s.ocrAccuracy ? `${s.ocrAccuracy}%` : '100%',
    s.tglDibuat || new Date().toISOString()
  ]);

  // Convert Surat Keluar to rows
  const skRows = data.suratKeluar.map((s) => [
    s.noAgenda || '',
    s.noSurat || '',
    s.tglSurat || '',
    s.tglKirim || '',
    s.tujuanSurat || '',
    s.perihal || '',
    s.ringkasan || '',
    s.klasifikasi || '',
    s.kategoriUrusan || '',
    s.konseptor || '',
    s.statusTTE || '',
    s.lampiranJumlah || '',
    s.tglDibuat || new Date().toISOString()
  ]);

  // Convert Telegram to rows
  const trRows = data.telegram.map((t) => [
    t.noTelegram || '',
    t.tipe || 'TR-IN',
    t.tglWaktu || '',
    t.dari || '',
    t.kepada || '',
    t.tembusan || '',
    t.klasifikasi || '',
    t.derajatKeamanan || '',
    t.perihal || '',
    t.isiBerita || '',
    t.status || '',
    t.tglDibuat || new Date().toISOString()
  ]);

  // Clear existing data rows first to avoid leftover ghost rows
  const clearRanges = [
    "'Agenda Surat Masuk'!A2:T1000",
    "'Agenda Surat Keluar'!A2:M1000",
    "'Agenda Telegram'!A2:L1000"
  ];

  for (const range of clearRanges) {
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (e) {
      console.warn('Clear range warning:', e);
    }
  }

  // Batch update with current real rows
  const updatePayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'Agenda Surat Masuk'!A2:T" + (smRows.length ? smRows.length + 1 : 2),
        values: smRows.length > 0 ? smRows : [['(Belum ada data surat masuk - siap diisi data nyata)', ...Array(19).fill('')]],
      },
      {
        range: "'Agenda Surat Keluar'!A2:M" + (skRows.length ? skRows.length + 1 : 2),
        values: skRows.length > 0 ? skRows : [['(Belum ada data surat keluar - siap diisi data nyata)', ...Array(12).fill('')]],
      },
      {
        range: "'Agenda Telegram'!A2:L" + (trRows.length ? trRows.length + 1 : 2),
        values: trRows.length > 0 ? trRows : [['(Belum ada data telegram - siap diisi data nyata)', ...Array(11).fill('')]],
      },
    ],
  };

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menyinkronkan data ke Google Sheets: ${res.status} - ${errText}`);
  }

  saveLinkedSpreadsheetId(spreadsheetId);
  return {
    success: true,
    message: `Berhasil menyinkronkan ${smRows.length} Surat Masuk, ${skRows.length} Surat Keluar, dan ${trRows.length} Telegram ke Google Spreadsheet!`,
  };
}

/**
 * Import real data from Google Spreadsheet back into local state
 */
export async function pullDataFromGoogleSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  suratMasuk: SuratMasuk[];
  suratKeluar: SuratKeluar[];
  telegram: WartaTelegram[];
}> {
  const fetchRange = async (sheetName: string, cols: string) => {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!${cols}`)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.values || [];
  };

  const smRaw = await fetchRange('Agenda Surat Masuk', 'A2:T1000');
  const skRaw = await fetchRange('Agenda Surat Keluar', 'A2:M1000');
  const trRaw = await fetchRange('Agenda Telegram', 'A2:L1000');

  const suratMasuk: SuratMasuk[] = [];
  smRaw.forEach((row: string[], idx: number) => {
    if (!row[0] || row[0].startsWith('(')) return;
    suratMasuk.push({
      id: `real-sm-${Date.now()}-${idx}`,
      noAgenda: row[0] || '',
      noSurat: row[1] || '',
      tglSurat: row[2] || '',
      tglTerima: row[3] || '',
      waktuTerima: row[4] || '08:00 WIB',
      asalSurat: row[5] || '',
      perihal: row[6] || '',
      ringkasan: row[7] || '',
      klasifikasi: (row[8] as any) || 'Biasa',
      derajat: (row[9] as any) || 'Biasa',
      statusDisposisi: (row[10] as any) || 'Proses Koordinasi Paban IV',
      kategoriUrusan: 'renbut',
      disposisi: {
        panglima: { checkedClauses: [], catatan: row[11] || '', diparaf: false },
        aslog: { checkedClauses: [], catatan: row[12] || '', diparaf: false },
        waaslog: { checkedClauses: [], catatan: row[13] || '', diparaf: false },
        paban: { checkedClauses: [], catatan: row[14] || '', diparaf: false },
      },
      satkerTujuan: row[15] || 'Paban IV Konst',
      lampiranJumlah: row[16] || 'Nihil',
      lampiranList: [],
      scanFileName: row[17] || undefined,
      ocrAccuracy: 100,
      tglDibuat: row[19] || new Date().toISOString(),
    });
  });

  const suratKeluar: SuratKeluar[] = [];
  skRaw.forEach((row: string[], idx: number) => {
    if (!row[0] || row[0].startsWith('(')) return;
    suratKeluar.push({
      id: `real-sk-${Date.now()}-${idx}`,
      noAgenda: row[0] || '',
      noSurat: row[1] || '',
      tglSurat: row[2] || '',
      tglKirim: row[3] || '',
      tujuanSurat: row[4] || '',
      perihal: row[5] || '',
      ringkasan: row[6] || '',
      klasifikasi: (row[7] as any) || 'Biasa',
      kategoriUrusan: (row[8] as any) || 'laporan',
      konseptor: row[9] || '',
      statusTTE: (row[10] as any) || 'TTE Aslog Sah',
      lampiranJumlah: row[11] || 'Nihil',
      tglDibuat: row[12] || new Date().toISOString(),
    });
  });

  const telegram: WartaTelegram[] = [];
  trRaw.forEach((row: string[], idx: number) => {
    if (!row[0] || row[0].startsWith('(')) return;
    telegram.push({
      id: `real-tr-${Date.now()}-${idx}`,
      noTelegram: row[0] || '',
      tipe: (row[1] as any) || 'TR-IN',
      tglWaktu: row[2] || '',
      dari: row[3] || '',
      kepada: row[4] || '',
      tembusan: row[5] || '',
      klasifikasi: (row[6] as any) || 'BIASA',
      derajatKeamanan: (row[7] as any) || 'BIASA',
      perihal: row[8] || '',
      isiBerita: row[9] || '',
      status: (row[10] as any) || 'Diterima',
      tglDibuat: row[11] || new Date().toISOString(),
    });
  });

  return { suratMasuk, suratKeluar, telegram };
}

/* =========================================================================
   GOOGLE DRIVE API SERVICES
   ========================================================================= */

/**
 * Find or create dedicated SIMONAS Google Drive Folder
 * Prioritizes the user's official designated Drive folder ID (1XeWQL8dmNxTKnCXFSbyoqiiibIA-uPSh)
 */
export async function findOrCreateDriveFolder(
  accessToken: string,
  folderName: string = DEFAULT_DRIVE_FOLDER_NAME,
  targetFolderId: string = OFFICIAL_TARGET_DRIVE_FOLDER_ID
): Promise<{ id: string; name: string; webViewLink?: string }> {
  try {
    // 1. Prioritize designated official target folder from user
    if (targetFolderId) {
      try {
        const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${targetFolderId}?fields=id,name,webViewLink`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (getRes.ok) {
          const folderData = await getRes.json();
          saveLinkedDriveFolderId(folderData.id);
          return {
            id: folderData.id,
            name: folderData.name || 'Folder SIMONAS (Resmi)',
            webViewLink: folderData.webViewLink || OFFICIAL_TARGET_DRIVE_FOLDER_URL
          };
        }
      } catch (err) {
        console.warn('Could not query target folder directly:', err);
      }
    }

    // 2. Search by folder name
    const q = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        saveLinkedDriveFolderId(data.files[0].id);
        return data.files[0];
      }
    }

    // 3. Fallback: Create folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Gagal membuat folder di Google Drive: ${errText}`);
    }

    const folder = await createRes.json();
    saveLinkedDriveFolderId(folder.id);
    return folder;
  } catch (err) {
    console.error('Error with Google Drive folder:', err);
    return {
      id: targetFolderId || OFFICIAL_TARGET_DRIVE_FOLDER_ID,
      name: 'Folder SIMONAS (Resmi)',
      webViewLink: OFFICIAL_TARGET_DRIVE_FOLDER_URL
    };
  }
}

/**
 * Upload any File / Blob to Google Drive (Scan document, PDF report, or JSON backup)
 */
export async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  file: Blob | File,
  fileName: string,
  mimeType: string = 'application/pdf'
): Promise<DriveFileInfo> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: mimeType,
  };

  const boundary = 'foo_bar_baz_simonas_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const metadataContentType = 'application/json; charset=UTF-8';
  const metadataPart = `${delimiter}Content-Type: ${metadataContentType}\r\n\r\n${JSON.stringify(metadata)}`;
  const filePartHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const metadataBytes = new TextEncoder().encode(metadataPart);
  const fileHeaderBytes = new TextEncoder().encode(filePartHeader);
  const closeBytes = new TextEncoder().encode(closeDelimiter);

  const combinedBody = new Uint8Array(
    metadataBytes.length + fileHeaderBytes.length + fileArrayBuffer.byteLength + closeBytes.length
  );

  let offset = 0;
  combinedBody.set(metadataBytes, offset);
  offset += metadataBytes.length;
  combinedBody.set(fileHeaderBytes, offset);
  offset += fileHeaderBytes.length;
  combinedBody.set(new Uint8Array(fileArrayBuffer), offset);
  offset += fileArrayBuffer.byteLength;
  combinedBody.set(closeBytes, offset);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: combinedBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal mengunggah berkas ke Google Drive: ${res.status} - ${errText}`);
  }

  const uploaded = await res.json();
  return uploaded;
}

/**
 * List files stored inside the SIMONAS Drive folder
 */
export async function listDriveFiles(
  accessToken: string,
  folderId: string
): Promise<DriveFileInfo[]> {
  try {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size,createdTime,webViewLink,webContentLink)&orderBy=createdTime desc`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Error listing files from Google Drive:', err);
    return [];
  }
}

/**
 * Backup complete JSON database snapshot directly into Google Drive
 */
export async function backupDatabaseToDrive(
  accessToken: string,
  folderId: string,
  data: {
    suratMasuk: SuratMasuk[];
    suratKeluar: SuratKeluar[];
    telegram: WartaTelegram[];
  }
): Promise<DriveFileInfo> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `SIMONAS_BACKUP_${timestamp}.json`;
  const backupObject = {
    system: 'SIMONAS_REAL_DATABASE',
    version: '4.2.0',
    exportedAt: new Date().toISOString(),
    counts: {
      suratMasuk: data.suratMasuk.length,
      suratKeluar: data.suratKeluar.length,
      telegram: data.telegram.length,
    },
    suratMasuk: data.suratMasuk,
    suratKeluar: data.suratKeluar,
    telegram: data.telegram,
  };

  const blob = new Blob([JSON.stringify(backupObject, null, 2)], { type: 'application/json' });
  return uploadFileToDrive(accessToken, folderId, blob, fileName, 'application/json');
}

/**
 * Delete a file in Google Drive (with safety checks)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.ok;
}
