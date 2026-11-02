/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AnalyzedDocumentData {
  documentType: 'surat_masuk' | 'surat_keluar' | 'telegram';
  noSurat: string;
  noTelegram?: string;
  tglSurat: string;
  tglTerimaAtauKirim: string;
  asalPengirim: string;
  tujuanPenerima: string;
  tembusan: string;
  perihal: string;
  ringkasan: string;
  klasifikasi: string;
  derajat: string;
  satkerTujuan?: string;
  kategoriUrusan?: string;
  konseptor?: string;
  statusTTE?: string;
  isiBerita?: string;
  tipeTelegram?: 'TR-IN' | 'TR-OUT';
  catatanDisposisi?: string;
  confidence: number;
  missingFields: string[];
}

export interface AnalyzeDocumentResponse {
  success: boolean;
  data: AnalyzedDocumentData;
  isFallback?: boolean;
  warning?: string;
  note?: string;
}

export const FIELD_LABELS_MAP: Record<string, string> = {
  noSurat: 'Nomor Surat / Naskah',
  noTelegram: 'Nomor Warta Telegram',
  tglSurat: 'Tanggal Surat',
  tglTerimaAtauKirim: 'Tanggal Diterima / Dikirim',
  asalPengirim: 'Asal Instansi / Satker Pengirim',
  tujuanPenerima: 'Tujuan Satker / Kepada',
  tembusan: 'Tembusan Naskah',
  perihal: 'Perihal Naskah Dinas',
  ringkasan: 'Ringkasan Abstrak Isi',
  klasifikasi: 'Klasifikasi Keamanan',
  derajat: 'Derajat Kecepatan',
  satkerTujuan: 'Satker Aksi / Tujuan',
  konseptor: 'Konseptor Staf',
  statusTTE: 'Status TTE / Keabsahan',
  isiBerita: 'Isi Berita Warta Telegram',
  tipeTelegram: 'Jalur Telegram (TR-IN / TR-OUT)',
};

/**
 * Convert a File object to Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Call the backend server endpoint to analyze a PDF or Photo using Gemini Vision
 */
export async function analyzeDocumentFile(
  file: File,
  expectedType?: 'surat_masuk' | 'surat_keluar' | 'telegram'
): Promise<AnalyzeDocumentResponse> {
  const base64Data = await fileToBase64(file);

  const payload = {
    fileBase64: base64Data,
    mimeType: file.type || 'application/pdf',
    fileName: file.name,
    expectedType: expectedType || 'auto',
  };

  const res = await fetch('/api/analyze-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal menganalisis dokumen: ${res.status} - ${errorText}`);
  }

  const json: AnalyzeDocumentResponse = await res.json();
  return json;
}
