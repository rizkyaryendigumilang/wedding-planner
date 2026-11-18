import { DatabaseSync } from "node:sqlite";

try {
  const db = new DatabaseSync("pb_data/data.db");
  
  // Hitung 30 hari dari sekarang (18 November 2026 -> 18 Desember 2026)
  const now = new Date();
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiryIso = oneMonthLater.toISOString();

  console.log(`Mengatur masa berlaku demo sampai: ${expiryIso} (30 hari / 1 bulan)`);

  const updateStmt = db.prepare(`
    UPDATE users
    SET is_demo = 1,
        demo_expires_at = ?,
        name = 'Demo Pasangan (Promo 1 Bulan)',
        updated = ?
    WHERE username = 'demo'
  `);
  
  const result = updateStmt.run(expiryIso, new Date().toISOString());
  console.log("Update users result:", result);

  const demoUser = db.prepare("SELECT id, username, email, is_demo, demo_expires_at, name, couple FROM users WHERE username = 'demo'").get();
  console.log("DEMO USER UPDATED:", JSON.stringify(demoUser, null, 2));

  // Periksa data couple terkait
  if (demoUser?.couple) {
    const couple = db.prepare("SELECT * FROM couples WHERE id = ?").get(demoUser.couple);
    console.log("COUPLE TERKAIT:", JSON.stringify(couple, null, 2));
  }
} catch (e) {
  console.error("Gagal update demo account:", e);
}
