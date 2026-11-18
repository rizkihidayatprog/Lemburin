# Overtime Management

Aplikasi web pencatatan, perhitungan otomatis, dan rekap fee lembur. Dibuat sesuai PRD Overtime Management v1.0.

**Stack:** React + Vite · Tailwind CSS · Firebase Firestore · Netlify · SheetJS (Excel) · jsPDF (PDF) · Lucide icons

## Fitur

- Dashboard ringkasan (total fee, total jam, hari lembur, overnight) — selalu menampilkan **rekap aktif (belum ACC)**
- Input lembur dengan **fee otomatis** (aturan perusahaan), jam selesai otomatis, deteksi weekday/weekend
- Edit & hapus data (dengan konfirmasi) — data yang sudah di-ACC terkunci
- **Alur Rekap & ACC**: lembur menumpuk → atasan setuju → tekan **"ACC Rekap Ini"** → semua data dikunci jadi satu rekap dengan **periode otomatis dari rentang tanggal** (mis. "Oktober s.d. November 2026") → rekap baru mulai dari nol
- **Riwayat Rekap (ACC)**: arsip per periode ACC, bisa di-export ulang atau dihapus; **terhapus otomatis setelah 3 bulan**
- **Profil Anda**: isi Nama, Divisi & Jabatan (tombol di bawah sidebar) — tampil di sidebar, header, dan otomatis tercetak di laporan export Excel & PDF
- Filter tabel: status ACC, bulan, tahun, jenis lembur, pencarian keterangan, rentang tanggal
- Rekap fee per kategori + agregat (pagi/malam/overnight/weekend)
- Export **Excel (.xlsx)** langsung mengunduh, **PDF** dipreview dulu di dalam aplikasi (tombol **Download PDF**) — nama file periode otomatis, mis. `Laporan_Lembur_Oktober_s.d._November_2026.xlsx`
- Realtime via Firestore `onSnapshot` (atau mode lokal `localStorage` jika Firebase belum diisi)
- Responsif mobile & desktop, timezone Asia/Jakarta (WIB), Bahasa Indonesia, tema merah–putih–kuning

## Ketentuan Fee

| Kategori | Aturan | Fee |
|---|---|---|
| Pagi ≤ 06.00 | Weekday | Rp30.000 |
| Pagi 06.01–07.00 | Weekday | Rp20.000 |
| Pagi > 07.00 | Weekday | Rp0 |
| Malam | Weekday | Rp35.000 |
| Pagi + Malam | Gabungan | pagi + Rp35.000 (maks Rp65.000) |
| Overnight | Weekday | Rp50.000 (menggantikan, tidak di-stack) |
| Weekend < 4 jam | Sabtu–Minggu | Rp40.000 |
| Weekend ≥ 4 jam | Sabtu–Minggu | Rp80.000 |
| Overnight | Weekend | Rp100.000 |

Logika fee ada di `src/lib/calculateFee.js` dan dites lewat `npm test`.

## Menjalankan di lokal

```bash
npm install
npm run dev        # http://localhost:5173
```

Tanpa konfigurasi Firebase, aplikasi berjalan dalam **mode lokal** (data tersimpan di browser). Tombol "Muat data contoh" tersedia saat data kosong.

### Menghubungkan Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com) → aktifkan **Firestore Database**
2. Project settings → Your apps → tambahkan Web App → salin konfigurasi
3. Salin `.env.example` menjadi `.env`, isi semua nilai `VITE_FIREBASE_*`
4. (Opsional) Pasang `firestore.rules` di menu Firestore → Rules
5. Restart `npm run dev` — indikator di sidebar berubah menjadi "Firebase Firestore"

## Test

```bash
npm test           # unit test batas fee: 06.00/06.30/07.00/07.30, 239/240/241 menit, overnight
```

## Build & deploy ke Netlify

```bash
npm run build      # output ke folder dist/
```

**Netlify settings** (sudah ada di `netlify.toml`):
- Build command: `npm run build`
- Publish directory: `dist`
- Node 20
- Tambahkan semua environment variable `VITE_FIREBASE_*` di Site settings → Environment variables
- Deploy: hubungkan repo GitHub ke Netlify, atau `netlify deploy --prod --dir=dist`

## Struktur folder

```
src/
├── components/    # DashboardCards, OvertimeForm, OvertimeTable, FilterBar,
│                  # SummaryPanel, ConfirmDialog, Sidebar, Toast
├── pages/         # Dashboard.jsx (halaman utama)
├── services/      # overtimeService.js (Firestore realtime / fallback lokal)
├── lib/           # calculateFee.js, reportSummary.js, exportExcel.js, exportPDF.js, firebase.js
└── utils/         # dateUtils.js (WIB, format Indonesia), currencyUtils.js (IDR)
```

## Catatan keamanan

Aplikasi tanpa login sesuai keputusan produk. Siapa pun yang membuka situs berpotensi menulis data ke Firestore. Mitigasi yang tersedia: `firestore.rules` (validasi skema, tolak collection lain) dan disarankan mengaktifkan **Firebase App Check**. Lihat PRD bagian 10.
