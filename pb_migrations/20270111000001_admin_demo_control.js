/// <summary>
/// 2027-01-11 (lanjutan) — Beri akun admin akses baca ke seluruh akun pengguna
/// agar dapat mengelola akun demo (aktif/kadaluarsa) dari panel aplikasi.
///
/// Tanpa perubahan skema: hanya aturan koleksi `users`.
/// </summary>
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    users.listRule =
      'id = @request.auth.id || ' +
      '(@request.auth.app_role = "owner" && couple != "" && couple = @request.auth.couple) || ' +
      '(@request.auth.username = "admin")';

    users.viewRule = users.listRule;
    app.save(users);
  },
  (_app) => {
    throw new Error(
      "Rollback otomatis tidak tersedia. Pulihkan pb_data dari backup terverifikasi."
    );
  }
);
