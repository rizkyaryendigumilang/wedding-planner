/// <summary>
/// 2027-01-02 — Galeri prewedding, preferensi aplikasi, dan akun admin.
///
/// Menambahkan dua koleksi baru:
///   * gallery_photos — daftar foto prewedding (dari tautan Google Drive).
///   * app_settings   — preferensi yang dapat diubah pengguna dari antarmuka.
///
/// Serta memastikan akun `admin` tersedia untuk masuk ke aplikasi.
/// </summary>
migrate(
  (app) => {
    const AUTH = '@request.auth.id != ""';

    const coupleId = app.findCollectionByNameOrId("couples").id;

    const text = (name, opts = {}) => ({
      name,
      type: "text",
      required: opts.required ?? false,
      presentable: opts.presentable ?? false,
      system: false,
      hidden: false,
      max: opts.max ?? 0,
      min: 0,
      pattern: "",
      autogeneratePattern: "",
      primaryKey: false,
    });

    const number = (name) => ({
      name,
      type: "number",
      required: false,
      presentable: false,
      system: false,
      hidden: false,
      min: null,
      max: null,
      noDecimal: true,
    });

    const bool = (name) => ({
      name,
      type: "bool",
      required: false,
      presentable: false,
      system: false,
      hidden: false,
    });

    const url = (name, opts = {}) => ({
      name,
      type: "url",
      required: opts.required ?? false,
      presentable: false,
      system: false,
      hidden: false,
      exceptDomains: [],
      onlyDomains: [],
    });
    const date = (name) => ({
      name,
      type: "date",
      required: false,
      presentable: false,
      system: false,
      hidden: false,
      min: "",
      max: "",
    });

    const rel = (name, collectionId, opts = {}) => ({
      name,
      type: "relation",
      required: opts.required ?? false,
      presentable: false,
      system: false,
      hidden: false,
      collectionId,
      cascadeDelete: opts.cascadeDelete ?? true,
      minSelect: null,
      maxSelect: opts.maxSelect ?? 1,
      displayFields: [],
    });

    /**
     * Kolom waktu otomatis. Wajib ditambahkan sendiri karena koleksi di sini
     * dibuat lewat API `new Collection()` — berbeda dari koleksi bawaan
     * PocketBase yang mendapat `created`/`updated` secara implisit. Tanpa ini,
     * setiap request yang mengurutkan dengan `sort=created` akan gagal 400.
     */
    const autodate = (name, onCreate, onUpdate) => ({
      name,
      type: "autodate",
      required: false,
      presentable: false,
      system: false,
      hidden: false,
      onCreate,
      onUpdate,
    });

    /** PocketBase tidak punya hasCollection(); bungkus pencarian dengan try. */
    const exists = (name) => {
      try {
        app.findCollectionByNameOrId(name);
        return true;
      } catch (_) {
        return false;
      }
    };

    // =====================================================================
    // 1. gallery_photos — foto prewedding dari tautan Google Drive
    // =====================================================================
    if (!exists("gallery_photos")) {
      const c = new Collection({ name: "gallery_photos", type: "base", system: false });
      c.fields.add(new Field(rel("couple", coupleId)));
      c.fields.add(new Field(url("source_url", { required: true })));
      c.fields.add(new Field(text("alt", { max: 250 })));
      c.fields.add(new Field(text("section", { max: 120 })));
      c.fields.add(new Field(date("shot_date")));
      c.fields.add(new Field(bool("is_cover")));
      c.fields.add(new Field(number("sort_order")));
      c.fields.add(new Field(autodate("created", true, false)));
      c.fields.add(new Field(autodate("updated", false, true)));
      c.listRule = AUTH;
      c.viewRule = AUTH;
      c.createRule = AUTH;
      c.updateRule = AUTH;
      c.deleteRule = AUTH;
      app.save(c);
    }

    // =====================================================================
    // 2. app_settings — preferensi yang bisa diubah dari antarmuka
    // =====================================================================
    if (!exists("app_settings")) {
      const c = new Collection({ name: "app_settings", type: "base", system: false });
      c.fields.add(new Field(text("owner_key", { max: 120, required: true })));
      c.fields.add(new Field(text("prewed_drive_link", { max: 500 })));
      c.fields.add(new Field(bool("prewedding_done")));
      c.fields.add(new Field(text("gallery_title", { max: 160 })));
      c.fields.add(new Field(text("gallery_note", { max: 500 })));
      c.fields.add(new Field(bool("show_gallery_on_dashboard")));
      c.fields.add(new Field(autodate("created", true, false)));
      c.fields.add(new Field(autodate("updated", false, true)));
      c.listRule = AUTH;
      c.viewRule = AUTH;
      c.createRule = AUTH;
      c.updateRule = AUTH;
      c.deleteRule = AUTH;
      app.save(c);
    }

    // =====================================================================
    // 3. Akun admin untuk masuk ke aplikasi
    // =====================================================================
    try {
      app.findAuthRecordByEmail("users", "admin@wedding.local");
    } catch (_) {
      // Belum ada -> buat sekarang.
      try {
        const users = app.findCollectionByNameOrId("users");
        const record = new Record(users, {
          email: "admin@wedding.local",
          password: "admin",
          passwordConfirm: "admin",
          name: "admin",
          emailVisibility: false,
          verified: true,
        });
        app.save(record);
      } catch (_) {
        // Koleksi users mungkin belum ada pada pemasangan yang masih polos.
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("gallery_photos"));
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId("app_settings"));
    } catch (_) {}
  }
);
