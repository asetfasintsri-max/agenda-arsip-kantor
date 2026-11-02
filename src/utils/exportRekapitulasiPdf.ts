/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SuratKeluar, SuratMasuk, WartaTelegram } from '../types';

interface ExportRekapitulasiPdfOptions {
  suratMasukList: SuratMasuk[];
  suratKeluarList: SuratKeluar[];
  telegramList: WartaTelegram[];
  granularity: 'harian' | 'mingguan' | 'bulanan';
  startDate: string;
  endDate: string;
  berkasType?: string;
  urusan?: string;
}

export function generateRekapitulasiPdf({
  suratMasukList,
  suratKeluarList,
  telegramList,
  granularity,
  startDate,
  endDate,
  berkasType = 'all',
  urusan = 'all'
}: ExportRekapitulasiPdfOptions): jsPDF {
  // A4 Landscape for comprehensive analytical tables
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
  doc.line(20, 24.5, 120, 24.5);
  doc.setLineWidth(0.2);
  doc.line(20, 25.3, 120, 25.3);

  // Badge Klasifikasi Dokumen di Kanan Atas
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(pageWidth - 85, 12, 65, 13, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 20, 20);
  doc.text('RAHASIA / TERBATAS', pageWidth - 52.5, 17, { align: 'center' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 70, 90);
  doc.text('KODIFIKASI: REKAP-SIMONAS-LOG-2025', pageWidth - 52.5, 21.5, { align: 'center' });

  // 2. JUDUL LAPORAN ANALITIK RESMI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 30, 54);
  doc.text('LAPORAN REKAPITULASI & ANALITIK NASKAH DINAS', pageWidth / 2, 33, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 80, 95);
  doc.text(
    `Periode: ${startDate} s.d. ${endDate} (Agregasi: ${granularity.toUpperCase()}) • Paban IV Konstruksi Slog TNI`,
    pageWidth / 2,
    38,
    { align: 'center' }
  );

  // 3. PARAMETER & METADATA PELAPORAN
  const now = new Date();
  const printTimestamp = `${now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

  const totalVolume = suratMasukList.length + suratKeluarList.length + telegramList.length;
  const countTRIN = telegramList.filter(t => t.tipe === 'TR-IN').length;
  const countTROUT = telegramList.filter(t => t.tipe === 'TR-OUT').length;
  const countSelesai = suratMasukList.filter(s => s.statusDisposisi === 'Selesai / Terarsip').length;
  const countKoordinasi = suratMasukList.filter(s => s.statusDisposisi === 'Proses Koordinasi Paban IV').length;

  // 4. EXECUTIVE SUMMARY METRIC BOXES
  const boxY = 43;
  const boxHeight = 15;
  const boxWidth = (pageWidth - 40 - 16) / 5; // 5 boxes

  const metrics = [
    { label: 'TOTAL VOLUME', val: `${totalVolume} Berkas`, sub: `SM: ${suratMasukList.length} | SK: ${suratKeluarList.length}` },
    { label: 'SURAT MASUK', val: `${suratMasukList.length} Surat`, sub: `Inbound Naskah` },
    { label: 'SURAT KELUAR', val: `${suratKeluarList.length} Surat`, sub: `Outbound Naskah` },
    { label: 'WARTA TELEGRAM', val: `${telegramList.length} Warta`, sub: `TR-IN: ${countTRIN} | TR-OUT: ${countTROUT}` },
    { label: 'DISPOSISI SELESAI', val: `${countSelesai} Berkas`, sub: `${countKoordinasi} Proses Koordinasi` }
  ];

  metrics.forEach((m, idx) => {
    const x = 20 + idx * (boxWidth + 4);
    doc.setFillColor(248, 250, 253);
    doc.setDrawColor(218, 226, 253);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(80, 95, 120);
    doc.text(m.label, x + 3, boxY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 30, 54);
    doc.text(m.val, x + 3, boxY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 115, 140);
    doc.text(m.sub, x + 3, boxY + 13.5);
  });

  // 5. DATA ROWS PREPARATION FOR AUTOTABLE
  const tableRows: any[] = [];
  let noUrut = 1;

  // Surat Masuk Rows
  if (berkasType === 'all' || berkasType === 'masuk') {
    suratMasukList.forEach((sm) => {
      if (urusan !== 'all' && sm.kategoriUrusan !== urusan) return;
      tableRows.push([
        noUrut++,
        'Surat Masuk',
        sm.noAgenda || '-',
        sm.noSurat || '-',
        sm.tglSurat || '-',
        sm.asalSurat || '-',
        sm.perihal || '-',
        sm.klasifikasi || 'Biasa',
        sm.statusDisposisi || 'Proses',
        sm.lampiranJumlah || 'Nihil'
      ]);
    });
  }

  // Surat Keluar Rows
  if (berkasType === 'all' || berkasType === 'keluar') {
    suratKeluarList.forEach((sk) => {
      if (urusan !== 'all' && sk.kategoriUrusan !== urusan) return;
      tableRows.push([
        noUrut++,
        'Surat Keluar',
        sk.noAgenda || '-',
        sk.noSurat || '-',
        sk.tglSurat || '-',
        `Tujuan: ${sk.tujuanSurat || '-'}`,
        sk.perihal || '-',
        sk.klasifikasi || 'Biasa',
        sk.statusTTE || 'TTE Sah',
        sk.lampiranJumlah || 'Nihil'
      ]);
    });
  }

  // Telegram Rows
  if (berkasType === 'all' || berkasType === 'telegram') {
    telegramList.forEach((tr) => {
      tableRows.push([
        noUrut++,
        `Telegram (${tr.tipe})`,
        '-',
        tr.noTelegram || '-',
        tr.tglWaktu ? tr.tglWaktu.slice(0, 10) : '-',
        `Dari: ${tr.dari} / Kpd: ${tr.kepada}`,
        tr.perihal || '-',
        `${tr.klasifikasi} / ${tr.derajatKeamanan}`,
        tr.status || 'Diterima',
        '-'
      ]);
    });
  }

  // 6. RENDER AUTOTABLE
  autoTable(doc, {
    startY: boxY + boxHeight + 4,
    head: [[
      'No.',
      'Jenis Naskah',
      'No. Agenda',
      'Nomor Surat / TR',
      'Tgl Dokumen',
      'Pengirim / Tujuan',
      'Perihal / Hal Pokok',
      'Klasifikasi',
      'Status Tindak Lanjut',
      'Lampiran'
    ]],
    body: tableRows.length > 0 ? tableRows : [[
      { content: 'Belum ada catatan berkas riil pada filter periode ini.', colSpan: 10, styles: { halign: 'center', fontStyle: 'italic', textColor: [120, 120, 120] } }
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 30, 54],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2
    },
    styles: {
      fontSize: 7,
      font: 'helvetica',
      textColor: [20, 30, 50],
      cellPadding: 1.8,
      overflow: 'linebreak',
      valign: 'top',
      lineColor: [220, 226, 240],
      lineWidth: 0.15
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 26, font: 'courier' },
      3: { cellWidth: 32, font: 'courier', fontStyle: 'bold' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 42 },
      6: { cellWidth: 55 },
      7: { cellWidth: 22, halign: 'center' },
      8: { cellWidth: 28, halign: 'center' },
      9: { cellWidth: 16, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 253]
    },
    didDrawPage: (data) => {
      // Running Footer on each page
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 130, 145);

      // Left: Timestamp & Auth
      doc.text(`Waktu Cetak: ${printTimestamp} • Sistem SIMONAS v4.2 Slog TNI`, 20, pageHeight - 6);

      // Right: Page number
      const pageNumberStr = `Halaman ${data.pageNumber} dari ${(doc as any).internal.getNumberOfPages()}`;
      doc.text(pageNumberStr, pageWidth - 20, pageHeight - 6, { align: 'right' });

      // Confidentiality watermarking banner on bottom edge
      doc.setDrawColor(218, 226, 253);
      doc.setLineWidth(0.3);
      doc.line(20, pageHeight - 9, pageWidth - 20, pageHeight - 9);
    }
  });

  // 7. LEMBAR TANDA TANGAN PEJABAT PENGESAH (Sign-off Section on last page)
  let finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY > pageHeight - 45) {
    doc.addPage();
    finalY = 25;
  }

  const signX = pageWidth - 90;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 40, 60);
  doc.text('Dikeluarkan di : Jakarta', signX, finalY);
  doc.text(`Pada tanggal   : ${printTimestamp.split(',')[0]}`, signX, finalY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text('a.n. ASISTEN LOGISTIK PANGLIMA TNI', signX, finalY + 11);
  doc.text('PABAN IV/KONSTRUKSI SLOG TNI', signX, finalY + 15.5);

  // Digital Signature / Stamp box simulation
  doc.setDrawColor(200, 210, 230);
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(signX, finalY + 18, 65, 14, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 70, 160);
  doc.text('TERVALIDASI SISTEM SIMONAS', signX + 32.5, finalY + 23.5, { align: 'center' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(80, 100, 130);
  doc.text(`DIGITAL SIGNATURE #${now.getTime().toString(16).toUpperCase()}`, signX + 32.5, finalY + 28, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 30, 54);
  doc.text('KOLONEL CZI. HARTONO, S.T., M.Sc.', signX, finalY + 37);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 80, 95);
  doc.text('KORPS ZENI • NRP 11980023410774', signX, finalY + 41);

  return doc;
}

export function exportRekapitulasiToPdf(options: ExportRekapitulasiPdfOptions): void {
  const doc = generateRekapitulasiPdf(options);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  doc.save(`SIMONAS_Laporan_Rekapitulasi_${options.granularity}_${dateStr}.pdf`);
}

export function getRekapitulasiPdfBlobUrl(options: ExportRekapitulasiPdfOptions): string {
  const doc = generateRekapitulasiPdf(options);
  return doc.output('bloburl').toString();
}
