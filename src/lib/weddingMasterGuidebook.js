import { formatDateFormal, formatRupiah } from "./format";
import { getCoupleDisplayName } from "./couple";

/**
 * Membangun dokumen HTML Buku Panduan Pernikahan (Wedding Master Guidebook)
 * yang siap dicetak langsung atau disimpan sebagai PDF (A4).
 */
export function generateMasterGuidebookHtml({
  couple,
  rundowns = [],
  vendors = [],
  guests = [],
  _settings = {},
  user,
}) {
  const coupleTitle = getCoupleDisplayName(couple, user, "Calon Pengantin");
  const cppName = couple?.cpp_full_name || couple?.cpp_nickname || "Pengantin Pria";
  const cpwName = couple?.cpw_full_name || couple?.cpw_nickname || "Pengantin Wanita";
  const venue = couple?.venue || "Gedung Pernikahan";
  const weddingDate = couple?.wedding_date ? formatDateFormal(couple.wedding_date) : "Tanggal Belum Ditentukan";

  // Urutkan agenda rundown berdasarkan waktu
  const sortedRundowns = [...rundowns].sort((a, b) => (a.time_start || "").localeCompare(b.time_start || ""));

  // Kelompokkan vendor berdasarkan kategori
  const vendorByCategory = new Map();
  vendors.forEach((v) => {
    const cat = v.category || "Vendor Lainnya";
    if (!vendorByCategory.has(cat)) vendorByCategory.set(cat, []);
    vendorByCategory.get(cat).push(v);
  });

  // Meja tamu & VIP
  const seatedGuests = guests.filter((g) => g.table_number && g.table_number.trim() !== "");
  const tableGroups = new Map();
  seatedGuests.forEach((g) => {
    const t = g.table_number.trim();
    if (!tableGroups.has(t)) tableGroups.set(t, []);
    tableGroups.get(t).push(g);
  });
  const sortedTables = [...tableGroups.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Buku Panduan Pernikahan — ${coupleTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: #1c1917;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    .cover-page {
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      border: 3px double #78716c;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .cover-header {
      margin-top: 30px;
    }
    .cover-kicker {
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #78716c;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .cover-title {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 24pt;
      font-weight: 700;
      color: #1c1917;
      letter-spacing: 0.05em;
      line-height: 1.25;
      margin: 12px 0 6px 0;
    }
    .cover-subtitle {
      font-size: 11pt;
      color: #57534e;
      font-style: italic;
    }
    .cover-ornament {
      width: 140px;
      height: 2px;
      background: #b94460;
      margin: 24px auto;
    }
    .cover-names {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 26pt;
      font-weight: bold;
      color: #9a3450;
      margin: 30px 0;
    }
    .cover-details {
      margin-top: 20px;
      font-size: 11pt;
      color: #292524;
      line-height: 1.8;
    }
    .cover-footer {
      font-size: 9pt;
      color: #78716c;
      border-top: 1px solid #d6d3d1;
      padding-top: 12px;
      width: 80%;
      margin-bottom: 20px;
    }
    h2.section-heading {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 15pt;
      font-weight: 700;
      color: #9a3450;
      border-bottom: 2px solid #b94460;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 14px;
    }
    p.section-desc {
      font-size: 9.5pt;
      color: #57534e;
      margin-top: -8px;
      margin-bottom: 16px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 9pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #e7e5e4;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    table.data-table th {
      background-color: #f5f5f4;
      font-weight: 600;
      color: #292524;
    }
    table.data-table tr:nth-child(even) td {
      background-color: #fafaf9;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
    }
    .badge-rose {
      background: #fdf3f4;
      color: #9a3450;
      border: 1px solid #eda3ae;
    }
    .badge-sage {
      background: #f2f7f2;
      color: #3b6442;
      border: 1px solid #c2dbc4;
    }
    .info-card {
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      background: #fafaf9;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .rule-box {
      border-left: 3px solid #b94460;
      padding-left: 10px;
      margin-bottom: 10px;
      font-size: 9.5pt;
    }
    @media screen {
      body {
        max-width: 820px;
        margin: 20px auto;
        padding: 24px;
        background: #f5f5f4;
      }
      .page-break {
        border-bottom: 3px dashed #d6d3d1;
        margin: 30px 0;
        padding-bottom: 20px;
      }
    }
  </style>
</head>
<body>

  <!-- ==================== HALAMAN 1: COVER ==================== -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="cover-kicker">Buku Panduan Pernikahan</div>
      <div class="cover-title">PANDUAN ACARA &amp; TEKNIKAL</div>
      <div class="cover-subtitle">Official Wedding Master Guidebook &amp; Event Itinerary</div>
      <div class="cover-ornament"></div>
    </div>

    <div class="cover-names">
      ${cppName}
      <div style="font-size: 16pt; font-family: sans-serif; font-weight: 300; margin: 4px 0; color: #78716c;">&amp;</div>
      ${cpwName}
    </div>

    <div class="cover-details">
      <div><strong>Hari &amp; Tanggal:</strong> ${weddingDate}</div>
      <div><strong>Lokasi Acara:</strong> ${venue}</div>
      ${couple?.notes ? `<div style="margin-top: 8px; font-style: italic; color: #57534e;">Tema: ${couple.notes}</div>` : ""}
    </div>

    <div class="cover-footer">
      Dokumen ini merupakan pedoman resmi koordinasi bagi seluruh Panitia Keluarga, Wedding Organizer (WO), serta Vendor Pendukung.
      Mohon disimpan dan dibawa selama gladi bersih &amp; hari pelaksanaan acara.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== HALAMAN 2: KONTAK DARURAT & PANITIA ==================== -->
  <h2 class="section-heading">1. Struktur Panitia &amp; Kontak Penting</h2>
  <p class="section-desc">Daftar narahubung utama untuk koordinasi lapangan dan penanganan situasi darurat.</p>

  <div class="info-grid">
    <div class="info-card">
      <strong>Mempelai Pria (CPP)</strong><br>
      ${cppName}<br>
      <span style="color: #78716c; font-size: 9pt;">No. Kontak: Terdaftar di sistem</span>
    </div>
    <div class="info-card">
      <strong>Mempelai Wanita (CPW)</strong><br>
      ${cpwName}<br>
      <span style="color: #78716c; font-size: 9pt;">No. Kontak: Terdaftar di sistem</span>
    </div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">Posisi / Peran</th>
        <th style="width: 35%;">Penanggung Jawab (PIC)</th>
        <th style="width: 40%;">Tugas Utama</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Ketua Panitia / Lapangan</strong></td>
        <td>Koordinator Keluarga</td>
        <td>Memastikan kelancaran seluruh rangkaian acara &amp; komando keputusan taktis</td>
      </tr>
      <tr>
        <td><strong>Koordinator WO</strong></td>
        <td>Tim Wedding Organizer</td>
        <td>Manajemen panggung, briefing vendor, dan kesesuaian waktu rundown</td>
      </tr>
      <tr>
        <td><strong>PIC Konsumsi &amp; Katering</strong></td>
        <td>Panitia Konsumsi</td>
        <td>Memantau pengeluaran porsi katering, refill VIP, dan serah terima sisa konsumsi</td>
      </tr>
      <tr>
        <td><strong>PIC Kotak Angpao &amp; Kado</strong></td>
        <td>Keluarga Inti Terpilih</td>
        <td>Memegang kunci kotak angpao, pengawalan berkas amplop &amp; pencatatan kado fisik</td>
      </tr>
      <tr>
        <td><strong>PIC Tamu VIP &amp; Meja</strong></td>
        <td>Penerima Tamu VIP</td>
        <td>Mengarahkan tamu kehormatan/pejabat ke meja khusus yang telah dialokasikan</td>
      </tr>
      <tr>
        <td><strong>PIC Mahar &amp; Dokumen KUA</strong></td>
        <td>Keluarga Pendamping</td>
        <td>Mempersiapkan buku nikah, cincin kawin, berkas administrasi dan seserahan</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== HALAMAN 3: SUSUNAN ACARA (RUNDOWN) ==================== -->
  <h2 class="section-heading">2. Susunan Acara Detik-per-Detik (Master Rundown)</h2>
  <p class="section-desc">Timeline pelaksanaan acara resmi mulai dari persiapan tata rias hingga penutupan.</p>

  ${
    sortedRundowns.length === 0
      ? `<p style="font-style: italic; color: #78716c;">Belum ada agenda rundown yang terdaftar di sistem.</p>`
      : `<table class="data-table">
          <thead>
            <tr>
              <th style="width: 14%;">Waktu</th>
              <th style="width: 26%;">Agenda Kegiatan</th>
              <th style="width: 18%;">Lokasi / Ruangan</th>
              <th style="width: 18%;">PIC Bertugas</th>
              <th style="width: 24%;">Catatan &amp; Vendor</th>
            </tr>
          </thead>
          <tbody>
            ${sortedRundowns
              .map(
                (r) => `
              <tr>
                <td><strong>${r.time_start || "-"}</strong> ${r.time_end ? `– ${r.time_end}` : ""}</td>
                <td>
                  <strong>${r.title}</strong>
                  ${r.description ? `<div style="font-size: 8pt; color: #57534e; margin-top: 2px;">${r.description}</div>` : ""}
                </td>
                <td>${r.location || venue}</td>
                <td>${r.pic_name || "Tim Acara"}</td>
                <td>
                  ${r.vendors_involved ? `<span class="badge badge-rose">${r.vendors_involved}</span> ` : ""}
                  ${r.notes ? `<div style="font-size: 8pt; color: #78716c; margin-top: 2px;">${r.notes}</div>` : ""}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>`
  }

  <div class="page-break"></div>

  <!-- ==================== HALAMAN 4: DIREKTORI VENDOR ==================== -->
  <h2 class="section-heading">3. Direktori Vendor &amp; Narahubung</h2>
  <p class="section-desc">Daftar lengkap vendor rekanan yang bertugas pada hari pernikahan.</p>

  ${
    vendors.length === 0
      ? `<p style="font-style: italic; color: #78716c;">Belum ada vendor yang tercatat.</p>`
      : `<table class="data-table">
          <thead>
            <tr>
              <th style="width: 22%;">Kategori</th>
              <th style="width: 32%;">Aktivitas / Nama Vendor</th>
              <th style="width: 22%;">No. WhatsApp</th>
              <th style="width: 24%;">Status Tugas</th>
            </tr>
          </thead>
          <tbody>
            ${vendors
              .map(
                (v) => `
              <tr>
                <td><strong>${v.category}</strong></td>
                <td>
                  ${v.activity_name}
                  ${v.total_cost ? `<div style="font-size: 8pt; color: #78716c;">Total: ${formatRupiah(v.total_cost)}</div>` : ""}
                </td>
                <td>${v.vendor_phone ? `<span style="font-family: monospace;">${v.vendor_phone}</span>` : "-"}</td>
                <td>
                  ${v.is_completed ? `<span class="badge badge-sage">Selesai</span>` : `<span class="badge badge-rose">Dalam Proses</span>`}
                  ${v.dp_paid ? `<span class="badge badge-sage">DP OK</span>` : ""}
                  ${v.settlement_paid ? `<span class="badge badge-sage">Lunas</span>` : ""}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>`
  }

  <!-- ==================== HALAMAN 5: DENAH & ALOKASI MEJA VIP ==================== -->
  <h2 class="section-heading">4. Alokasi Meja &amp; Tamu Kehormatan (Seating Plan)</h2>
  <p class="section-desc">Daftar meja reservasi khusus untuk keluarga besar dan tamu VIP.</p>

  ${
    sortedTables.length === 0
      ? `<p style="font-style: italic; color: #78716c;">Nomor meja tamu belum dialokasikan di menu Tamu.</p>`
      : `<table class="data-table">
          <thead>
            <tr>
              <th style="width: 20%;">Nomor Meja</th>
              <th style="width: 20%;">Jumlah Tamu</th>
              <th style="width: 60%;">Daftar Tamu yang Dialokasikan</th>
            </tr>
          </thead>
          <tbody>
            ${sortedTables
              .map(
                ([tableNum, tGuests]) => `
              <tr>
                <td><strong>Meja ${tableNum}</strong></td>
                <td>${tGuests.length} Orang</td>
                <td>
                  ${tGuests.map((g) => `${g.name} (${g.pax || 1} pax)`).join(", ")}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>`
  }

  <!-- ==================== HALAMAN 6: PETUNJUK TEKNIS HARI-H ==================== -->
  <h2 class="section-heading">5. Petunjuk Teknis &amp; Prosedur Lapangan (SOP)</h2>
  <p class="section-desc">Panduan penting bagi panitia keluarga demi kelancaran dan ketertiban acara.</p>

  <div class="rule-box">
    <strong>1. Waktu Kedatangan Panitia:</strong> Seluruh panitia dan pengantin wajib tiba di lokasi minimal <strong>2 jam</strong> sebelum acara dimulai untuk persiapan rias, sound check, dan briefing singkat.
  </div>
  <div class="rule-box">
    <strong>2. Serah Terima Kotak Angpao &amp; Kado:</strong> Pengawasan kotak angpao berada di bawah wewenang PIC Angpao Keluarga. Setelah acara selesai, kotak dibuka bersama saksi dari keluarga CPP dan CPW.
  </div>
  <div class="rule-box">
    <strong>3. Alur Penerimaan Tamu:</strong> Tim meja resepsi mencatat kehadiran tamu di aplikasi, memberikan kartu/label souvenir, dan mengarahkan tamu VIP ke meja yang telah ditentukan.
  </div>
  <div class="rule-box">
    <strong>4. Protokol Kehilangan &amp; Medis:</strong> Jika ada barang tertinggal atau tamu memerlukan bantuan medis darurat, segera hubungi Ketua Panitia Lapangan dan posko kesehatan gedung.
  </div>

  <div style="margin-top: 40px; text-align: center; font-size: 9pt; color: #78716c; border-top: 1px dashed #d6d3d1; padding-top: 14px;">
    Buku Panduan ini digenerate secara otomatis oleh sistem <strong>Wedding Planner</strong> pada ${new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}.
  </div>

</body>
</html>`;
}

/**
 * Buka jendela cetak atau pemicu simpan PDF browser.
 */
export function printMasterGuidebook(data) {
  const html = generateMasterGuidebookHtml(data);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup browser diblokir. Harap izinkan popup untuk mencetak Buku Panduan.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}
