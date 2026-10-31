/// <summary>
/// 2027-01-09 — Tambah field is_demo & demo_expires_at pada users
/// untuk mendukung akun showcase yang otomatis kadaluarsa dalam 7 hari.
/// </summary>
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    if (!users.fields.getByName("is_demo")) {
      users.fields.add(
        new Field({
          name: "is_demo",
          type: "bool",
          required: false,
          presentable: false,
          system: false,
          hidden: false,
        })
      );
    }

    if (!users.fields.getByName("demo_expires_at")) {
      users.fields.add(
        new Field({
          name: "demo_expires_at",
          type: "date",
          required: false,
          presentable: false,
          system: false,
          hidden: false,
        })
      );
    }

    app.save(users);
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId("users");
      try { users.fields.removeByName("is_demo"); } catch (_) {}
      try { users.fields.removeByName("demo_expires_at"); } catch (_) {}
      app.save(users);
    } catch (_) {}
  }
);
