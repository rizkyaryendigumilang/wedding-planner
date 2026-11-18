/// <summary>
/// 2027-01-17 — Update/aktifkan akun demo promosi dengan masa berlaku 1 bulan (30 hari).
/// </summary>
migrate(
  (app) => {
    try {
      const users = app.findCollectionByNameOrId("users");
      let record;
      try {
        record = app.findFirstRecordByData("users", "username", "demo");
      } catch (_) {}

      // Tanggal kadaluarsa: 30 hari dari sekarang
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (record) {
        record.set("is_demo", true);
        record.set("demo_expires_at", expiry);
        record.set("name", "Demo Pasangan (Promo 1 Bulan)");
        app.save(record);
      } else {
        // Buat akun demo baru jika belum ada
        const newRecord = new Record(users);
        newRecord.set("username", "demo");
        newRecord.set("email", "demo@wedding.local");
        newRecord.set("name", "Demo Pasangan (Promo 1 Bulan)");
        newRecord.set("verified", true);
        newRecord.set("is_demo", true);
        newRecord.set("demo_expires_at", expiry);
        newRecord.set("app_role", "owner");
        newRecord.set("partner_role", "CPP");
        newRecord.setPassword("demo123");
        app.save(newRecord);
      }
    } catch (err) {
      console.log("Migration promo demo account notice:", err);
    }
  },
  (_app) => {}
);
