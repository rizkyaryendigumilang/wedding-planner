/// <summary>
/// 2027-01-11 (lanjutan) — Kepemilikan couple sebagai dasar akses akun.
///
/// Masalah yang diperbaiki:
/// Akun yang mendaftar baru belum memiliki nilai `users.couple`, sehingga
/// aturan lama (yang membandingkan `couple = @request.auth.couple`) membuat
/// pemilik tidak dapat melihat/membuat akun anggota keluarganya, dan aplikasi
/// selalu gagal menautkan `users.couple` setelah couple pertama dibuat.
///
/// Penyelesaian tanpa perubahan skema: akses ditentukan lewat relasi
/// `couple.owner = @request.auth.id`, sehingga pemilik couple tetap berwenang
/// meskipun `users.couple` masih kosong.
///
/// Field sensitif (app_role, is_demo, demo_expires_at) tetap tidak boleh
/// diubah sendiri. `couple` hanya boleh ditautkan ke couple yang dimiliki
/// oleh pengguna tersebut.
/// </summary>
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    const isAdmin = '@request.auth.username = "admin"';
    const ownsCouple = '(couple != "" && couple.owner = @request.auth.id)';

    users.listRule = 'id = @request.auth.id || ' + ownsCouple + " || " + isAdmin;
    users.viewRule = users.listRule;

    users.createRule =
      // Pendaftaran mandiri: tidak boleh menentukan couple maupun peran.
      "(@request.body.couple:isset = false && @request.body.app_role:isset = false) || " +
      // Pemilik couple membuat akun anggota untuk couple miliknya.
      "(@request.body.couple:isset = true && " +
      "@request.body.couple.owner = @request.auth.id && " +
      "@request.body.app_role:isset = true && " +
      '(@request.body.app_role = "couple" || @request.body.app_role = "panitia" || @request.body.app_role = "wo"))';

    users.updateRule =
      // Diri sendiri: field sensitif terkunci, couple hanya ke milik sendiri.
      "(id = @request.auth.id && " +
      "@request.body.app_role:isset = false && " +
      "@request.body.is_demo:isset = false && " +
      "@request.body.demo_expires_at:isset = false && " +
      "(@request.body.couple:isset = false || @request.body.couple.owner = @request.auth.id)) || " +
      // Pemilik couple mengelola anggota lain di couple-nya.
      "(" + ownsCouple + " && id != @request.auth.id) || " +
      // Kontrol admin aplikasi (mengaktifkan kembali akun demo).
      "(" + isAdmin + ")";

    users.deleteRule = ownsCouple + " && id != @request.auth.id";

    app.save(users);
  },
  (_app) => {
    throw new Error(
      "Rollback otomatis tidak tersedia. Pulihkan pb_data dari backup terverifikasi."
    );
  }
);
