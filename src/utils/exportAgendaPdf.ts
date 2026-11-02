/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SuratKeluar, SuratMasuk } from '../types';

export type UnifiedSuratItem = 
  | ({ itemType: 'masuk' } & SuratMasuk)
  | ({ itemType: 'keluar' } & SuratKeluar);

interface ExportPdfOptions {
  items: UnifiedSuratItem[];
  activeTab: 'all' | 'masuk' | 'keluar';
  filterKlasifikasi: string;
  filterStatus: string;
  searchQuery: string;
  userRole?: string;
}

export function generateAgendaSuratPdf({
  items,
  activeTab,
  filterKlasifikasi,
  filterStatus,
  searchQuery,
  userRole = 'Staf 3 / Minlog'
}: ExportPdfOptions): jsPDF {
  // A4 Landscape orientation for rich tabular military records
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. KOP SURAT RESMI MILITER (TNI LOGISTIK)
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 30, 50);
  doc.text('MARKAS BESAR TENTARA NASIONAL INDONESIA', 20, 14);
  doc.text('STAF LOGISTIK', 20, 18.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.text('Jalan Raya Hankam, Cilangkap, Jakarta Timur 13870', 20, 22.5);

  // Line separator under Kop
  doc.setDrawColor(20, 30, 50);
  doc.setLineWidth(0.6);
  doc.line(20, 24.5, 115, 24.5);
  doc.setLineWidth(0.2);
  doc.line(20, 25.3, 115, 25.3);

  // Badge Klasifikasi Dokumen di Kanan Atas
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(pageWidth - 75, 12, 55, 13, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 20, 20);
  doc.text('RAHASIA / TERBATAS', pageWidth - 47.5, 17, { align: 'center' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 70, 90);
  doc.text('KODIFIKASI: SIMONAS-LOG-2025', pageWidth - 47.5, 21.5, { align: 'center' });

  // 2. JUDUL LAPORAN AGENDA RESMI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 30, 54);
  doc.text('LAPORAN RESMI BUKU AGENDA SURAT KEDINASAN', pageWidth / 2, 33, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 80, 95);
  const subCategoryText = 
    activeTab === 'masuk' ? 'Agenda Khusus Berkas Surat Masuk (Inbound)' :
    activeTab === 'keluar' ? 'Agenda Khusus Registrasi Surat Keluar (Outbound)' :
    'Agenda Terpadu Berkas Surat Masuk & Registrasi Surat Keluar';
  doc.text(`${subCategoryText} • Paban IV Konstruksi Slog TNI`, pageWidth / 2, 38, { align: 'center' });

  // 3. PARAMETER & METADATA PELAPORAN
  const now = new Date();
  const printTimestamp = `${now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 60, 75);

  const filterSummary = [
    `Filter: ${activeTab === 'all' ? 'Semua Berkas' : activeTab === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}`,
    filterKlasifikasi !== 'all' ? `Klasifikasi: ${filterKlasifikasi}` : 'Klasifikasi: Semua',
    filterStatus !== 'all' ? `Status: ${filterStatus}` : 'Status: Semua',
    searchQuery ? `Pencarian: "${searchQuery}"` : null
  ].filter(Boolean).join(' | ');

  doc.text(`Kriteria Laporan: ${filterSummary}`, 20, 44);
  doc.text(`Waktu Cetak: ${printTimestamp} | Operator: ${userRole}`, pageWidth - 20, 44, { align: 'right' });

  // 4. TABEL AGENDA SURAT (DENGAN JSPDF-AUTOTABLE)
  const countMasuk = items.filter(i => i.itemType === 'masuk').length;
  const countKeluar = items.filter(i => i.itemType === 'keluar').length;

  const tableRows = items.map((item, index) => {
    const isMasuk = item.itemType === 'masuk';
    const typeLabel = isMasuk ? 'SURAT MASUK' : 'SURAT KELUAR';
    const noAgenda = item.noAgenda;
    const tglAgenda = isMasuk ? item.tglTerima : item.tglKirim;
    const instansi = isMasuk ? item.asalSurat : item.tujuanSurat;
    const perihal = item.perihal + (item.ringkasan ? `\n[Ket: ${item.ringkasan}]` : '');
    const status = isMasuk ? item.statusDisposisi : item.statusTTE;

    return [
      String(index + 1),
      typeLabel,
      `${noAgenda}\n(${tglAgenda})`,
      `${item.noSurat}\nTgl: ${item.tglSurat}`,
      instansi,
      perihal,
      item.klasifikasi.toUpperCase(),
      status
    ];
  });

  autoTable(doc, {
    startY: 47,
    head: [[
      'NO',
      'JENIS',
      'NO. AGENDA & TGL',
      'NO. NASKAH & TGL SURAT',
      'INSTANSI (ASAL / TUJUAN)',
      'PERIHAL DOKUMEN & RINGKASAN',
      'KLASIFIKASI',
      'STATUS / TTE'
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [200, 210, 225],
      lineWidth: 0.15,
      textColor: [20, 30, 45],
      valign: 'top',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [15, 30, 54], // Navy TNI Slog
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 32, font: 'courier', fontSize: 7 },
      3: { cellWidth: 42, fontStyle: 'bold' },
      4: { cellWidth: 40 },
      5: { cellWidth: 'auto' }, // Expands
      6: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 30, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 253]
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageNumber = data.pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 110, 125);

      // Left footer
      doc.text(
        'Sistem Informasi Manajemen Naskah Dinas (SIMONAS) - Markas Besar TNI',
        20,
        pageHeight - 8
      );

      // Right footer with total pages placeholder
      doc.text(
        `Halaman ${pageNumber}`,
        pageWidth - 20,
        pageHeight - 8,
        { align: 'right' }
      );
    }
  });

  // 5. SIGNATURE & RESUME BLOCK (ON THE LAST PAGE)
  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  // Check if we need a new page for signature block
  let signatureY = finalY + 8;
  if (signatureY + 45 > pageHeight) {
    doc.addPage('a4', 'landscape');
    signatureY = 25;
  }

  // Summary box on the left
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(210, 220, 235);
  doc.roundedRect(20, signatureY, 110, 32, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 30, 54);
  doc.text('RESUME REKAPITULASI DOKUMEN TERDAFTAR:', 24, signatureY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 60, 75);
  doc.text(`• Total Berkas Dilaporkan: ${items.length} Naskah Kedinasan`, 24, signatureY + 12);
  doc.text(`• Surat Masuk (SM): ${countMasuk} Berkas (Terekam dalam Buku Agenda Inbound)`, 24, signatureY + 17);
  doc.text(`• Surat Keluar (SK): ${countKeluar} Berkas (Terekam dalam Register Outbound)`, 24, signatureY + 22);
  doc.text(`• Tingkat Akurasi & Validasi: 100% Sesuai Tata Naskah Militer TNI`, 24, signatureY + 27);

  // Official Signature Block on the right
  const signX = pageWidth - 90;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 40, 55);
  doc.text('Jakarta, ' + now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), signX, signatureY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('An. Panglima TNI', signX, signatureY + 9);
  doc.text('Paban IV/Konstruksi Slog TNI,', signX, signatureY + 13.5);

  // Stamp / QR simulation box
  doc.setDrawColor(180, 195, 215);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(signX, signatureY + 16, 65, 14, 1, 1, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(20, 100, 60);
  doc.text('[TERVALIDASI SECARA ELEKTRONIK]', signX + 32.5, signatureY + 21, { align: 'center' });
  doc.setFont('courier', 'normal');
  doc.setTextColor(80, 90, 105);
  doc.text('SERTIFIKAT DIGITAL TTE MILITER', signX + 32.5, signatureY + 25.5, { align: 'center' });

  // Officer Name & Rank
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 30, 54);
  doc.text('HARTONO, S.I.P., M.Tr.(Han)', signX, signatureY + 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Kolonel Czi NRP 11980023450875', signX, signatureY + 40);

  return doc;
}

export function getAgendaSuratPdfBlob(options: ExportPdfOptions): Blob {
  const doc = generateAgendaSuratPdf(options);
  return doc.output('blob');
}

export function getAgendaSuratPdfBlobUrl(options: ExportPdfOptions): string {
  const blob = getAgendaSuratPdfBlob(options);
  return URL.createObjectURL(blob);
}

export function exportAgendaSuratToPdf(options: ExportPdfOptions): void {
  const doc = generateAgendaSuratPdf(options);
  const nowStr = new Date().toISOString().slice(0, 10);
  const filterLabel = options.activeTab === 'all' ? 'terpadu' : options.activeTab;
  doc.save(`Laporan_Buku_Agenda_Surat_${filterLabel}_${nowStr}.pdf`);
}
