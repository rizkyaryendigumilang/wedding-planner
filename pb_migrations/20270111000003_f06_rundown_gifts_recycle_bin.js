/// <summary>
/// 20270111000003 — Isolasi tenant untuk rundown_events, wedding_gifts, recycle_bin (F-06).
///
/// Menambahkan field `couple` (relasi ke `couples`) pada ketiga koleksi bila
/// belum ada, lalu terapkan aturan tenant-scoped yang sama dengan F-02:
///  - list/view hanya untuk pemilik couple (couple = auth.couple ||
///    couple.owner = auth.id), dan akun demo tidak kadaluarsa.
///  - create hanya boleh menetapkan couple milik sendiri.
///  - update/delete: pemilik couple atau admin aplikasi (username = "admin").
///
/// Tanpa perubahan skema di kode aplikasi: field `couple` ditambahkan lewat
/// migrasi PocketBase (relasi ke koleksi `couples`).
/// </summary>
migrate(
  (app) => {
    const EXPIRY =
      '(@request.auth.is_demo != true || (@request.auth.demo_expires_at != "" && @request.auth.demo_expires_at > @now))';

    const tenant =
      '(couple != "" && (couple = @request.auth.couple || couple.owner = @request.auth.id))';

    const baseAccess =
      '@request.auth.id != "" && ' + tenant + " && " + EXPIRY;

    const ensureCoupleField = (collection) => {
      const names = collection.fields.map((f) => f.name);
      if (names.includes("couple")) return;
      collection.fields.addAt(
        collection.fields.length,
        new Field({
          collectionId: "pbc_2240088416",
          cascadeDelete: false,
          maxSelect: 1,
          minSelect: 0,
          name: "couple",
          presentable: false,
          required: false,
          system: false,
          type: "relation",
        })
      );
    };

    const setRules = (collection) => {
      collection.listRule = baseAccess;
      collection.viewRule = baseAccess;

      collection.createRule =
        '@request.auth.id != "" && ' +
        '(@request.body.couple:isset = true && ' +
        '@request.body.couple.owner = @request.auth.id)';

      collection.updateRule = baseAccess + ' || (@request.auth.username = "admin")';
      collection.deleteRule = baseAccess + ' || (@request.auth.username = "admin")';
    };

    // Data terkait couple: rundown_events, wedding_gifts
    for (const name of ["rundown_events", "wedding_gifts"]) {
      const collection = app.findCollectionByNameOrId(name);
      ensureCoupleField(collection);
      setRules(collection);
      app.save(collection);
    }

    // recycle_bin: catatan item yang dihapus, scoping via couple
    const bin = app.findCollectionByNameOrId("recycle_bin");
    ensureCoupleField(bin);
    setRules(bin);
    app.save(bin);
  },
  (_app) => {
    throw new Error(
      "Rollback otomatis tidak tersedia. Pulihkan pb_data dari backup terverifikasi."
    );
  }
);
