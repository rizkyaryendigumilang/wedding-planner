/**
 * Data & Naskah Penjualan Fitur — Wedding Planner
 * Mencakup:
 * - 10 Slide Carousel Instagram (4:5, 9:16, 1:1)
 * - 12 Adegan Video Rekaman Live Browser (11 Menu Web Desktop Penuh + 1 Sesi Khusus HP iPhone ber-Notch)
 *   Durasi total: 1200 frame @ 30fps = 40.0 detik (tempo cepat & ringkas untuk Reels/TikTok & Feed 4:5)
 */

export const BRAND = {
  name: "Wedding Planner",
  couple: "Rizky & Reina",
  venue: "Gedung PINDAD Bandung",
  weddingDate: "17 Februari 2028",
  demoUser: "demo",
  demoPass: "demo123",
};

export const THEME = {
  canvas: "#faf7f4",
  canvasWarm: "#f3ece4",
  ink: "#1c1917",
  inkMuted: "#44403c",
  inkFaint: "#78716c",
  line: "#e5dec9",
  rose: "#9a3450",
  roseSoft: "#b94460",
  brass: "#9a7432",
  sage: "#3b6e44",
  night: "#141118",
  nightCard: "#1d1922",
};

/**
 * 10 Slide Carousel Instagram (4:5 — 1080x1350) + Story (9:16 — 1080x1920) + Square (1:1 — 1080x1080)
 */
export const SLIDES = [
  {
    id: "ig-01-cover",
    section: "Aplikasi Persiapan Nikah • Web & HP",
    headline: "Semua urusan persiapan nikah rapi di satu tempat, bukan tercecer di 7 file Excel.",
    subcopy:
      "Atur tabungan & budget, daftar tamu, pengiriman undangan WhatsApp, jadwal bayar vendor, syarat berkas KUA, belanja seserahan, sampai meja buku tamu hari-H. Buka dari laptop atau HP, datanya selalu tersambung otomatis.",
    webShot: "d-dashboard",
    mobileShot: "m-dashboard",
    layout: "hero-combo",
    webZoom: { scale: 1.04, x: 0, y: 0 },
  },
  {
    id: "ig-02-dasbor",
    section: "Dasbor Kesiapan & Pengingat",
    headline: "Buka aplikasi, langsung tahu tugas apa yang harus dibereskan minggu ini.",
    subcopy:
      "Layar utama menampilkan hitung mundur menuju hari akad (473 hari), total tabungan terkumpul (Rp 62 juta dari target Rp 85 juta), persentase kesiapan tiap bagian acara, serta pengingat otomatis saat tagihan vendor mendekati jatuh tempo.",
    webShot: "d-dashboard",
    mobileShot: "m-dashboard",
    layout: "web-zoom-mobile",
    webZoom: { scale: 1.18, x: -36, y: -18 },
  },
  {
    id: "ig-03-anggaran",
    section: "Anggaran, Arus Kas & Target Tabungan",
    headline: "Atur budget Rp 85 juta tanpa rumus Excel. Tahu persis uang keluar ke mana.",
    subcopy:
      "Catat pemasukan tabungan pengantin pria & wanita, pisahkan biaya Lamaran/Seserahan dan Resepsi ke dalam 86 pos pengeluaran (gedung, katering, rias, dekorasi), lalu pantau selisih rencana budget dengan pengeluaran asli beserta target menabung bulanan.",
    webShot: "d-budget",
    mobileShot: "m-budget-wedding",
    layout: "web-zoom-mobile",
    webZoom: { scale: 1.18, x: -34, y: -22 },
  },
  {
    id: "ig-04-tamu",
    section: "Daftar Tamu & Undangan WhatsApp",
    headline: "Kelola 165 undangan (281 orang) dan kirim WhatsApp otomatis tanpa ketik ulang.",
    subcopy:
      "Kelompokkan tamu dari pihak pria atau wanita, keluarga besar, teman kantor, serta urutan prioritas A/B/C. Klik tombol WhatsApp di samping nama tamu untuk mengirim undangan digital yang otomatis menyapa nama masing-masing penerima.",
    webShot: "d-guests",
    mobileShot: "m-guests",
    layout: "web-zoom-mobile",
    webZoom: { scale: 1.16, x: -30, y: -20 },
  },
  {
    id: "ig-05-resepsi",
    section: "Meja Buku Tamu & Check-In Hari-H",
    headline: "Tamu tiba di gedung resepsi, cari namanya 2 detik, langsung tercatat hadir.",
    subcopy:
      "Dirancang khusus untuk layar HP petugas penerima tamu di lobi gedung. Tandai tamu yang sudah datang, catat jumlah orang yang masuk, pengambilan suvenir, nomor meja VIP, hingga tambah tamu baru yang datang langsung di tempat (walk-in).",
    webShot: "d-reception",
    mobileShot: "m-reception",
    layout: "web-zoom-mobile",
    webZoom: { scale: 1.18, x: -36, y: -18 },
  },
  {
    id: "ig-06-rundown",
    section: "Susunan Acara & Kontak PIC Hari-H",
    headline: "Jadwal acara menit demi menit, dari mulai rias pukul 05.00 subuh sampai selesai resepsi.",
    subcopy:
      "Susun jam acara untuk sesi Persiapan, Akad Nikah, dan Resepsi lengkap dengan nama penanggung jawab (PIC) serta nomor WhatsApp yang bisa langsung dihubungi. Jadwal dapat disimpan ke Google Calendar & Apple Calendar (.ics) atau dibagikan ke keluarga.",
    webShot: "d-rundown",
    mobileShot: "m-rundown",
    layout: "web-zoom-mobile",
    webZoom: { scale: 1.18, x: -34, y: -20 },
  },
  {
    id: "ig-07-vendor",
    section: "Checklist Tugas & Tagihan Vendor",
    headline: "52 daftar tugas vendor terpantau rapi. Tidak ada lagi lupa jadwal bayar DP katering.",
    subcopy:
      "Lacak setiap tahap persiapan vendor mulai dari survei lokasi, tanda jadi (booking), cicilan DP, fitting baju, hingga pelunasan akhir. Dilengkapi penanda sisa hari menuju tanggal jatuh tempo agar tidak ada jadwal pembayaran yang terlewat.",
    webShot: "d-vendors",
    mobileShot: "m-vendors",
    layout: "web-zoom-mobile",
    webZoom: { scale: 1.18, x: -34, y: -18 },
  },
  {
    id: "ig-08-admin-seserahan",
    section: "Syarat Berkas KUA & Belanja Seserahan",
    headline: "Cek 59 syarat dokumen KUA (N1–N4) dan 45 barang seserahan lengkap dengan link Shopee.",
    subcopy:
      "Pantau kelengkapan surat pengantar RT/RW, kelurahan, puskesmas, hingga pendaftaran KUA untuk pengantin pria dan wanita secara berdampingan. Di halaman Seserahan, simpan link toko online beserta perbandingan harga perkiraan dan harga beli asli.",
    webShot: "d-administration",
    mobileShot: "m-seserahan",
    layout: "web-zoom-mobile",
    webZoom: { scale: 1.18, x: -34, y: -18 },
  },
  {
    id: "ig-09-kado-privasi",
    section: "Catatan Amplop, Mode Gelap & Akses Panitia",
    headline: "Catat amplop & kado pernikahan dengan rapi. Rahasia budget terkunci dari panitia.",
    subcopy:
      "Rekap nilai amplop tunai, transfer QRIS, logam mulia, serta kado barang beserta status ucapan terima kasih. Berikan login khusus Panitia/WO untuk menjaga meja buku tamu & rundown acara tanpa mereka bisa membuka data tabungan dan budget Anda.",
    webShot: "d-gifts",
    mobileShot: "m-dashboard-dark",
    layout: "web-zoom-mobile",
    webZoom: { scale: 1.18, x: -34, y: -18 },
  },
  {
    id: "ig-10-cta",
    section: "Coba Akun Demo Gratis",
    headline: "Coba sendiri aplikasinya sekarang. Semua contoh data sudah terisi dan siap dicoba.",
    subcopy:
      "Masuk menggunakan akun demo di bawah lewat browser laptop maupun HP untuk mencoba langsung pengisian budget, kirim undangan WhatsApp, simulasi check-in buku tamu, hingga pengaturan rundown acara.",
    webShot: "d-dashboard",
    mobileShot: "m-dashboard",
    layout: "cta-demo",
    webZoom: { scale: 1.05, x: 0, y: 0 },
  },
];

/**
 * 12 Adegan Video Rekaman Live Browser (40 Detik / 1200 Frame @ 30fps):
 * - Adegan 1–11: Layar penuh Web Desktop masuk ke semua 11 menu satu per satu
 *   dengan kursor aktif & efek kamera Zoom-In (ke sidebar lalu ke isi halaman) & Zoom-Out.
 * - Adegan 12: Sesi khusus tampilan HP iPhone ber-Notch (Mobile View Live + Dark Mode + Akun Demo).
 */
export const VIDEO_SCENES = [
  {
    id: "01-dashboard",
    mode: "web-full",
    durationInFrames: 95,
    menuBadge: "MENU 01 / 11 • DASHBOARD",
    section: "Menu 1: Dashboard Utama & Pengingat",
    title: "Menu Dashboard: Pantau hitung mundur & kesiapan acara dalam satu layar.",
    subtitle:
      "Begitu masuk, langsung terlihat sisa hari menuju akad, dana tabungan terkumpul, progres persiapan, dan peringatan tugas minggu ini.",
    highlights: [
      "Hitung mundur waktu menuju hari-H (hari, jam, menit, detik)",
      "Progres tabungan Rp 62 juta dari target Rp 85 juta",
      "Pusat peringatan otomatis: tagihan vendor & follow-up tamu VIP",
    ],
    videoClip: "web-01-dashboard.mp4",
    webShot: "d-dashboard",
    mobileShot: "m-dashboard",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 24, scale: 1.32, x: 95, y: 38 },
      { frame: 64, scale: 1.24, x: -38, y: -22 },
      { frame: 90, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "02-itinerary",
    mode: "web-full",
    durationInFrames: 95,
    menuBadge: "MENU 02 / 11 • ITINERARY",
    section: "Menu 2: Itinerary & Rundown Hari-H",
    title: "Menu Itinerary: Susunan acara menit demi menit & kontak WA PIC.",
    subtitle:
      "Atur jadwal rias subuh, prosesi akad, hingga resepsi. Dilengkapi tombol hubungi penanggung jawab (PIC) & ekspor ke Google/Apple Calendar (.ics).",
    highlights: [
      "Filter jadwal per sesi: Persiapan, Akad Nikah, & Resepsi",
      "Tombol WhatsApp langsung ke PIC tiap seksi acara",
      "Ekspor jadwal ke aplikasi Kalender HP (.ics) & file CSV",
    ],
    videoClip: "web-02-itinerary.mp4",
    webShot: "d-rundown",
    mobileShot: "m-rundown",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 22, scale: 1.34, x: 105, y: 35 },
      { frame: 64, scale: 1.25, x: -42, y: -20 },
      { frame: 90, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "03-reception",
    mode: "web-full",
    durationInFrames: 95,
    menuBadge: "MENU 03 / 11 • MEJA TAMU",
    section: "Menu 3: Meja Buku Tamu & Check-In Resepsi",
    title: "Menu Meja Tamu: Cari nama tamu 2 detik, tandai hadir & suvenir.",
    subtitle:
      "Dipakai oleh petugas penerima tamu di lobi gedung untuk mencatat kehadiran aktual, jumlah orang masuk, nomor meja VIP, dan tamu walk-in.",
    highlights: [
      "Pencarian nama tamu instan saat antrean di gedung resepsi",
      "Catat jumlah orang hadir (pax), meja VIP, & pengambilan suvenir",
      "Tambah tamu baru yang datang langsung di tempat (Walk-In)",
    ],
    videoClip: "web-03-reception.mp4",
    webShot: "d-reception",
    mobileShot: "m-reception",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 22, scale: 1.34, x: 105, y: 28 },
      { frame: 64, scale: 1.26, x: -40, y: -18 },
      { frame: 90, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "04-budget",
    mode: "web-full",
    durationInFrames: 105,
    menuBadge: "MENU 04 / 11 • ANGGARAN",
    section: "Menu 4: Anggaran, Arus Kas, Seserahan & Pernikahan",
    title: "Menu Anggaran: Kelola arus kas, biaya Seserahan, & 86 pos pernikahan.",
    subtitle:
      "Catat pemasukan tabungan pengantin pria & wanita, pindah antar tab Arus Kas, Seserahan, dan Pernikahan, serta pantau sisa tagihan vendor.",
    highlights: [
      "3 Sub-Tab Lengkap: Arus Kas Tabungan, Seserahan, & Pernikahan",
      "Bandingkan rencana budget vs pengeluaran asli di 86 pos biaya",
      "Hitung otomatis target tabungan per bulan sampai hari-H",
    ],
    videoClip: "web-04-budget.mp4",
    webShot: "d-budget",
    mobileShot: "m-budget-wedding",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 24, scale: 1.34, x: 105, y: 20 },
      { frame: 72, scale: 1.28, x: -42, y: -25 },
      { frame: 98, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "05-gifts",
    mode: "web-full",
    durationInFrames: 95,
    menuBadge: "MENU 05 / 11 • KADO & ANGPAO",
    section: "Menu 5: Rekap Kado, Amplop Tunai, QRIS & Emas",
    title: "Menu Kado & Angpao: Catat amplop tunai, transfer QRIS, & kado fisik.",
    subtitle:
      "Rekap seluruh tanda kasih dari tamu undangan beserta taksiran nilai dan penanda status pengiriman pesan ucapan terima kasih.",
    highlights: [
      "Pisahkan kategori: Amplop Tunai, Transfer/QRIS, Emas, & Kado Fisik",
      "Tandai tamu yang sudah dikirimi ucapan terima kasih",
      "Data kado & nominal uang otomatis dikunci dari akun Panitia",
    ],
    videoClip: "web-05-gifts.mp4",
    webShot: "d-gifts",
    mobileShot: "m-gifts",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 22, scale: 1.34, x: 105, y: 12 },
      { frame: 64, scale: 1.25, x: -40, y: -20 },
      { frame: 90, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "06-guests",
    mode: "web-full",
    durationInFrames: 95,
    menuBadge: "MENU 06 / 11 • DAFTAR TAMU",
    section: "Menu 6: Database Tamu & Kirim Undangan WhatsApp",
    title: "Menu Tamu: Kelola 165 undangan (281 orang) & kirim WA sekali klik.",
    subtitle:
      "Kelompokkan tamu dari pihak pria/wanita, keluarga, teman kantor, dan prioritas A/B/C. Kirim pesan WhatsApp otomatis menyapa nama tamu.",
    highlights: [
      "Tombol Kirim WA otomatis menyisipkan nama tamu & link undangan",
      "Filter cepat berdasarkan pihak CPP/CPW, kategori, & prioritas A/B/C",
      "Impor dan ekspor daftar tamu lewat file Excel/CSV",
    ],
    videoClip: "web-06-guests.mp4",
    webShot: "d-guests",
    mobileShot: "m-guests",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 22, scale: 1.34, x: 105, y: 4 },
      { frame: 64, scale: 1.26, x: -42, y: -22 },
      { frame: 90, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "07-vendors",
    mode: "web-full",
    durationInFrames: 95,
    menuBadge: "MENU 07 / 11 • VENDOR",
    section: "Menu 7: Checklist Tugas & Jatuh Tempo Vendor",
    title: "Menu Vendor: Pantau 52 tugas vendor dari booking hingga lunas.",
    subtitle:
      "Lacak progres survei gedung, food tasting katering, fitting busana, hingga tanggal jatuh tempo pembayaran DP setiap vendor.",
    highlights: [
      "52 daftar tugas persiapan vendor dari H-12 bulan sampai hari-H",
      "Penanda sisa hari menuju tanggal jatuh tempo pembayaran",
      "Filter tugas yang belum selesai, sedang berjalan, atau tuntas",
    ],
    videoClip: "web-07-vendors.mp4",
    webShot: "d-vendors",
    mobileShot: "m-vendors",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 22, scale: 1.34, x: 105, y: -4 },
      { frame: 64, scale: 1.25, x: -38, y: -20 },
      { frame: 90, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "08-administration",
    mode: "web-full",
    durationInFrames: 95,
    menuBadge: "MENU 08 / 11 • ADMINISTRASI KUA",
    section: "Menu 8: Syarat Berkas KUA & Catatan Sipil",
    title: "Menu Administrasi: Cek 59 syarat dokumen KUA (N1–N4) pria & wanita.",
    subtitle:
      "Panduan lengkap pengurusan surat pengantar RT/RW, kelurahan, puskesmas, hingga pendaftaran KUA untuk CPP dan CPW secara berdampingan.",
    highlights: [
      "59 checklist berkas KUA terpisah untuk Pengantin Pria & Wanita",
      "Meliputi surat N1–N4, KTP, KK, pasfoto latar biru, & imunisasi TT",
      "Pantau persentase kelengkapan dokumen legal sebelum pendaftaran",
    ],
    videoClip: "web-08-administration.mp4",
    webShot: "d-administration",
    mobileShot: "m-administration",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 22, scale: 1.34, x: 105, y: -12 },
      { frame: 64, scale: 1.25, x: -38, y: -20 },
      { frame: 90, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "09-seserahan",
    mode: "web-full",
    durationInFrames: 95,
    menuBadge: "MENU 09 / 11 • SESERAHAN",
    section: "Menu 9: Daftar Belanja Seserahan & Link Toko Online",
    title: "Menu Seserahan: 45 barang hantaran lengkap dengan link Shopee.",
    subtitle:
      "Simpan link produk Shopee/Tokopedia di setiap barang seserahan, bandingkan harga perkiraan dengan harga beli, dan tandai status pembelian.",
    highlights: [
      "45 barang seserahan terbagi rapi ke dalam 7 kategori hantaran",
      "Simpan & buka link toko online (Shopee/Tokopedia) sekali klik",
      "Perbandingan otomatis total estimasi vs pengeluaran belanja asli",
    ],
    videoClip: "web-09-seserahan.mp4",
    webShot: "d-seserahan",
    mobileShot: "m-seserahan",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 22, scale: 1.34, x: 105, y: -20 },
      { frame: 64, scale: 1.25, x: -40, y: -20 },
      { frame: 90, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "10-gallery",
    mode: "web-full",
    durationInFrames: 90,
    menuBadge: "MENU 10 / 11 • GALERI",
    section: "Menu 10: Galeri Foto & Moodboard Referensi",
    title: "Menu Galeri: Simpan foto referensi dekorasi, busana, & dokumentasi.",
    subtitle:
      "Kumpulkan foto inspirasi pelaminan, baju akad, rias, hingga foto prewedding di satu galeri bersama agar mudah ditunjukkan ke vendor.",
    highlights: [
      "Kelompokkan foto berdasarkan kategori: Dekorasi, Busana, & Rias",
      "Tampilan galeri bersih yang bisa diakses oleh pasangan & WO",
      "Unggah foto referensi beserta catatan detail untuk vendor",
    ],
    videoClip: "web-10-gallery.mp4",
    webShot: "d-dashboard",
    mobileShot: "m-dashboard",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 22, scale: 1.34, x: 105, y: -28 },
      { frame: 60, scale: 1.24, x: -36, y: -18 },
      { frame: 85, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "11-settings",
    mode: "web-full",
    durationInFrames: 95,
    menuBadge: "MENU 11 / 11 • PENGATURAN",
    section: "Menu 11: Pengaturan Profil, Rekening QRIS, Adat & Tema",
    title: "Menu Pengaturan: Atur profil pengantin, rekening QRIS, adat, & akses.",
    subtitle:
      "Sesuaikan nama pasangan, tanggal & gedung acara, nomor rekening/QRIS amplop digital, kategori adat, zona waktu, hingga tempat sampah data.",
    highlights: [
      "Sub-tab Rekening & QRIS, Kategori & Adat, serta Zona Waktu & Tema",
      "Pemisahan hak akses akun Pengantin (Penuh) vs akun Panitia/WO",
      "Fitur Recycle Bin (Tempat Sampah) untuk memulihkan data terhapus",
    ],
    videoClip: "web-11-settings.mp4",
    webShot: "d-dashboard",
    mobileShot: "m-settings",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 22, scale: 1.34, x: 105, y: -34 },
      { frame: 64, scale: 1.24, x: -36, y: -18 },
      { frame: 90, scale: 1.0, x: 0, y: 0 },
    ],
  },
  {
    id: "12-mobile-showcase",
    mode: "mobile-showcase",
    durationInFrames: 155,
    menuBadge: "SESI MOBILE VIEW • IPHONE NOTCH",
    section: "Tampilan Mobile HP iPhone (Mode Terang & Gelap)",
    title: "Tampilan HP iPhone ber-Notch: Praktis dibawa ke gedung & survei vendor.",
    subtitle:
      "Buka dari HP kapan saja dengan navigasi tab bawah yang nyaman di jempol, lengkap dengan Mode Terang & Mode Gelap. Coba akun demonya sekarang!",
    highlights: [
      "Navigasi bawah iPhone: Dashboard, Itinerary, Meja Tamu, & Anggaran",
      "Mode Terang & Mode Gelap (Dark Mode) sekali sentuh",
      "Uji gratis seluruh 11 menu -> Username: demo | Password: demo123",
    ],
    videoClip: "mobile-12-showcase.mp4",
    webShot: "d-dashboard",
    mobileShot: "m-dashboard-dark",
    isOutro: true,
  },
];
