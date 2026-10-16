/// <summary>
/// 2027-01-02-fix — Aktifkan akun admin dengan kredensial yang diminta.
///
/// PocketBase menolak kata sandi di bawah 8 karakter. Aplikasi ini berjalan di
/// jaringan lokal (localhost) dan dipakai satu keluarga, jadi panjang minimum
/// diturunkan ke 5 karakter agar akun `admin` / `admin` dapat dibuat.
/// Panjang minimum 5 tetap mencegah kata sandi kosong atau satu huruf.
/// </summary>
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // Turunkan batas panjang kata sandi pada field `password` (system field).
    const passwordField = users.fields.getByName("password");
    if (passwordField) {
      passwordField.min = 5;
      app.save(users);
    }

    // Buat akun admin bila belum ada.
    let exists = true;
    try {
      app.findAuthRecordByEmail("users", "admin@wedding.local");
    } catch (_) {
      exists = false;
    }

    if (!exists) {
      // `new Record()` dengan `password` di payload tidak selalu meng-hash
      // kata sandi pada PocketBase 0.40. Setel lewat setPassword() agar pasti
      // tersimpan sebagai hash yang bisa dipakai login.
      const record = new Record(users, {
        email: "admin@wedding.local",
        name: "admin",
        emailVisibility: false,
        verified: true,
      });
      record.setPassword("admin");
      app.save(record);
    }
  },
  (_app) => {
    // Tidak di-rollback: menaikkan kembali batas minimum bisa mengunci akun
    // yang sudah dibuat dengan kata sandi pendek.
  }
);
