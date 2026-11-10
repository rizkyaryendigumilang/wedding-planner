/// <summary>
/// 2027-01-15 — Migrasi Konsistensi Istilah: Pembaharuan tipe anggaran 'sangjit' menjadi 'seserahan'
/// </summary>
migrate(
  (app) => {
    try {
      const budgets = app.findCollectionByNameOrId("budgets");
      const f = budgets.fields.getByName("budget_type");
      if (f) {
        // Izinkan seserahan, wedding, serta sangjit untuk kompatibilitas
        f.values = ["seserahan", "wedding", "sangjit"];
        app.save(budgets);
      }
    } catch (_) {}

    try {
      // Migrasi record lama bertipe sangjit menjadi seserahan
      app.db().newQuery("UPDATE budgets SET budget_type = 'seserahan' WHERE budget_type = 'sangjit'").execute();
    } catch (_) {}
  },
  (app) => {
    try {
      const budgets = app.findCollectionByNameOrId("budgets");
      const f = budgets.fields.getByName("budget_type");
      if (f) {
        f.values = ["sangjit", "wedding"];
        app.save(budgets);
      }
    } catch (_) {}
  }
);
