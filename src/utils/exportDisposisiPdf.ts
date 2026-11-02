/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DisposisiQrMetadata, generateDisposisiQrDataUrl } from './generateDisposisiQr';

interface ExportDisposisiPdfOptions {
  metadata: DisposisiQrMetadata;
  ringkasan?: string;
  disposisiPanglima: { clauses: string[]; catatan: string };
  disposisiAslog: { clauses: string[]; catatan: string };
  disposisiWaaslog: { clauses: string[]; catatan: string };
  disposisiPaban: { clauses: string[]; catatan: string };
  klausulList: readonly string[] | string[];
}

export async function generateDisposisiPdf(options: ExportDisposisiPdfOptions): Promise<jsPDF> {
  const {
    metadata,
    ringkasan = '',
    disposisiPanglima,
    disposisiAslog,
    disposisiWaaslog,
    disposisiPaban,
    klausulList
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // 1. KOP RESMI LEMBAR DISPOSISI
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 30, 54);
  doc.text('TENTARA NASIONAL INDONESIA', margin, 14);
  doc.text('MARKAS BESAR', margin, 18);
  doc.text('KOMANDO LOGISTIK', margin, 22);

  // Line under unit name
  doc.setDrawColor(15, 30, 54);
  doc.setLineWidth(0.4);
  doc.line(margin, 23.5, margin + 65, 23.5);

  // Center: Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LEMBAR DISPOSISI', pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 70, 85);
  doc.text('KARTU KENDALI SURAT & DOKUMEN DINAS', pageWidth / 2, 21.5, { align: 'center' });

  // Right: Klasifikasi Badge
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth - margin - 42, 12, 42, 11, 1, 1, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(185, 28, 28);
  doc.text(metadata.klasifikasi.toUpperCase(), pageWidth - margin - 21, 17, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100, 110, 125);
  doc.text('KODIKLAT-LOG/02-REV', pageWidth - margin - 21, 21, { align: 'center' });

  // Double border separator line
  doc.setDrawColor(20, 30, 50);
  doc.setLineWidth(0.8);
  doc.line(margin, 26, pageWidth - margin, 26);
  doc.setLineWidth(0.2);
  doc.line(margin, 27, pageWidth - margin, 27);

  // 2. METADATA SURAT TABLE (autoTable)
  const metaBody: any[] = [
    [
      { content: `NOMOR AGENDA:\n${metadata.noAgenda}`, styles: { fontStyle: 'bold' } },
      { content: `TGL PENERIMAAN:\n${metadata.tglTerima} (${metadata.waktuTerima})` },
      { content: `TINGKAT KEAMANAN:\n${metadata.klasifikasi}`, styles: { textColor: [180, 20, 20] } }
    ],
    [
      { content: `NOMOR SURAT:\n${metadata.noSurat}`, colSpan: 2, styles: { fontStyle: 'bold' } },
      { content: `TANGGAL SURAT:\n${metadata.tglSurat}` }
    ],
    [
      { content: `ASAL SURAT / PENGIRIM:\n${metadata.asalSurat}`, colSpan: 3, styles: { fontStyle: 'bold' } }
    ],
    [
      { content: `PERIHAL:\n${metadata.perihal}`, colSpan: 3 }
    ]
  ];

  if (ringkasan) {
    metaBody.push([
      { content: `RINGKASAN:\n${ringkasan}`, colSpan: 3, styles: { fontSize: 7.5, textColor: [70, 75, 85] } }
    ]);
  }

  autoTable(doc, {
    startY: 29,
    margin: { left: margin, right: margin },
    body: metaBody as any,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [40, 40, 40],
      lineWidth: 0.3,
      textColor: [20, 25, 35]
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 60 },
      2: { cellWidth: 52 }
    }
  });

  // 3. TABEL 4 KOLOM KLAUSUL DISPOSISI RESMI
  const currentY = (doc as any).lastAutoTable.finalY + 3;

  // Prepare table data for the 4 officers
  const rows: any[] = [];
  const maxClauses = Math.min(12, klausulList.length); // limit to fit neatly on 1 page

  for (let i = 0; i < maxClauses; i++) {
    const clause = klausulList[i];
    const pChecked = disposisiPanglima.clauses.includes(clause);
    const aChecked = disposisiAslog.clauses.includes(clause);
    const wChecked = disposisiWaaslog.clauses.includes(clause);
    const pbChecked = disposisiPaban.clauses.includes(clause);

    rows.push([
      { content: `${pChecked ? '[X]' : '[  ]'} ${clause}`, styles: { fontStyle: pChecked ? 'bold' : 'normal' } },
      { content: `${aChecked ? '[X]' : '[  ]'} ${clause}`, styles: { fontStyle: aChecked ? 'bold' : 'normal' } },
      { content: `${wChecked ? '[X]' : '[  ]'} ${clause}`, styles: { fontStyle: wChecked ? 'bold' : 'normal' } },
      { content: `${pbChecked ? '[X]' : '[  ]'} ${clause}`, styles: { fontStyle: pbChecked ? 'bold' : 'normal' } }
    ]);
  }

  // Row for Catatan
  rows.push([
    { content: `CATATAN PANGLIMA:\n"${disposisiPanglima.catatan || '-'}"`, styles: { fontStyle: 'italic', cellPadding: 3 } },
    { content: `CATATAN ASLOG:\n"${disposisiAslog.catatan || '-'}"`, styles: { fontStyle: 'italic', cellPadding: 3 } },
    { content: `CATATAN WAASLOG:\n"${disposisiWaaslog.catatan || '-'}"`, styles: { fontStyle: 'italic', cellPadding: 3 } },
    { content: `CATATAN PABAN IV:\n"${disposisiPaban.catatan || '-'}"`, styles: { fontStyle: 'italic', cellPadding: 3 } }
  ]);

  // Row for Paraf Digital Stamp
  rows.push([
    { content: `Paraf: [TELAH DIPARAF]\nTgl: ${metadata.tglTerima}`, styles: { halign: 'center', fontStyle: 'bold', textColor: [15, 30, 54] } },
    { content: `Paraf: [TELAH DIPARAF]\nTgl: ${metadata.tglTerima}`, styles: { halign: 'center', fontStyle: 'bold', textColor: [15, 30, 54] } },
    { content: `Paraf: [TELAH DIPARAF]\nTgl: ${metadata.tglTerima}`, styles: { halign: 'center', fontStyle: 'bold', textColor: [15, 30, 54] } },
    { content: `Paraf: [TELAH DIPARAF]\nTgl: ${metadata.tglTerima}`, styles: { halign: 'center', fontStyle: 'bold', textColor: [15, 30, 54] } }
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [
      [
        { content: 'I. DISPOSISI PANGLIMA', styles: { halign: 'center', fillColor: [235, 240, 250], textColor: [15, 30, 54], fontStyle: 'bold' } },
        { content: 'II. DISPOSISI ASLOG', styles: { halign: 'center', fillColor: [235, 240, 250], textColor: [15, 30, 54], fontStyle: 'bold' } },
        { content: 'III. DISPOSISI WAASLOG', styles: { halign: 'center', fillColor: [235, 240, 250], textColor: [15, 30, 54], fontStyle: 'bold' } },
        { content: 'IV. DISPOSISI PABAN IV', styles: { halign: 'center', fillColor: [235, 240, 250], textColor: [15, 30, 54], fontStyle: 'bold' } }
      ]
    ],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      lineColor: [40, 40, 40],
      lineWidth: 0.3,
      textColor: [20, 25, 35]
    }
  });

  // 4. KOTAK KODE QR PELACAKAN DIGITAL & OTENTIKASI
  const tableEndY = (doc as any).lastAutoTable.finalY + 4;
  const qrBoxHeight = 34;

  // Outer border box for QR validation
  doc.setDrawColor(20, 30, 50);
  doc.setLineWidth(0.5);
  doc.setFillColor(250, 252, 255);
  doc.roundedRect(margin, tableEndY, contentWidth, qrBoxHeight, 1.5, 1.5, 'FD');

  // Generate QR Code Data URL
  const qrDataUrl = await generateDisposisiQrDataUrl(metadata, 'military_text', {
    width: 200,
    margin: 1,
    colorDark: '#0f1e36',
    colorLight: '#ffffff'
  });

  // Embed QR Image (30mm x 30mm)
  const qrImgSize = 28;
  doc.addImage(qrDataUrl, 'PNG', margin + 3, tableEndY + 3, qrImgSize, qrImgSize);

  // Text next to QR Code
  const textX = margin + qrImgSize + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 30, 54);
  doc.text('KARTU KENDALI DIGITAL & OTENTIKASI PARAF ELEKTRONIK', textX, tableEndY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 70, 85);
  doc.text(
    'Pindai kode QR untuk memverifikasi keaslian lembar disposisi, status tindak lanjut naskah,',
    textX,
    tableEndY + 12
  );
  doc.text(
    'serta pencocokan berkas arsip pada Sistem Monitoring Naskah Dinas (SIMONAS) Komando Logistik TNI.',
    textX,
    tableEndY + 16
  );

  // Metadata tags in QR box
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 30, 50);
  doc.text(`ID AGENDA   : ${metadata.noAgenda}`, textX, tableEndY + 22);
  doc.text(`NO SURAT    : ${metadata.noSurat}`, textX, tableEndY + 26);
  doc.text(`VERIFIKASI  : SHA256-DIGITAL-SIGN • STATUS: TERVALIDASI RESMI`, textX, tableEndY + 30);

  // 5. FOOTER RESMI DOKUMEN
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110, 120, 135);
  doc.text(
    'Sistem Informasi Monitoring Naskah Dinas (SIMONAS) • Paban IV Minlog / Konst Slog TNI • Dicetak secara sah',
    margin,
    290
  );
  doc.text(
    `Halaman 1 dari 1 • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} WIB`,
    pageWidth - margin,
    290,
    { align: 'right' }
  );

  return doc;
}

export async function exportDisposisiToPdf(options: ExportDisposisiPdfOptions): Promise<void> {
  const doc = await generateDisposisiPdf(options);
  const cleanAgenda = (options.metadata.noAgenda || 'agenda').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `SIMONAS_Lembar_Disposisi_${cleanAgenda}.pdf`;
  doc.save(filename);
}

export async function getDisposisiPdfBlobUrl(options: ExportDisposisiPdfOptions): Promise<string> {
  const doc = await generateDisposisiPdf(options);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
