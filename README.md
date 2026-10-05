# Wedding Planner — Rizky & Reina

Aplikasi perencanaan pernikahan (target **17 Februari 2028**, target tabungan
**Rp 85.000.000**) dengan backend **PocketBase** dan frontend **React + Vite + Tailwind**.

## Modul

| Rute | Modul | Isi |
| --- | --- | --- |
| `/` | Dashboard | Countdown, kesehatan anggaran, ringkasan semua modul, audit aktivitas |
| `/budget` | Sangjit & Wedding Budget | Cashflow CPP/CPW, budget sangjit & wedding, termin pembayaran |
| `/administration` | Administrasi & Dokumen | Berkas legal CPP/CPW + checklist persiapan (13 seksi) |
| `/vendors` | Vendor Checklist & Countdown | 55 tugas persiapan dengan tenggat waktu |
| `/guests` | Daftar Tamu | 165 tamu (CPP/CPW), circle, prioritas A/B/C, pax, digital/fisik |
| `/seserahan` | Seserahan | 45 item dengan link Shopee, estimasi budget, harga aktual |

## Menjalankan

1. **Jalankan PocketBase** (port 8090):
   ```powershell
   .\pocketbase.exe serve
   ```
   Sesi login yang dipakai aplikasi adalah akun PocketBase Anda
   (mis. `rizkyaryendigumilang@gmail.com`).

2. **Isi data awal** (opsional, mengosongkan lalu impor ulang dari Excel):
   ```powershell
   npm run seed
   ```

3. **Jalankan frontend**:
   ```powershell
   npm run dev
   ```
   Buka <http://localhost:5173>. Anda akan diminta masuk dengan akun PocketBase.

4. **Build produksi**:
   ```powershell
   npm run build
   ```

## Konfigurasi

- URL PocketBase diatur lewat `.env` → `VITE_PB_URL` (default `http://127.0.0.1:8090`).
- Semua koleksi data bersifat **privat** (`@request.auth.id != ""`), sehingga
  halaman login wajib. Sesi disimpan di `localStorage` dan tetap aktif setelah reload.

## Struktur

```
src/
  lib/
    pocketbase.js    Singleton klien PocketBase
    auth.jsx         Context login/logout + penjaga rute
    weddingData.jsx  Satu kali fetch semua koleksi + statistik turunan
    format.js        Format Rupiah/tanggal, hitung mundur, persentase
  components/
    Layout.jsx       Sidebar, header, tombol keluar, mode gelap
    ui.jsx           Card, StatCard, Badge, ProgressBar, Table, dsb.
    Countdown.jsx    Hitung mundur ke hari H
  pages/             Dashboard, Budget, Administration, Vendors, Guests, Seserahan, Login
seed.js             Reset + impor data dari folder ./seed (hasil parsing Excel)
pb_migrations/      Skema koleksi PocketBase
```

## Catatan data

Angka pada aplikasi berasal langsung dari workbook
`Copy of Wedding Planner for Reina.xlsx`:

- Pemasukan **CPP Rp 50.000.000** + **CPW Rp 20.000.000** = Rp 70.000.000
- Pengeluaran **DP Gedung (PINDAD) Rp 5.000.000** + **DP MUA Rp 3.000.000** = Rp 8.000.000
- Saldo kas **Rp 62.000.000** → sisa menuju target Rp 85.000.000 = **Rp 23.000.000**
- Venue **Gedung PINDAD** Rp 15.000.000, dicicil 3 termin @ Rp 5.000.000
