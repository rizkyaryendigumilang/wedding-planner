/// <summary>
/// 2027-01-11 — Konsolidasi aturan isolasi tenant (F-02) dan penguatan akun (F-03, F-05, F-07).
///
/// Latar belakang:
/// Aturan tenant-scoped yang dipakai produksi sebelumnya hanya ada di server
/// (20270108000000_security_tenant_isolation.js) dan tidak pernah masuk repo.
/// Migrasi ini menjadikan keadaan produksi dapat direproduksi dari repository,
/// tanpa menambah atau mengubah field/koleksi apa pun.
///
/// Perubahan yang dimuat:
///  1. Semua koleksi data memakai scoping tenant yang sama.
///  2. Pemilik couple tetap punya akses walau `users.couple` belum tertaut
///     (lewat `couple.owner`), sehingga akun baru tidak terkunci (F-07).
///  3. Anggaran & arus kas kembali dibatasi untuk peran panitia/WO (F-05).
///  4. Akun demo tidak dapat mengubah `is_demo`/`demo_expires_at` miliknya
///     sendiri, tetapi akun admin tetap bisa mengaktifkannya kembali (F-03).
///  5. Akun demo yang kedaluwarsa berhenti bisa membaca data (server-side).
///
/// Koleksi rundown_events, wedding_gifts, dan recycle_bin sengaja tidak diubah:
/// ketiganya belum memiliki field `couple`, sehingga scoping tenant tidak dapat
/// diterapkan tanpa perubahan skema.
/// </summary>
migrate(
  (app) => {
    const EXPIRY =
      '(@request.auth.is_demo != true || (@request.auth.demo_expires_at != "" && @request.auth.demo_expires_at > @now))';

    const tenant =
      '(couple = @request.auth.couple || couple.owner = @request.auth.id)';

    const access =
      '@request.auth.id != "" && couple != "" && ' + tenant + " && " + EXPIRY;

    const finance =
      access +
      ' && @request.auth.app_role != "panitia" && @request.auth.app_role != "wo"';

    const apply = (name, rule) => {
      const collection = app.findCollectionByNameOrId(name);
      collection.listRule = rule;
      collection.viewRule = rule;
      collection.createRule = rule;
      collection.updateRule = rule;
      collection.deleteRule = rule;
      app.save(collection);
    };

    // 1. Koleksi data yang dibatasi per couple.
    for (const name of [
      "administrations",
      "seserahan_items",
      "wedding_guests",
      "vendor_checklists",
      "gallery_photos",
      "activity_logs",
    ]) {
      apply(name, access);
    }

    // 2. Data finansial: per couple + peran.
    for (const name of ["budgets", "cashflow_entries"]) {
      apply(name, finance);
    }

    // 3. app_settings hanya bisa di-scope bila field `couple` tersedia.
    //    (Di server field ini sudah ada; di database lokal lama mungkin belum.)
    const settings = app.findCollectionByNameOrId("app_settings");
    if (settings.fields.getByName("couple")) {
      apply("app_settings", access);
    } else {
      console.warn(
        "[migrasi] app_settings belum punya field couple — aturan tidak diubah."
      );
    }

    // 4. couples: anggota couple atau pemiliknya.
    const couples = app.findCollectionByNameOrId("couples");
    const coupleAccess =
      '@request.auth.id != "" && (id = @request.auth.couple || owner = @request.auth.id) && ' +
      EXPIRY;
    couples.listRule = coupleAccess;
    couples.viewRule = coupleAccess;
    couples.createRule =
      '@request.auth.id != "" && @request.body.owner = @request.auth.id';
    couples.updateRule = coupleAccess;
    couples.deleteRule = coupleAccess;
    app.save(couples);

    // 5. users: baca, kelola, dan penguncian field sensitif.
    const users = app.findCollectionByNameOrId("users");
    users.listRule =
      'id = @request.auth.id || (@request.auth.app_role = "owner" && couple != "" && couple = @request.auth.couple)';
    users.viewRule = users.listRule;
    users.createRule =
      '(@request.body.couple:isset = false && @request.body.app_role:isset = false) || ' +
      '(@request.auth.app_role = "owner" && couple != "" && couple = @request.auth.couple && ' +
      '(@request.body.app_role = "couple" || @request.body.app_role = "panitia" || @request.body.app_role = "wo"))';
    users.updateRule =
      '(id = @request.auth.id && ' +
      '@request.body.app_role:isset = false && ' +
      '@request.body.is_demo:isset = false && ' +
      '@request.body.demo_expires_at:isset = false && ' +
      '@request.body.couple:isset = false) || ' +
      '(@request.auth.app_role = "owner" && couple != "" && couple = @request.auth.couple && id != @request.auth.id) || ' +
      '(@request.auth.username = "admin")';
    users.deleteRule =
      '@request.auth.app_role = "owner" && couple != "" && couple = @request.auth.couple && id != @request.auth.id';
    app.save(users);
  },
  (_app) => {
    // Rollback otomatis sengaja tidak tersedia: mengembalikan aturan lama
    // berarti membuka kembali data antar akun. Pulihkan dari backup.
    throw new Error(
      "Rollback otomatis tidak tersedia. Pulihkan pb_data dari backup terverifikasi."
    );
  }
);
