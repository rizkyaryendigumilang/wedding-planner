/// <summary>
/// 2027-01-02-login — Izinkan masuk memakai "admin" maupun emailnya.
///
/// `passwordAuth.identityFields` hanya menerima nama field yang benar-benar
/// ada di koleksi (email, username, atau field teks unik lain). Koleksi `users`
/// bawaan tidak punya field `username`, jadi kita tambahkan sekarang beserta
/// indeks uniknya, lalu daftarkan sebagai identitas login kedua.
/// </summary>
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // 1. Tambahkan field `username` bila belum ada.
    if (!users.fields.getByName("username")) {
      users.fields.add(
        new Field({
          name: "username",
          type: "text",
          required: false,
          presentable: false,
          system: false,
          hidden: false,
          max: 60,
          min: 3,
          pattern: "^[a-zA-Z0-9_.-]+$",
          autogeneratePattern: "",
          primaryKey: false,
        })
      );
    }

    // 2. Tegakkan keunikan username pada tingkat basis data.
    const indexName = "idx_username_users_unique";
    const hasIndex = (users.indexes || []).some((i) => i.includes(indexName));
    if (!hasIndex) {
      users.indexes = [
        ...(users.indexes || []),
        `CREATE UNIQUE INDEX \`${indexName}\` ON \`users\` (\`username\`) WHERE \`username\` != ''`,
      ];
    }

    // 3. Daftarkan email + username sebagai identitas login.
    users.passwordAuth = { enabled: true, identityFields: ["email", "username"] };

    app.save(users);

    // 4. Isi username untuk akun admin yang sudah ada.
    try {
      const admin = app.findAuthRecordByEmail("users", "admin@wedding.local");
      if (!admin.getString("username")) {
        admin.set("username", "admin");
        app.save(admin);
      }
    } catch (_) {
      // Akun belum ada (mis. migrasi admin dijalankan belakangan) — abaikan.
    }
  },
  (_app) => {
    // Biarkan field & konfigurasi login terpasang agar akun tidak terkunci.
  }
);
