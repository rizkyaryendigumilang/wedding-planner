/**
 * Wedding Planner Intelligent Notification Engine
 * ---------------------------------------------------------------------------
 * Menghasilkan notifikasi kontekstual, peringatan dini (alerts), dan pengingat (reminders)
 * secara real-time berdasarkan data aktif pernikahan (anggaran, tamu, vendor, rundown, tanggal).
 */
import { formatRupiah } from "./format";

/**
 * Menghitung daftar notifikasi cerdas berdasarkan status pernikahan saat ini.
 *
 * @param {object} weddingData
 * @param {object} [preferences]
 * @returns {Array<object>} Daftar notifikasi berurut berdasarkan tingkat urgensi
 */
export function generateNotifications(weddingData = {}, preferences = {}) {
  const {
    couple,
    budgets = [],
    guests = [],
    vendors = [],
    rundowns = [],
  } = weddingData;

  const notifications = [];

  const allowBudgetAlerts = preferences.budgetAlerts ?? true;
  const allowRsvpReminders = preferences.rsvpReminders ?? true;
  const allowVendorAlerts = preferences.vendorAlerts ?? true;
  const allowRundownAlerts = preferences.rundownAlerts ?? true;
  const budgetThreshold = preferences.budgetThreshold ?? 85; // persen

  // 1. Notifikasi Hitung Mundur Hari-H
  if (couple?.wedding_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weddingDate = new Date(couple.wedding_date);
    weddingDate.setHours(0, 0, 0, 0);

    const diffMs = weddingDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      notifications.push({
        id: "dday_passed",
        category: "milestone",
        type: "info",
        title: "Pernikahan Telah Berlangsung",
        message: `Pernikahan bahagia Anda telah terselenggara pada ${couple.wedding_date}. Semoga menjadi keluarga sakinah, mawaddah, warahmah!`,
        timestamp: weddingDate.toISOString(),
        actionUrl: "/gallery",
        actionLabel: "Lihat Galeri Kenangan",
      });
    } else if (daysRemaining === 0) {
      notifications.push({
        id: "dday_today",
        category: "alert",
        type: "urgent",
        title: "Hari Bahagia Telah Tiba! 💍🎉",
        message: "Hari pernikahan Anda berlangsung hari ini! Semangat dan nikmati setiap momen sakral bersama keluarga dan pasangan.",
        timestamp: new Date().toISOString(),
        actionUrl: "/reception",
        actionLabel: "Buka Meja Tamu",
      });
    } else if (daysRemaining <= 7) {
      notifications.push({
        id: "dday_d7",
        category: "alert",
        type: "urgent",
        title: `H-${daysRemaining} Menuju Hari Pernikahan!`,
        message: "Waktu semakin dekat. Pastikan seluruh PIC rundown dan vendor utama telah menerima buku panduan acara.",
        timestamp: new Date().toISOString(),
        actionUrl: "/rundown",
        actionLabel: "Cek Itinerary Acara",
      });
    } else if (daysRemaining <= 30) {
      notifications.push({
        id: "dday_d30",
        category: "reminder",
        type: "warning",
        title: `H-${daysRemaining}: Tahap Finalisasi Persiapan`,
        message: "Satu bulan menuju akad/resepsi. Waktunya fitting pakaian final, distribusi undangan fisik/digital, dan pelunasan vendor.",
        timestamp: new Date().toISOString(),
        actionUrl: "/guests",
        actionLabel: "Pantau Status Undangan",
      });
    }
  }

  // 2. Peringatan Anggaran (Budget Alerts)
  if (allowBudgetAlerts && couple?.target_budget) {
    const target = Number(couple.target_budget) || 0;
    const totalActual = budgets.reduce((acc, b) => acc + (Number(b.actual_cost) || 0), 0);
    const percentSpent = target > 0 ? (totalActual / target) * 100 : 0;

    if (totalActual > target) {
      const overspend = totalActual - target;
      notifications.push({
        id: "budget_over",
        category: "alert",
        type: "urgent",
        title: "Pengeluaran Melebihi Target Anggaran",
        message: `Total pengeluaran (${formatRupiah(totalActual)}) telah melampaui target anggaran (${formatRupiah(target)}) sebesar ${formatRupiah(overspend)}.`,
        timestamp: new Date().toISOString(),
        actionUrl: "/budget",
        actionLabel: "Tinjau Pos Anggaran",
      });
    } else if (percentSpent >= budgetThreshold) {
      notifications.push({
        id: "budget_warning",
        category: "alert",
        type: "warning",
        title: `Anggaran Terpakai ${Math.round(percentSpent)}%`,
        message: `Pengeluaran sudah mencapai ${formatRupiah(totalActual)} dari target ${formatRupiah(target)}. Perhatikan sisa alokasi pos cadangan.`,
        timestamp: new Date().toISOString(),
        actionUrl: "/budget",
        actionLabel: "Cek Anggaran",
      });
    }
  }

  // 3. Pengingat Konfirmasi Tamu (RSVP Reminders)
  if (allowRsvpReminders && guests.length > 0) {
    const pendingGuests = guests.filter((g) => !g.rsvp_status || g.rsvp_status === "Belum");
    if (pendingGuests.length > 0) {
      notifications.push({
        id: "rsvp_pending",
        category: "reminder",
        type: "info",
        title: `${pendingGuests.length} Tamu Belum Konfirmasi RSVP`,
        message: `Terdapat ${pendingGuests.length} dari ${guests.length} tamu yang belum memberikan kepastian kehadiran. Kirim pengingat WhatsApp agar katering akurat.`,
        timestamp: new Date().toISOString(),
        actionUrl: "/guests",
        actionLabel: "Kirim Pesan Pengingat",
      });
    }
  }

  // 4. Peringatan Pembayaran Vendor
  if (allowVendorAlerts && vendors.length > 0) {
    const unpaidVendors = vendors.filter((v) => {
      const cost = Number(v.actual_cost || v.estimated_cost) || 0;
      const paid = Number(v.paid_amount) || 0;
      return cost > paid;
    });

    if (unpaidVendors.length > 0) {
      const totalUnpaid = unpaidVendors.reduce((acc, v) => {
        const cost = Number(v.actual_cost || v.estimated_cost) || 0;
        const paid = Number(v.paid_amount) || 0;
        return acc + Math.max(0, cost - paid);
      }, 0);

      notifications.push({
        id: "vendor_unpaid",
        category: "reminder",
        type: "warning",
        title: `${unpaidVendors.length} Vendor Memiliki Sisa Tagihan`,
        message: `Total sisa tagihan vendor sebesar ${formatRupiah(totalUnpaid)}. Pastikan jadwal pelunasan sesuai tenggat waktu kontrak.`,
        timestamp: new Date().toISOString(),
        actionUrl: "/vendors",
        actionLabel: "Kelola Tagihan Vendor",
      });
    }
  }

  // 5. Peringatan PIC Rundown Acara
  if (allowRundownAlerts && rundowns.length > 0) {
    const missingPic = rundowns.filter((r) => !r.pic || !r.pic.trim());
    if (missingPic.length > 0) {
      notifications.push({
        id: "rundown_no_pic",
        category: "reminder",
        type: "info",
        title: `${missingPic.length} Susunan Acara Belum Ada PIC`,
        message: "Terdapat sesi acara yang belum memiliki penanggung jawab khusus. Tetapkan PIC agar koordinasi hari-H berjalan lancar.",
        timestamp: new Date().toISOString(),
        actionUrl: "/rundown",
        actionLabel: "Tetapkan PIC Acara",
      });
    }
  }

  return notifications;
}
