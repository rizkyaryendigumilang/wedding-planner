/**
 * seed.js — Import data Excel -> PocketBase
 * ---------------------------------------------------------------------------
 * Sumber data: "Copy of Wedding Planner for Reina.xlsx"
 * Hasil parsing tersimpan di folder ./seed/*.json
 *
 * Jalankan:  node seed.js
 *
 * Script ini akan:
 *   1. Login sebagai superuser PocketBase
 *   2. RESET data lama (couples, budgets, administrations, seserahan_items,
 *      wedding_guests, activity_logs, vendor_checklists, cashflow_entries)
 *   3. Import data bersih hasil parsing Excel
 *
 * Kredensial & URL bisa dioverride lewat environment variable:
 *   PB_URL, PB_EMAIL, PB_PASSWORD
 */
import PocketBase from "pocketbase";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const PB_EMAIL = process.env.PB_EMAIL || "rizkyaryendigumilang@gmail.com";
const PB_PASSWORD = process.env.PB_PASSWORD || "Apaya1234";

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "seed", name), "utf8"));

const log = (msg) => console.log(`  ${msg}`);

async function wipe(collection) {
  let removed = 0;
  // Get all ids (paged) then delete in small batches.
  while (true) {
    const page = await pb.collection(collection).getList(1, 200, { fields: "id" });
    if (page.items.length === 0) break;
    for (const item of page.items) {
      try {
        await pb.collection(collection).delete(item.id);
        removed += 1;
      } catch (_) {
        /* ignore */
      }
    }
  }
  return removed;
}

async function run() {
  console.log("\n=== Wedding Planner Seeder ===\n");
  await pb
    .collection("_superusers")
    .authWithPassword(PB_EMAIL, PB_PASSWORD);
  log(`Login superuser sebagai ${PB_EMAIL} @ ${PB_URL}`);

  // ------------------------------------------------------------------ reset
  console.log("\n[1/3] Reset data lama...");
  const collections = [
    "activity_logs",
    "wedding_guests",
    "seserahan_items",
    "administrations",
    "budgets",
    "vendor_checklists",
    "cashflow_entries",
    "couples",
  ];
  for (const c of collections) {
    const n = await wipe(c);
    log(`- ${c}: ${n} record dihapus`);
  }

  // ------------------------------------------------------------------ couple
  console.log("\n[2/3] Membuat profil pasangan...");
  const couple = await pb.collection("couples").create({
    wedding_date: "2028-02-17",
    target_budget: 85000000,
    prewed_drive_link: "",
    cpp_full_name: "Rizky Aryendi Gumilang",
    cpp_nickname: "Rizky",
    cpp_gender: "Male",
    cpw_full_name: "Aurene",
    cpw_nickname: "Reina",
    cpw_gender: "Female",
    venue: "Gedung PINDAD",
    notes: "Target tabungan Rp 85.000.000 — pernikahan 17 Februari 2028",
  });
  const coupleId = couple.id;
  log(`- couples: ${coupleId} (Rizky & Reina — 17-02-2028)`);

  // ------------------------------------------------------------------ budget
  console.log("\n[3/3] Import data modul...");

  // budgets (engagement + wedding)
  const engagement = read("engagement_budget.json");
  const wedding = read("wedding_budget.json");
  let budgetCount = 0;
  for (const [type, items] of [
    ["sangjit", engagement],
    ["wedding", wedding],
  ]) {
    for (const it of items) {
      try {
        await pb.collection("budgets").create({
          couple: coupleId,
          budget_type: type,
          category: it.category,
          detail: it.detail,
          status: it.status || "Not Yet",
          vendor: it.vendor || "",
          total_biaya: it.total_biaya || 0,
          termin1: it.termin1 || 0,
          termin2: it.termin2 || 0,
          termin3: it.termin3 || 0,
          termin4: it.termin4 || 0,
          keterangan: it.keterangan || "",
        });
        budgetCount += 1;
      } catch (e) {
        log(`  ! budgets gagal: ${it.detail} -> ${e.message}`);
      }
    }
  }
  log(`- budgets: ${budgetCount} item (sangjit + wedding)`);

  // administrations
  const admins = read("administrations.json");
  let adminCount = 0;
  for (let i = 0; i < admins.length; i += 1) {
    const it = admins[i];
    try {
      await pb.collection("administrations").create({
        couple: coupleId,
        section: it.section,
        section_code: (it.section.split(".")[0] || "").trim(),
        item: it.item,
        progress: it.progress || "",
        cpp_complete: !!it.cpp_complete,
        cpw_complete: !!it.cpw_complete,
        is_document: !!it.is_document,
        details: it.details || "",
        sort_order: i + 1,
      });
      adminCount += 1;
    } catch (e) {
      log(`  ! administrations gagal: ${it.item} -> ${e.message}`);
    }
  }
  log(`- administrations: ${adminCount} item`);

  // seserahan
  const seserahan = read("seserahan.json");
  let sesCount = 0;
  for (let i = 0; i < seserahan.length; i += 1) {
    const it = seserahan[i];
    try {
      await pb.collection("seserahan_items").create({
        couple: coupleId,
        category: it.category,
        detail: it.detail,
        brand: it.brand || "",
        qty: it.qty || 1,
        link: it.link || "",
        budget: it.budget || 0,
        actually_harga: it.actually_harga || 0,
        checklist: !!it.checklist,
        notes: "",
      });
      sesCount += 1;
    } catch (e) {
      log(`  ! seserahan gagal: ${it.detail} -> ${e.message}`);
    }
  }
  log(`- seserahan_items: ${sesCount} item`);

  // vendor checklists
  const vendors = read("vendor_checklists.json");
  let vendorCount = 0;
  for (let i = 0; i < vendors.length; i += 1) {
    const it = vendors[i];
    try {
      const payload = {
        couple: coupleId,
        category: it.category,
        activity_name: it.activity_name,
        is_completed: !!it.is_completed,
        notes: it.notes || "",
        sort_order: i + 1,
      };
      if (it.deadline_date) payload.deadline_date = it.deadline_date + " 00:00:00.000Z";
      await pb.collection("vendor_checklists").create(payload);
      vendorCount += 1;
    } catch (e) {
      log(`  ! vendor_checklists gagal: ${it.activity_name} -> ${e.message}`);
    }
  }
  log(`- vendor_checklists: ${vendorCount} item`);

  // guests
  const guests = read("guests.json");
  let guestCount = 0;
  for (const g of guests) {
    try {
      await pb.collection("wedding_guests").create({
        couple: coupleId,
        side: g.side,
        name: g.name,
        relationship: g.relationship || "-",
        group_name: g.group_name || "Umum",
        priority: g.priority || "A - Must Invite",
        pax: g.pax || 1,
        origin: g.origin || "-",
        checklist: !!g.checklist,
        type: g.type || "Digital",
        status: g.status || "Belum",
        notes: g.notes || "-",
      });
      guestCount += 1;
    } catch (e) {
      log(`  ! wedding_guests gagal: ${g.name} -> ${e.message}`);
    }
  }
  log(`- wedding_guests: ${guestCount} tamu`);

  // cashflow entries (income & expense) from Excel
  const cashflow = read("cashflow.json");
  let cashCount = 0;
  for (let i = 0; i < cashflow.length; i += 1) {
    const it = cashflow[i];
    const push = async (kind, owner, amount) => {
      if (!amount) return;
      const payload = {
        couple: coupleId,
        description: it.description,
        kind,
        owner,
        amount,
        sort_order: i + 1,
      };
      if (it.date) payload.entry_date = it.date + " 00:00:00.000Z";
      await pb.collection("cashflow_entries").create(payload);
      cashCount += 1;
    };
    try {
      await push("income", "CPP", it.income_cpp);
      await push("income", "CPW", it.income_cpw);
      await push("expense", "CPP", it.expense_cpp);
      await push("expense", "CPW", it.expense_cpw);
    } catch (e) {
      log(`  ! cashflow_entries gagal: ${it.description} -> ${e.message}`);
    }
  }
  log(`- cashflow_entries: ${cashCount} baris`);

  // ------------------------------------------------------------------ logs
  const logs = [
    {
      action_description: "DP Gedung PINDAD termin 1 dicatat Rp 5.000.000",
      action_type: "payment",
      amount: 5000000,
    },
    {
      action_description: "DP MUA dicatat Rp 3.000.000",
      action_type: "payment",
      amount: 3000000,
    },
    {
      action_description: "Target tabungan pernikahan ditetapkan Rp 85.000.000",
      action_type: "info",
      amount: 85000000,
    },
    {
      action_description: "Daftar tamu CPW & CPP berhasil diimpor dari Excel",
      action_type: "guest",
      amount: 0,
    },
    {
      action_description: "Checklist dokumen administrasi dimuat dari Excel",
      action_type: "document",
      amount: 0,
    },
  ];
  for (const l of logs) {
    try {
      await pb.collection("activity_logs").create({ couple: coupleId, ...l });
    } catch (_) {
      /* ignore */
    }
  }
  log(`- activity_logs: ${logs.length} entri audit`);

  console.log("\n=== Selesai! Semua data berhasil diimpor. ===\n");
  console.log("Ringkasan:");
  console.log(`  Pasangan     : Rizky & Reina (17 Februari 2028)`);
  console.log(`  Target budget: Rp 85.000.000`);
  console.log(`  Budget items : ${budgetCount}`);
  console.log(`  Administrasi : ${adminCount}`);
  console.log(`  Seserahan    : ${sesCount}`);
  console.log(`  Vendor tasks : ${vendorCount}`);
  console.log(`  Tamu undangan: ${guestCount}`);
  console.log(`  Cashflow     : ${cashCount}\n`);
}

run().catch((err) => {
  console.error("\nSeed GAGAL:", err?.message || err);
  if (err?.response) console.error(JSON.stringify(err.response, null, 2));
  process.exit(1);
});
