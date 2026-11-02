/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  ShieldCheck, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Info, 
  Maximize2, 
  X,
  FileText
} from 'lucide-react';
import { 
  DisposisiQrMetadata, 
  QrPayloadFormat, 
  buildDisposisiQrPayload, 
  generateDisposisiQrDataUrl 
} from '../utils/generateDisposisiQr';

interface DisposisiQrSectionProps {
  metadata: DisposisiQrMetadata;
  compact?: boolean;
}

export const DisposisiQrSection: React.FC<DisposisiQrSectionProps> = ({ 
  metadata,
  compact = false 
}) => {
  const [format, setFormat] = useState<QrPayloadFormat>('military_text');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    generateDisposisiQrDataUrl(metadata, format, { width: 260, margin: 1 })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Gagal generate QR Code:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [
    metadata.noAgenda,
    metadata.noSurat,
    metadata.tglSurat,
    metadata.asalSurat,
    metadata.perihal,
    metadata.klasifikasi,
    metadata.statusDisposisi,
    format
  ]);

  const rawPayload = buildDisposisiQrPayload(metadata, format);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(rawPayload);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_DISPOSISI_${metadata.noAgenda.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="border-2 border-black bg-slate-50/70 p-2.5 rounded-xs print:bg-white print:border-black mb-3">
      {/* Component Header / Toolbar for Interactive UI (Hidden during paper print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-[#0f1e36]" />
          <span className="text-[11px] font-bold text-[#131b2e] uppercase tracking-wide">
            Generator Kode QR Pelacakan Digital
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Aktif
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Format selector buttons */}
          <div className="inline-flex rounded-md border border-[#dae2fd] bg-white p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setFormat('military_text')}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                format === 'military_text'
                  ? 'bg-[#0f1e36] text-white font-bold'
                  : 'text-[#44474d] hover:text-[#0f1e36]'
              }`}
              title="Format Teks Ringkas Terstruktur Resmi TNI (Bisa dibaca langsung kamera ponsel)"
            >
              Teks Militer
            </button>
            <button
              type="button"
              onClick={() => setFormat('json_secure')}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                format === 'json_secure'
                  ? 'bg-[#0f1e36] text-white font-bold'
                  : 'text-[#44474d] hover:text-[#0f1e36]'
              }`}
              title="Format JSON Terstruktur untuk Integrasi Sistem SIMONAS"
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => setFormat('tracking_url')}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                format === 'tracking_url'
                  ? 'bg-[#0f1e36] text-white font-bold'
                  : 'text-[#44474d] hover:text-[#0f1e36]'
              }`}
              title="Link URL Langsung ke Portal Verifikasi SIMONAS Slog"
            >
              URL
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsInspectModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-slate-100 border border-[#dae2fd] text-[10px] font-semibold text-[#0f1e36] cursor-pointer"
            title="Buka Inspeksi Metadata Kode QR"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Detail QR</span>
          </button>
        </div>
      </div>

      {/* Main Print Layout: QR Code + Official Digital Verification Info */}
      <div className="flex items-center justify-between gap-3">
        {/* Left / Info Side */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-heading font-bold text-[11px] text-slate-900 uppercase tracking-tight">
              KARTU KENDALI DIGITAL &amp; OTENTIKASI PARAF
            </span>
          </div>

          <p className="text-[10px] text-slate-700 leading-tight">
            Pindai kode QR menggunakan kamera ponsel atau scanner berkas kedinasan untuk melacak riwayat disposisi, keaslian paraf 4 pejabat (Panglima, Aslog, Waaslog, Paban IV), dan status berkas aktif.
          </p>

          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] pt-1 border-t border-slate-300 font-mono text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">No. Agenda:</span> {metadata.noAgenda}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Klasifikasi:</span> {metadata.klasifikasi}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Keamanan:</span> SHA256-DIGITAL-SIGN
            </div>
            <div>
              <span className="font-semibold text-slate-800">Kaur Reg:</span> Terarsip Resmi
            </div>
          </div>
        </div>

        {/* Right / QR Code Graphic Side (High-Res & Printable) */}
        <div className="shrink-0 flex flex-col items-center justify-center p-1.5 bg-white border border-slate-400 rounded-xs shadow-xs text-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code Disposisi ${metadata.noAgenda}`}
              className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center bg-slate-100 text-[9px] text-slate-400">
              Membuat QR...
            </div>
          )}
          <span className="text-[7.5px] font-mono font-bold text-slate-700 uppercase mt-0.5 tracking-wider">
            PELACAKAN DIGITAL
          </span>
        </div>
      </div>

      {/* INSPECTION MODAL (Interactive for User Review) */}
      {isInspectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-[#dae2fd] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dae2fd]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0f1e36] text-white flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#131b2e]">
                    Detail Metadata Kode QR Disposisi
                  </h4>
                  <p className="text-[11px] text-[#44474d]">
                    No. Agenda: {metadata.noAgenda} • Standard SIMONAS TNI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Big Preview + Metadata Fields */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-[#f2f3ff] rounded-xl border border-[#dae2fd]">
              <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-sm shrink-0">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="QR Large"
                    className="w-32 h-32 object-contain"
                  />
                )}
              </div>
              <div className="space-y-1.5 text-xs text-[#131b2e] w-full">
                <div>
                  <span className="text-[10px] text-[#44474d] uppercase font-bold block">Nomor Surat:</span>
                  <span className="font-mono font-bold">{metadata.noSurat}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#44474d] uppercase font-bold block">Asal Pengirim:</span>
                  <span className="font-semibold">{metadata.asalSurat}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#44474d] uppercase font-bold block">Perihal:</span>
                  <span className="line-clamp-2 text-[11px]">{metadata.perihal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#44474d] uppercase font-bold block">Format Terpilih:</span>
                  <span className="font-mono text-emerald-700 font-bold uppercase">{format}</span>
                </div>
              </div>
            </div>

            {/* Raw Payload Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#131b2e] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Isi Payload Kode QR (Hasil Pindaian):
                </span>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0f1e36] text-white text-[11px] font-semibold hover:bg-[#000412] transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin Payload</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-mono leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap border border-slate-700">
                {rawPayload}
              </pre>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#dae2fd]">
              <button
                type="button"
                onClick={handleDownloadQrImage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#0f1e36] text-xs font-semibold border border-[#dae2fd] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Gambar QR (.PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInspectModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#0f1e36] text-white text-xs font-bold hover:bg-[#000412] cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
