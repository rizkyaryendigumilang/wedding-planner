/// <summary>
/// 20270111000003 — Isolasi tenant untuk rundown_events, wedding_gifts, recycle_bin
/// (F-06 perbaikan: tambahkan field `couple` lalu terapkan aturan tenant-scoped).
///
/// Tanpa perubahan skema di kode aplikasi: field `couple` ditambahkan secara
/// manual ke tiga koleksi lewat PocketBase Admin API (relasi ke `couples`),
/// lalu migrasi ini menambahkan aturan akses yang cocok dengan pola F-02.
///
/// Aturan:
///  - list/view/create/update/delete hanya untuk pemilik couple
///    (couple = auth.couple || couple.owner = auth.id)
///  - Akun demo yang kedaluwarsa tidak bisa membaca data (EXPIRY gate)
///  - Admin aplikasi (username = "admin") retained access untuk kontrol demo
///    di recycle_bin jika diperlukan.
/// </summary>
migrate(
  (app) => {
    const EXPIRY =
      '(@request.auth.is_demo != true || (@request.auth.demo_expires_at != "" && @request.auth.demo_expires_at > @now))';

    const tenant =
      '(couple != "" && (couple = @request.auth.couple || couple.owner = @request.auth.id))';

    const baseAccess =
      '@request.auth.id != "" && ' + tenant + " && " + EXPIRY;

    // Data terkait couple: rundown_events, wedding_gifts
    for (const name of ["rundown_events", "wedding_gifts"]) {
      const collection = app.findCollectionByNameOrId(name);

      collection.listRule = baseAccess;
      collection.viewRule = baseAccess;

      collection.createRule =
        '@request.auth.id != "" && ' +
        '(@request.body.couple:isset = true && ' +
        '@request.body.couple.owner = @request.auth.id)';

      collection.updateRule =
        baseAccess + ' || (@request.auth.username = "admin")';

      collection.deleteRule =
        baseAccess + ' || (@request.auth.username = "admin")';

      app.save(collection);
    }

    // recycle_bin: catatan item yang dihapus, scoping via couple
    const bin = app.findCollectionByNameOrId("recycle_bin");

    bin.listRule = baseAccess;
    bin.viewRule = baseAccess;

    bin.createRule =
      '@request.auth.id != "" && ' +
      '(@request.body.couple:isset = true && ' +
      '@request.body.couple.owner = @request.auth.id)';

    bin.updateRule =
        baseAccess + ' || (@request.auth.username = "admin")';

    bin.deleteRule =
        baseAccess + ' || (@request.auth.username = "admin")';

    app.save(bin);
  },
  (_app) => {
    throw new Error(
      "Rollback otomatis tidak tersedia. Pulihkan pb_data dari backup terverifikasi."
    );
  }
);
