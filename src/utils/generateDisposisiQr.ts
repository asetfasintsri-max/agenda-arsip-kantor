/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';

export interface DisposisiQrMetadata {
  noAgenda: string;
  noSurat: string;
  tglSurat: string;
  tglTerima: string;
  waktuTerima: string;
  asalSurat: string;
  perihal: string;
  klasifikasi: string;
  statusDisposisi?: string;
  catatanPaban?: string;
  verifikasiOleh?: string;
  kodeKeamanan?: string;
  tglCetak?: string;
}

export type QrPayloadFormat = 'military_text' | 'json_secure' | 'tracking_url';

/**
 * Menghasilkan teks payload QR Code sesuai format yang dipilih.
 */
export function buildDisposisiQrPayload(
  metadata: DisposisiQrMetadata,
  format: QrPayloadFormat = 'military_text'
): string {
  const cleanAgenda = metadata.noAgenda || 'AG-SM/2025/00144';
  const cleanSurat = metadata.noSurat || '-';
  const cleanPengirim = metadata.asalSurat || 'Mabes TNI';
  const cleanPerihal = (metadata.perihal || '-').slice(0, 100);
  const cleanTgl = metadata.tglSurat || '-';
  const cleanKlasifikasi = metadata.klasifikasi || 'RAHASIA';
  const cleanStatus = metadata.statusDisposisi || 'Diproses';
  const verificationCode = metadata.kodeKeamanan || `SIM-${cleanAgenda.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`;
  const verificationUrl = `https://simonas-slog.tni.mil.id/verifikasi?agenda=${encodeURIComponent(cleanAgenda)}&id=${encodeURIComponent(verificationCode)}`;

  if (format === 'json_secure') {
    return JSON.stringify(
      {
        aplikasi: 'SIMONAS-TNI-LOG',
        versi: '2.4.0',
        jenisDokumen: 'LEMBAR_DISPOSISI_KARTU_KENDALI',
        noAgenda: cleanAgenda,
        noSurat: cleanSurat,
        tglSurat: cleanTgl,
        tglTerima: `${metadata.tglTerima} ${metadata.waktuTerima}`,
        pengirim: cleanPengirim,
        perihal: cleanPerihal,
        klasifikasi: cleanKlasifikasi,
        status: cleanStatus,
        kodeKeamanan: verificationCode,
        verifikasiUrl: verificationUrl,
        timestamp: new Date().toISOString()
      },
      null,
      2
    );
  }

  if (format === 'tracking_url') {
    return verificationUrl;
  }

  // Format Standar Militer (Text Ringkas Terstruktur - Ramah Kamera HP & Scanner)
  return [
    `[SIMONAS KOMANDO LOGISTIK TNI]`,
    `KARTU KENDALI DISPOSISI DIGITAL`,
    `--------------------------------`,
    `No. Agenda   : ${cleanAgenda}`,
    `No. Surat    : ${cleanSurat}`,
    `Tgl Surat    : ${cleanTgl}`,
    `Tgl Terima   : ${metadata.tglTerima} ${metadata.waktuTerima}`,
    `Pengirim     : ${cleanPengirim}`,
    `Klasifikasi  : ${cleanKlasifikasi}`,
    `Perihal      : ${cleanPerihal}`,
    `Status Arsip : ${cleanStatus}`,
    `Kode Validasi: ${verificationCode}`,
    `Takah Dinas  : Paban IV/Konstruksi Slog`,
    `Verifikasi   : ${verificationUrl}`
  ].join('\n');
}

/**
 * Menghasilkan Data URL gambar PNG (base64) dari kode QR untuk disematkan
 * ke tag <img> atau dokumen cetak A4/jsPDF.
 */
export async function generateDisposisiQrDataUrl(
  metadata: DisposisiQrMetadata,
  format: QrPayloadFormat = 'military_text',
  options?: {
    width?: number;
    margin?: number;
    colorDark?: string;
    colorLight?: string;
  }
): Promise<string> {
  const payload = buildDisposisiQrPayload(metadata, format);
  return QRCode.toDataURL(payload, {
    width: options?.width || 240,
    margin: options?.margin ?? 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: options?.colorDark || '#0f1e36',
      light: options?.colorLight || '#ffffff'
    }
  });
}
