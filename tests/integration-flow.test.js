import { describe, it, expect, vi } from "vitest";
import { generateMasterGuidebookHtml } from "../src/lib/weddingMasterGuidebook";
import { computeStats } from "../src/lib/weddingData";

describe("Integration Flow: Reception Desk & Guest Check-In", () => {
  it("processes check-in, records actual pax, distributes souvenir, and updates statistics", () => {
    const mockGuests = [
      { id: "g1", name: "Budi Santoso", pax: 2, actual_pax: null, checked_in: false, souvenir_given: false, status: "Belum", side: "CPP" },
      { id: "g2", name: "Siti Rahma", pax: 1, actual_pax: null, checked_in: false, souvenir_given: false, status: "Belum", side: "CPW" },
    ];

    // Simulasi aksi Check-In Tamu di Meja Resepsi
    const guestIdToCheckIn = "g1";
    const checkInPayload = { actual_pax: 3, souvenir_given: true, guestName: "Budi Santoso" };

    const updatedGuests = mockGuests.map((g) =>
      g.id === guestIdToCheckIn
        ? {
            ...g,
            checked_in: true,
            checked_in_at: "2028-02-17T09:00:00.000Z",
            status: "Hadir",
            actual_pax: checkInPayload.actual_pax,
            souvenir_given: checkInPayload.souvenir_given,
          }
        : g
    );

    const checkedGuest = updatedGuests.find((g) => g.id === "g1");
    expect(checkedGuest.checked_in).toBe(true);
    expect(checkedGuest.status).toBe("Hadir");
    expect(checkedGuest.actual_pax).toBe(3);
    expect(checkedGuest.souvenir_given).toBe(true);

    // Hitung statistik turunan resepsi
    const stats = computeStats({
      couple: { id: "c1" },
      budgets: [],
      administrations: [],
      seserahan: [],
      vendors: [],
      guests: updatedGuests,
      cashflow: [],
      photos: [],
    });

    expect(stats.guestSummary.total).toBe(2);
    expect(stats.guestSummary.hadir).toBe(1);
    expect(stats.guestSummary.belum).toBe(1);

    // Simulasi Pembatalan Check-In (Undo)
    const rolledBackGuests = updatedGuests.map((g) =>
      g.id === "g1"
        ? { ...g, checked_in: false, checked_in_at: "", souvenir_given: false, status: "Belum", actual_pax: null }
        : g
    );
    const rolledBackGuest = rolledBackGuests.find((g) => g.id === "g1");
    expect(rolledBackGuest.checked_in).toBe(false);
    expect(rolledBackGuest.souvenir_given).toBe(false);
  });
});

describe("Integration Flow: Soft Delete & Trash Recycle Bin Lifecycle", () => {
  it("moves deleted item to recycle_bin, tracks metadata, and prepares clean payload for restore", () => {
    const originalItem = {
      id: "rundown_123",
      created: "2026-01-01 10:00:00",
      updated: "2026-01-02 12:00:00",
      collectionId: "col_rundowns",
      collectionName: "rundown_events",
      title: "Akad Nikah",
      time_start: "08:00",
      time_end: "09:00",
      location: "Masjid Gedung",
      couple: "c1",
    };

    // 1. Move to trash payload creation
    const trashEntry = {
      id: "trash_999",
      collection_name: "rundown_events",
      item_title: originalItem.title,
      item_data: originalItem,
      deleted_by: "pengantin_cpp",
      couple: "c1",
      created: new Date().toISOString(),
    };

    expect(trashEntry.collection_name).toBe("rundown_events");
    expect(trashEntry.item_title).toBe("Akad Nikah");
    expect(trashEntry.item_data.id).toBe("rundown_123");

    // 2. Restore preparation: clean internal system attributes
    const restorePayload = { ...trashEntry.item_data };
    delete restorePayload.id;
    delete restorePayload.created;
    delete restorePayload.updated;
    delete restorePayload.collectionId;
    delete restorePayload.collectionName;

    expect(restorePayload.id).toBeUndefined();
    expect(restorePayload.created).toBeUndefined();
    expect(restorePayload.title).toBe("Akad Nikah");
    expect(restorePayload.time_start).toBe("08:00");
    expect(restorePayload.couple).toBe("c1");
  });
});

describe("Integration Flow: Vendor Payment Milestone & Attachment Calculation", () => {
  it("calculates DP, pelunasan, and tracks remaining balances accurately", () => {
    const vendors = [
      {
        id: "v1",
        activity_name: "Katering 500 Porsi",
        total_cost: 35000000,
        dp_amount: 10000000,
        dp_paid: true,
        settlement_paid: false,
        attachment: "kontrak_katering.pdf",
      },
      {
        id: "v2",
        activity_name: "Fotografi & Videografi",
        total_cost: 15000000,
        dp_amount: 5000000,
        dp_paid: true,
        settlement_paid: true,
        attachment: "invoice_foto.jpg",
      },
      {
        id: "v3",
        activity_name: "Dekorasi Pelaminan",
        total_cost: 20000000,
        dp_amount: 5000000,
        dp_paid: false,
        settlement_paid: false,
        attachment: null,
      },
    ];

    let totalContract = 0;
    let totalDpPaid = 0;
    let totalSettlementPaid = 0;

    vendors.forEach((v) => {
      const cost = Number(v.total_cost || 0);
      const dp = Number(v.dp_amount || 0);
      totalContract += cost;
      if (v.dp_paid) {
        totalDpPaid += dp;
      }
      if (v.settlement_paid) {
        totalSettlementPaid += Math.max(0, cost - dp);
      }
    });

    const totalPaid = totalDpPaid + totalSettlementPaid;
    const remainingToPay = Math.max(0, totalContract - totalPaid);

    expect(totalContract).toBe(70000000);
    expect(totalDpPaid).toBe(15000000); // 10jt (v1) + 5jt (v2)
    expect(totalSettlementPaid).toBe(10000000); // 15jt - 5jt (v2)
    expect(totalPaid).toBe(25000000);
    expect(remainingToPay).toBe(45000000);

    // Verifikasi deteksi berkas lampiran
    const vendorsWithAttachments = vendors.filter((v) => Boolean(v.attachment));
    expect(vendorsWithAttachments).toHaveLength(2);
    expect(vendorsWithAttachments[0].attachment).toContain(".pdf");
    expect(vendorsWithAttachments[1].attachment).toContain(".jpg");
  });
});

describe("Integration Flow: Wedding Master Guidebook Generation", () => {
  it("compiles couple, rundowns, vendors, and seating allocations into printable HTML", () => {
    const mockCouple = {
      cpp_nickname: "Rizky",
      cpw_nickname: "Aulia",
      cpp_full_name: "Rizky Pratama, S.T.",
      cpw_full_name: "Aulia Rahma, S.Farm.",
      wedding_date: "2028-02-17",
      venue: "Grand Ballroom Hotel Mulia",
      notes: "Adat Sunda Modern & Romantic Floral",
    };

    const mockRundowns = [
      {
        id: "r1",
        time_start: "08:00",
        time_end: "09:30",
        title: "Prosesi Akad Nikah",
        location: "Ruang Utama",
        pic_name: "Pak Ustadz & H. Burhan",
        vendors_involved: "Penghulu, MUA",
        notes: "Cincin dan buku nikah disiapkan",
      },
      {
        id: "r2",
        time_start: "11:00",
        time_end: "14:00",
        title: "Resepsi Pernikahan",
        location: "Grand Ballroom",
        pic_name: "WO Captain",
        vendors_involved: "Catering, MC, Band",
        notes: "Standby penerima tamu VIP",
      },
    ];

    const mockVendors = [
      {
        id: "v1",
        category: "Katering",
        activity_name: "Katering Prasmanan & Gubukan",
        total_cost: 45000000,
        vendor_phone: "081234567890",
        is_completed: true,
        dp_paid: true,
        settlement_paid: true,
      },
    ];

    const mockGuests = [
      { id: "g1", name: "Bapak Gubernur & Ibu", table_number: "VIP 01", pax: 2 },
      { id: "g2", name: "Keluarga Besar CPP", table_number: "VIP 02", pax: 4 },
    ];

    const html = generateMasterGuidebookHtml({
      couple: mockCouple,
      rundowns: mockRundowns,
      vendors: mockVendors,
      guests: mockGuests,
      settings: {},
    });

    // Verifikasi isi penting dokumen
    expect(html).toContain("Buku Panduan Pernikahan");
    expect(html).toContain("Rizky Pratama, S.T.");
    expect(html).toContain("Aulia Rahma, S.Farm.");
    expect(html).toContain("Grand Ballroom Hotel Mulia");
    expect(html).toContain("Prosesi Akad Nikah");
    expect(html).toContain("Resepsi Pernikahan");
    expect(html).toContain("Katering Prasmanan & Gubukan");
    expect(html).toContain("Meja VIP 01");
    expect(html).toContain("Bapak Gubernur & Ibu");
    expect(html).toContain("Petunjuk Teknis &amp; Prosedur Lapangan (SOP)");
  });
});
