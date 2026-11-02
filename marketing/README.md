# Materi posting — Wedding Planner

Folder `out/` berisi gambar siap unggah. Semua sudah dipotong ke rasio Instagram
(4:5 feed, 9:16 story, 1:1 persegi) tanpa perlu cropping ulang.

| File | Rasio | Ukuran | Dipakai untuk |
| --- | --- | --- | --- |
| `ig-01-cover.png` | 4:5 | 1080×1350 | Slide 1 carousel (hook) |
| `ig-02-dasbor.png` | 4:5 | 1080×1350 | Slide 2 |
| `ig-03-anggaran.png` | 4:5 | 1080×1350 | Slide 3 |
| `ig-04-tamu.png` | 4:5 | 1080×1350 | Slide 4 |
| `ig-05-vendor.png` | 4:5 | 1080×1350 | Slide 5 |
| `ig-06-seserahan.png` | 4:5 | 1080×1350 | Slide 6 |
| `ig-07-cta.png` | 4:5 | 1080×1350 | Slide 7 (penutup + demo) |
| `story-01-cover.png` | 9:16 | 1080×1920 | Story / cover Reels |
| `square-01-cover.png` | 1:1 | 1080×1080 | Feed persegi (alternatif) |

---

## Caption carousel

```
Rencana nikah biasanya berakhir di 7 spreadsheet berbeda,
3 grup WhatsApp, dan satu folder Drive yang isinya "IMG_2043 (2).jpg".

Wedding Planner menyatukan semuanya:

— Dasbor: hitung mundur, dana terkumpul, dan apa yang perlu dibereskan minggu ini
— Anggaran: pemasukan CPP & CPW, pengeluaran, DP vendor, sisa target tabungan otomatis
— Tamu: circle, prioritas A/B/C, pax, status RSVP, undangan digital atau fisik
— Vendor: checklist dengan tenggat dan status pembayaran
— Seserahan: daftar barang, link Shopee, anggaran vs harga aktual
— Galeri prewedding, rundown, dan administrasi dalam satu tempat

Jalan di HP, tablet, dan laptop. Tiap akun punya datanya sendiri — daftar dan
langsung mulai dari nol.

Mau lihat isinya dulu? Saya buka akun demo berisi data contoh lengkap
(165 tamu, 86 pos anggaran, 45 item seserahan).
Komentar "DEMO" atau DM, saya kirim aksesnya.

#weddingplanner #persiapanpernikahan #weddingindonesia #calonpengantin
#anggaranpernikahan #undangandigital #weddingorganizer #nikah2027
```

Catatan: kalau mau lebih ringkas, potong bagian daftar fitur — sisakan tiga
poin pertama. Baris pertama ("Rencana nikah biasanya berakhir di...") adalah
yang menentukan orang berhenti atau lanjut scroll, jadi jangan diubah.

---

## Teks story

Taruh `story-01-cover.png` sebagai background, lalu tempel teks ini di bagian
bawah (jangan di tengah — bagian tengah ketutup UI Instagram):

```
Data contoh lengkap. Boleh diutak-atik.
DM "DEMO" untuk akses.
```

Tambahkan link sticker ke DM, bukan ke URL langsung.

---

## Info akun demo

| | |
| --- | --- |
| URL | `https://43.156.236.102/wedding/` |
| Username | `demo` |
| Sandi | `demo123` |

Isi akun demo: 165 tamu, 86 pos anggaran, 59 administrasi, 45 item seserahan,
52 checklist vendor, data Rizky & Reina dengan venue Gedung PINDAD.

**Penting:** akun demo kedaluwarsa **7 November 2026**. Aplikasi akan menolak
login setelah tanggal itu, jadi perpanjang dulu sebelum posting:

- buka PocketBase, koleksi `users`, record username `demo`
- ubah `demo_expires_at` ke tanggal baru (misal +30 hari)

Kalau mau posting dalam waktu lama, sebaiknya jangan pakai akun demo publik —
kirim akses sekali pakai per calon pembeli.

---

## Urutan unggah

1. Carousel: `ig-01` sampai `ig-07` (urutan ini sudah bercerita: hook → fitur
   → bukti layar → ajakan).
2. Slide 1 dan 7 adalah yang paling sering dilihat ulang di profil — jangan
   ganti isinya dengan screenshot mentah.
3. Story: unggah `story-01-cover.png` di hari yang sama dengan carousel.
4. Kalau butuh versi persegi untuk feed grid yang rapat, pakai
   `square-01-cover.png`.

---

## Versi bergerak (untuk Reels)

`reel.html` adalah tur otomatis 9:16 berisi lima layar aplikasi yang berganti
tiap 3,4 detik, lengkap dengan keterangan dan progress bar.

```powershell
# setelah server jalan, buka:
# http://127.0.0.1:8126/m/reel.html
```

Cara merekam: tekan F11 (layar penuh), lalu rekam dengan Win + Alt + R atau
OBS. Hasil rekamannya dipotong ke 9:16 — aplikasi Instagram akan menerima
video dengan rasio itu langsung.

Kalau ingin berhenti di satu momen untuk dicek, tambahkan `?t=7` (detik ke-7
akan dibekukan).

---

## Cara membuat ulang gambar

Semua gambar dihasilkan dari HTML, jadi gampang diubah tanpa Photoshop.

```powershell
# 1. build aplikasi + jalankan server lokal (dist + folder marketing)
npm run build
cd marketing
python serve.py 8126

# 2. render semua sembilan gambar sekaligus (Chrome headless, 2x lalu
#    diperkecil ke 1080 supaya tepi teks tetap tajam)
powershell -NoProfile -ExecutionPolicy Bypass -File render.ps1
```

`render.ps1` menulis PNG ke `out/_raw` dalam resolusi 2x, lalu gambar itu
diperkecil dengan Pillow. Kalau hanya ingin melihat satu slide di browser:

```
http://127.0.0.1:8126/m/slide.html?n=1          (n = 1..7)
http://127.0.0.1:8126/m/slide.html?n=1&fmt=story
http://127.0.0.1:8126/m/slide.html?n=1&fmt=square
```

Semua slide juga bisa dilihat sekaligus di `http://127.0.0.1:8126/m/preview.html`.

Teks, warna, dan ukuran ada di `marketing/slide.html` (objek `slides`).
Screenshot aplikasi ada di `marketing/shots/` dan bisa diganti kapan saja —
kalau diganti, jalankan ulang `render.ps1` dengan `imgv` baru supaya cache
browser tidak memakai gambar lama.
