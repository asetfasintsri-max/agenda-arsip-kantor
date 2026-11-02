/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type KlasifikasiKeamanan = 'Biasa' | 'Rahasia' | 'Sangat Rahasia' | 'Kilat' | 'Kilat / Rahasia';

export type KategoriUrusan = 'renbut' | 'perbaikan' | 'legal_utilitas' | 'laporan';

export interface LampiranItem {
  id: number;
  label: string;
  keterangan: string;
  tag: string;
  terlampir: boolean;
  fileName?: string;
  wajib: boolean;
  status?: string;
}

export interface DisposisiPejabatEntry {
  checkedClauses: string[];
  catatan: string;
  diparaf: boolean;
  tglParaf?: string;
  akurasiOcr?: number;
  perluVerifikasi?: boolean;
}

export interface SuratMasuk {
  id: string;
  noAgenda: string;
  noSurat: string;
  tglSurat: string;
  tglTerima: string;
  waktuTerima: string;
  asalSurat: string;
  perihal: string;
  ringkasan: string;
  klasifikasi: KlasifikasiKeamanan;
  derajat: 'Kilat' | 'Segera' | 'Biasa';
  lampiranJumlah: string;
  lampiranList: LampiranItem[];
  disposisi: {
    panglima: DisposisiPejabatEntry;
    aslog: DisposisiPejabatEntry;
    waaslog: DisposisiPejabatEntry;
    paban: DisposisiPejabatEntry;
  };
  statusDisposisi: 'Selesai / Terarsip' | 'Proses Koordinasi Paban IV' | 'Perlu Koreksi / Kekurangan Lampiran' | 'Draf OCR';
  kategoriUrusan: KategoriUrusan;
  satkerTujuan: string;
  scanFileName?: string;
  ocrAccuracy?: number;
  shaHash?: string;
  tglDibuat: string;
}

export interface SuratKeluar {
  id: string;
  noAgenda: string;
  noSurat: string;
  tglSurat: string;
  tglKirim: string;
  tujuanSurat: string;
  perihal: string;
  ringkasan: string;
  klasifikasi: KlasifikasiKeamanan;
  kategoriUrusan: KategoriUrusan;
  konseptor: string;
  statusTTE: 'Menunggu Paraf' | 'Diparaf Waaslog' | 'TTE Aslog Sah' | 'Terkirim & Arsip';
  lampiranJumlah: string;
  tglDibuat: string;
}

export interface WartaTelegram {
  id: string;
  tipe: 'TR-IN' | 'TR-OUT';
  noTelegram: string;
  tglWaktu: string;
  dari: string;
  kepada: string;
  tembusan: string;
  klasifikasi: 'KILAT' | 'SEGERA' | 'BIASA';
  derajatKeamanan: 'RAHASIA' | 'BIASA';
  perihal: string;
  isiBerita: string;
  status: 'Diterima' | 'Didisposisi' | 'Terkirim & Arsip';
  tglDibuat: string;
}

export const KLAUSUL_RESMI_19 = [
  'ACC',
  'Aksi/TDL',
  'Laporkan',
  'siapkan',
  'minitor/ikuti perkemb.',
  'sbg bahan/pelajari',
  'agendakan/acarakan',
  'diskusikan/rapatkan',
  'ssi diposisi pang tni',
  'ssi disposisi Kasau',
  'UDK',
  'UMP/pedomani',
  'teruskan',
  'koordinasi',
  'record/catat',
  'takahkan/arsipkan',
  'aksi wakili/hadir',
  'saran tanggapan',
  'catatan tambahan'
] as const;

export const DEFAULT_11_LAMPIRAN: LampiranItem[] = [
  {
    id: 1,
    label: '1. Gambar Layout (Existing)',
    keterangan: 'Lokasi dimohon & eksisting fasilitas',
    tag: 'Wajib',
    terlampir: true,
    fileName: 'LAYOUT_REV01.DWG.PDF',
    wajib: true
  },
  {
    id: 2,
    label: '2. Gambar Rencana',
    keterangan: 'Denah rencana modifikasi fisik',
    tag: 'Wajib',
    terlampir: true,
    fileName: 'RENCANA_GARDU.PDF',
    wajib: true
  },
  {
    id: 3,
    label: '3. RAB / TOR Usulan',
    keterangan: 'RAB rinci & Term of Reference',
    tag: 'Perbaikan/Renbut',
    terlampir: true,
    fileName: 'TOR_RAB_KONST25.XLSX',
    wajib: true
  },
  {
    id: 4,
    label: '4. Dokumentasi Foto Lapangan',
    keterangan: 'Existing / foto kondisi fisik aktual',
    tag: 'Wajib',
    terlampir: true,
    fileName: 'FOTO_DOK_6LBR.PDF',
    wajib: true
  },
  {
    id: 5,
    label: '5. Kajian Legalisasi Listrik/Air',
    keterangan: 'Analisis teknis beban kwh & debit PAM',
    tag: 'Khusus Legalisasi',
    terlampir: true,
    fileName: 'KAJIAN_LISTRIK_PLN.PDF',
    wajib: true
  },
  {
    id: 6,
    label: '6. Rekapitulasi Kebutuhan Kajian',
    keterangan: 'Matriks rekapitulasi data konsumsi',
    tag: 'Khusus Legalisasi',
    terlampir: true,
    fileName: 'REKAP_KEBUTUHAN.XLSX',
    wajib: true
  },
  {
    id: 7,
    label: '7. Gbr. Wiring Listrik / Jaringan',
    keterangan: 'Diagram satu garis & instalasi air',
    tag: 'Khusus Legalisasi',
    terlampir: true,
    fileName: 'SINGLE_LINE_WIRING.PDF',
    wajib: true
  },
  {
    id: 8,
    label: '8. RAB Kontrak / Rekanan',
    keterangan: 'Salinan penawaran kontrak penyedia',
    tag: 'Opsional',
    terlampir: false,
    fileName: undefined,
    wajib: false,
    status: 'Menunggu upload satker'
  },
  {
    id: 9,
    label: '9. Dok. Meteran Kajian Listrik/Air',
    keterangan: 'Foto nomor seri meter PLN/PAM & segel',
    tag: 'Khusus Legalisasi',
    terlampir: true,
    fileName: 'METERAN_PLN_SEALED.JPG',
    wajib: true
  },
  {
    id: 10,
    label: '10. Copy KIB (Kartu Inventaris)',
    keterangan: 'KIB A (Tanah) / KIB C (Gedung & Bangunan)',
    tag: 'Wajib BMN',
    terlampir: false,
    fileName: undefined,
    wajib: true,
    status: 'Perlu konfirmasi Kaur Simak'
  },
  {
    id: 11,
    label: '11. Copy Sertifikat / Berita Acara',
    keterangan: 'Bukti kepemilikan/penguasaan lahan dinas',
    tag: 'Legalitas',
    terlampir: false,
    fileName: undefined,
    wajib: true,
    status: 'Dalam proses verifikasi Minlog'
  }
];
