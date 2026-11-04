/**
 * Data & Naskah Penjualan Fitur — Wedding Planner
 * Disusun mengikuti prinsip Technical Writer, No-AI-Slop, dan Kill-AI-Slop:
 * - Bahasa Indonesia sehari-hari yang mudah dimengerti calon pengantin & keluarga
 * - Kalimat aktif (Active Voice), langsung menjelaskan fungsi & cara kerja tiap fitur
 * - Elaborasi sub-fitur secara konkret berdasarkan data nyata di akun demo (demo / demo123)
 * - Tanpa alamat IP server dan tanpa jargon birokrasi/klise AI
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
      "Catat pemasukan tabungan pengantin pria & wanita, pisahkan biaya Lamaran/Sangjit dan Resepsi ke dalam 86 pos pengeluaran (gedung, katering, rias, dekorasi), lalu pantau selisih rencana budget dengan pengeluaran asli beserta target menabung bulanan.",
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
 * Skenario Video Overview Remotion (Reels 9:16 & Feed 4:5)
 * Menampilkan Web View dengan animasi Zoom-In / Zoom-Out + iPhone Notch Mobile View
 */
export const VIDEO_SCENES = [
  {
    id: "intro",
    durationInFrames: 120, // 4.0s @ 30fps
    section: "Aplikasi Persiapan Nikah • Web & iPhone",
    title: "Semua persiapan nikah rapi di satu tempat, tersambung di laptop dan HP.",
    subtitle:
      "Atur tabungan & budget, daftar tamu, undangan WhatsApp, jadwal vendor, berkas KUA, seserahan, hingga buku tamu resepsi tanpa pindah-pindah file spreadsheet.",
    highlights: [
      "Tampilan Web Desktop & HP iPhone sinkron otomatis",
      "Hitung mundur hari-H & pengingat tugas mingguan",
      "Akun terpisah untuk Pengantin (Penuh) & Panitia/WO",
    ],
    webShot: "d-dashboard",
    mobileShot: "m-dashboard",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 55, scale: 1.26, x: -45, y: -22 },
      { frame: 105, scale: 1.02, x: 0, y: 0 },
    ],
    mobileScroll: [0, -28],
  },
  {
    id: "budget",
    durationInFrames: 120, // 4.0s
    section: "Anggaran, Arus Kas & Tabungan",
    title: "Atur budget Rp 85 juta di 86 pos biaya tanpa pusing rumus manual.",
    subtitle:
      "Catat tabungan pengantin pria & wanita, pisahkan biaya Lamaran dan Resepsi, lalu pantau otomatis selisih rencana budget dengan pengeluaran asli.",
    highlights: [
      "Pisahkan pos biaya Lamaran/Sangjit & Resepsi",
      "Hitung otomatis target tabungan per bulan hingga hari-H",
      "Pantau status lunas, cicilan DP, dan sisa tagihan",
    ],
    webShot: "d-budget",
    mobileShot: "m-budget-wedding",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 55, scale: 1.28, x: -42, y: -25 },
      { frame: 105, scale: 1.02, x: 0, y: 0 },
    ],
    mobileScroll: [0, -36],
  },
  {
    id: "guests",
    durationInFrames: 120, // 4.0s
    section: "Daftar Tamu & Undangan WhatsApp",
    title: "Kelola 165 undangan (281 orang) & kirim pesan WhatsApp sekali klik.",
    subtitle:
      "Kelompokkan tamu dari pihak pria/wanita, keluarga, teman kantor, dan prioritas A/B/C. Pesan WhatsApp otomatis menyapa nama masing-masing tamu.",
    highlights: [
      "Template pesan WhatsApp otomatis berisi nama tamu",
      "Filter cepat status konfirmasi hadir (RSVP) & jumlah orang",
      "Impor & ekspor data tamu lewat file CSV/Excel kapan saja",
    ],
    webShot: "d-guests",
    mobileShot: "m-guests",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 55, scale: 1.26, x: -38, y: -24 },
      { frame: 105, scale: 1.0, x: 0, y: 0 },
    ],
    mobileScroll: [0, -32],
  },
  {
    id: "harih",
    durationInFrames: 120, // 4.0s
    section: "Meja Buku Tamu & Rundown Hari-H",
    title: "Check-in tamu di gedung 2 detik & jadwal acara menit demi menit.",
    subtitle:
      "Petugas buku tamu cukup buka dari HP untuk mencatat tamu hadir, suvenir, dan tamu walk-in. Jadwal rundown lengkap dengan kontak WA penanggung jawab (PIC).",
    highlights: [
      "Layar khusus penerima tamu: cari nama & check-in instan",
      "Rundown Persiapan, Akad, & Resepsi mulai pukul 05.00",
      "Simpan jadwal acara ke Google & Apple Calendar (.ics)",
    ],
    webShot: "d-reception",
    mobileShot: "m-rundown",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 55, scale: 1.26, x: -42, y: -22 },
      { frame: 105, scale: 1.02, x: 0, y: 0 },
    ],
    mobileScroll: [0, -34],
  },
  {
    id: "vendors-seserahan",
    durationInFrames: 120, // 4.0s
    section: "Vendor, Berkas KUA & Seserahan",
    title: "52 tugas vendor, 59 berkas KUA (N1–N4), & 45 barang seserahan.",
    subtitle:
      "Pantau tenggat pembayaran DP vendor, cek kelengkapan surat nikah KUA pria & wanita, serta simpan link belanja Shopee/Tokopedia untuk tiap seserahan.",
    highlights: [
      "Indikator sisa hari menuju jatuh tempo pembayaran vendor",
      "Checklist dokumen N1–N4, puskesmas, & rekomendasi KUA",
      "Daftar belanja seserahan dengan link toko online langsung",
    ],
    webShot: "d-vendors",
    mobileShot: "m-seserahan",
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 55, scale: 1.26, x: -40, y: -22 },
      { frame: 105, scale: 1.0, x: 0, y: 0 },
    ],
    mobileScroll: [0, -30],
  },
  {
    id: "gifts-cta",
    durationInFrames: 120, // 4.0s
    section: "Rekap Amplop, Privasi & Akun Demo",
    title: "Catat amplop & kado dengan aman. Coba akun demo sekarang.",
    subtitle:
      "Rekap amplop tunai, QRIS, emas, dan kado fisik. Data keuangan terkunci rapat dari akun Panitia/WO. Uji semua fiturnya gratis menggunakan akun demo.",
    highlights: [
      "Rekap amplop tunai, QRIS, emas & status ucapan terima kasih",
      "Mode Terang & Mode Gelap yang nyaman di mata",
      "Coba gratis dengan Username: demo | Password: demo123",
    ],
    webShot: "d-gifts",
    mobileShot: "m-dashboard-dark",
    isOutro: true,
    cameraKeyframes: [
      { frame: 0, scale: 1.0, x: 0, y: 0 },
      { frame: 55, scale: 1.24, x: -40, y: -20 },
      { frame: 105, scale: 1.02, x: 0, y: 0 },
    ],
    mobileScroll: [0, -24],
  },
];
