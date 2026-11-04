# Materi Pemasaran & Video Remotion — Wedding Planner

Seluruh materi visual di folder `marketing/out/` dihasilkan secara terprogram menggunakan **Remotion** (`marketing/remotion/`) dari tangkapan layar **Live Demo** (`demo` / `demo123` — Rizky & Reina, Gedung PINDAD Bandung).

 Setiap materi menyandingkan:
1. **Tampilan Web Desktop (`1440×900` @2x Retina)** dengan efek **Zoom-In & Zoom-Out** pada metrik/tabel fitur utama.
2. **Tampilan Mobile iPhone (`390×844` @2x Retina)** lengkap dengan bingkai titanium, **Notch / Dynamic Island khas iPhone**, status bar iOS, dan home indicator.

---

## 1. Daftar File Siap Unggah (`marketing/out/`)

### A. Video Overview (MP4 H.264 — 30fps)

| File | Rasio | Resolusi | Durasi | Kegunaan |
| --- | --- | --- | --- | --- |
| `overview-reels-9x16.mp4` | **9:16** | `1080×1920` | 21,5 detik | Instagram Reels, Story, TikTok, YouTube Shorts |
| `overview-feed-4x5.mp4` | **4:5** | `1080×1350` | 21,5 detik | Postingan Video Feed Instagram |

### B. Carousel Postingan Foto Instagram (PNG — 4:5, 9:16, 1:1)

| File | Rasio | Resolusi | Fitur yang Dipamerkan |
| --- | --- | --- | --- |
| `ig-01-cover.png` | **4:5** | `1080×1350` | **Slide 1 (Hook):** Web Desktop + iPhone Mobile View dalam satu database |
| `ig-02-dasbor.png` | **4:5** | `1080×1350` | **Slide 2 (Dasbor):** Hitung mundur 469 hari, dana terkumpul Rp 62 jt, pengingat tenggat |
| `ig-03-anggaran.png` | **4:5** | `1080×1350` | **Slide 3 (Anggaran):** Pemasukan CPP & CPW, 86 pos biaya, kalkulator tabungan bulanan |
| `ig-04-tamu.png` | **4:5** | `1080×1350` | **Slide 4 (Tamu & RSVP):** 165 undangan (281 pax), prioritas A/B/C, kirim WA 1 klik |
| `ig-05-resepsi.png` | **4:5** | `1080×1350` | **Slide 5 (Meja Tamu Hari-H):** Check-in kehadiran 2 detik di gedung, pax aktual & suvenir |
| `ig-06-rundown.png` | **4:5** | `1080×1350` | **Slide 6 (Rundown Hari-H):** Jadwal menit ke menit (05.00–14.00), kontak PIC & ekspor `.ics` |
| `ig-07-vendor.png` | **4:5** | `1080×1350` | **Slide 7 (Vendor):** 52 daftar periksa tugas vendor, jatuh tempo & status pelunasan |
| `ig-08-admin-seserahan.png` | **4:5** | `1080×1350` | **Slide 8 (KUA & Seserahan):** 59 berkas N1–N4 KUA & 45 item seserahan + link Shopee |
| `ig-09-kado-privasi.png` | **4:5** | `1080×1350` | **Slide 9 (Angpao & Privasi):** Rekap amplop/QRIS/emas, Mode Gelap & proteksi akun Panitia |
| `ig-10-cta.png` | **4:5** | `1080×1350` | **Slide 10 (Live Demo CTA):** Kredensial uji coba langsung (`demo` / `demo123`) |
| `story-01-cover.png` | **9:16** | `1080×1920` | Cover Reels / Instagram Story (Pembuka) |
| `story-10-cta.png` | **9:16** | `1080×1920` | Instagram Story Penutup + Kredensial Akun Demo |
| `square-01-cover.png` | **1:1** | `1080×1080` | Alternatif Feed Persegi / Thumbnail Katalog |

---

## 2. Kredensial Demo Live

| Parameter | Nilai |
| --- | --- |
| **URL Aplikasi** | `https://43.156.236.102/wedding/` |
| **Username / Email** | `demo` |
| **Password** | `demo123` |

---

## 3. Cara Menjalankan & Merender Ulang dengan Remotion

```powershell
# 1. Ambil ulang screenshot terbaru dari server demo live (Web 1440x900 & Mobile 390x844 @2x)
python marketing/capture_live_shots.py

# 2. Render seluruh 13 gambar Instagram + 2 video MP4 sekaligus via Remotion
node marketing/render_all.mjs

# 3. Atau buka Remotion Studio di browser untuk pratinjau interaktif frame-by-frame
npm run remotion:studio
```

Naskah caption lengkap, rincian tipografi per slide, dan evaluasi penulisan tersedia di [`marketing/COPYWRITING.md`](./COPYWRITING.md).
