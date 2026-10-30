/// <summary>
/// 2027-01-08 — Fix fields for rundown_events, wedding_gifts, and set database-level RBAC rules.
/// Enforces backend authorization for financial data (budgets, cashflow, gifts, recycle_bin)
/// so panitia/WO cannot access financial records via direct API requests.
/// </summary>
migrate(
  (app) => {
    const text = (name, opts = {}) => ({
      name,
      type: "text",
      required: opts.required ?? false,
      presentable: false,
      system: false,
      hidden: false,
      max: opts.max ?? 0,
      min: 0,
      pattern: "",
      autogeneratePattern: "",
      primaryKey: false,
    });

    const number = (name, opts = {}) => ({
      name,
      type: "number",
      required: false,
      presentable: false,
      system: false,
      hidden: false,
      min: opts.min ?? null,
      max: opts.max ?? null,
      noDecimal: opts.noDecimal ?? true,
    });

    const bool = (name) => ({
      name,
      type: "bool",
      required: false,
      presentable: false,
      system: false,
      hidden: false,
    });

    const select = (name, values, opts = {}) => ({
      name,
      type: "select",
      required: opts.required ?? false,
      presentable: false,
      system: false,
      hidden: false,
      values,
      maxSelect: 1,
    });

    const rel = (name, collectionId, opts = {}) => ({
      name,
      type: "relation",
      required: opts.required ?? false,
      presentable: false,
      system: false,
      hidden: false,
      collectionId,
      cascadeDelete: opts.cascadeDelete ?? false,
      minSelect: null,
      maxSelect: 1,
      displayFields: opts.displayFields || [],
    });

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

    const AUTH_ALL = '@request.auth.id != ""';
    const AUTH_FINANCE =
      '@request.auth.id != "" && @request.auth.app_role != "panitia" && @request.auth.app_role != "wo"';

    const couplesId = app.findCollectionByNameOrId("couples").id;
    const guestsId = app.findCollectionByNameOrId("wedding_guests").id;

    // 1. Perbaiki rundown_events: tambahkan kolom nyata & pasang rules
    {
      const c = app.findCollectionByNameOrId("rundown_events");
      const has = (n) => c.fields.getByName(n) != null;
      if (!has("couple")) c.fields.add(new Field(rel("couple", couplesId, { required: true, cascadeDelete: true })));
      if (!has("phase"))
        c.fields.add(
          new Field(select("phase", ["Persiapan", "Akad / Pemberkatan", "Resepsi", "After Party"]))
        );
      if (!has("time_start")) c.fields.add(new Field(text("time_start", { required: true, max: 10 })));
      if (!has("time_end")) c.fields.add(new Field(text("time_end", { max: 10 })));
      if (!has("title")) c.fields.add(new Field(text("title", { required: true, max: 250 })));
      if (!has("location")) c.fields.add(new Field(text("location", { max: 250 })));
      if (!has("pic_name")) c.fields.add(new Field(text("pic_name", { max: 150 })));
      if (!has("pic_phone")) c.fields.add(new Field(text("pic_phone", { max: 50 })));
      if (!has("notes")) c.fields.add(new Field(text("notes", { max: 1000 })));
      if (!has("is_completed")) c.fields.add(new Field(bool("is_completed")));
      if (!has("sort_order")) c.fields.add(new Field(number("sort_order")));
      if (!has("created")) c.fields.add(new Field(autodate("created", true, false)));
      if (!has("updated")) c.fields.add(new Field(autodate("updated", false, true)));

      c.listRule = AUTH_ALL;
      c.viewRule = AUTH_ALL;
      c.createRule = AUTH_ALL;
      c.updateRule = AUTH_ALL;
      c.deleteRule = AUTH_ALL;
      app.save(c);
    }

    // 2. Perbaiki wedding_gifts: tambahkan kolom nyata & pasang rules terlindungi
    {
      const c = app.findCollectionByNameOrId("wedding_gifts");
      const has = (n) => c.fields.getByName(n) != null;
      if (!has("couple")) c.fields.add(new Field(rel("couple", couplesId, { required: true, cascadeDelete: true })));
      if (!has("guest_name")) c.fields.add(new Field(text("guest_name", { required: true, max: 200 })));
      if (!has("guest"))
        c.fields.add(new Field(rel("guest", guestsId, { required: false, displayFields: ["name"] })));
      if (!has("gift_type"))
        c.fields.add(
          new Field(
            select(
              "gift_type",
              [
                "Amplop Tunai",
                "Transfer Bank / QRIS",
                "Kado Fisik",
                "Logam Mulia",
                "Lainnya",
              ],
              { required: true }
            )
          )
        );
      if (!has("amount")) c.fields.add(new Field(number("amount")));
      if (!has("item_description")) c.fields.add(new Field(text("item_description", { max: 500 })));
      if (!has("destination_account")) c.fields.add(new Field(text("destination_account", { max: 100 })));
      if (!has("received_by")) c.fields.add(new Field(text("received_by", { max: 100 })));
      if (!has("thank_you_sent")) c.fields.add(new Field(bool("thank_you_sent")));
      if (!has("notes")) c.fields.add(new Field(text("notes", { max: 500 })));
      if (!has("created")) c.fields.add(new Field(autodate("created", true, false)));
      if (!has("updated")) c.fields.add(new Field(autodate("updated", false, true)));

      c.listRule = AUTH_FINANCE;
      c.viewRule = AUTH_FINANCE;
      c.createRule = AUTH_FINANCE;
      c.updateRule = AUTH_FINANCE;
      c.deleteRule = AUTH_FINANCE;
      app.save(c);
    }

    // 3. Perbaiki recycle_bin: pasang rules terlindungi
    {
      const c = app.findCollectionByNameOrId("recycle_bin");
      c.listRule = AUTH_FINANCE;
      c.viewRule = AUTH_FINANCE;
      c.createRule = AUTH_FINANCE;
      c.updateRule = AUTH_FINANCE;
      c.deleteRule = AUTH_FINANCE;
      app.save(c);
    }

    // 4. Perketat otorisasi backend untuk budgets & cashflow_entries
    {
      const b = app.findCollectionByNameOrId("budgets");
      b.listRule = AUTH_FINANCE;
      b.viewRule = AUTH_FINANCE;
      b.createRule = AUTH_FINANCE;
      b.updateRule = AUTH_FINANCE;
      b.deleteRule = AUTH_FINANCE;
      app.save(b);

      const cf = app.findCollectionByNameOrId("cashflow_entries");
      cf.listRule = AUTH_FINANCE;
      cf.viewRule = AUTH_FINANCE;
      cf.createRule = AUTH_FINANCE;
      cf.updateRule = AUTH_FINANCE;
      cf.deleteRule = AUTH_FINANCE;
      app.save(cf);
    }

    // 5. Perketat otorisasi backend untuk couples (panitia/WO tidak boleh ubah atau hapus data pasangan)
    {
      const cp = app.findCollectionByNameOrId("couples");
      cp.updateRule = AUTH_FINANCE;
      cp.deleteRule = AUTH_FINANCE;
      app.save(cp);
    }

    // 6. Lengkapi activity_logs dengan attribution fields & lindungi dari penghapusan
    {
      const al = app.findCollectionByNameOrId("activity_logs");
      const has = (n) => al.fields.getByName(n) != null;
      if (!has("actor_name")) al.fields.add(new Field(text("actor_name", { max: 150 })));
      if (!has("actor_role")) al.fields.add(new Field(text("actor_role", { max: 50 })));
      al.listRule = AUTH_ALL;
      al.viewRule = AUTH_ALL;
      al.createRule = AUTH_ALL;
      al.updateRule = AUTH_ALL;
      al.deleteRule = AUTH_FINANCE; // Panitia tidak dapat menghapus jejak audit
      app.save(al);
    }

    // 7. Berikan izin manageRule pada users agar owner dapat mereset sandi panitia darurat
    try {
      const u = app.findCollectionByNameOrId("users");
      u.manageRule = AUTH_FINANCE;
      u.deleteRule = AUTH_FINANCE;
      app.save(u);
    } catch (_) {}
  },
  (app) => {
    // Rollback: kembalikan rules ke standar
    const AUTH_ALL = '@request.auth.id != ""';
    try {
      const b = app.findCollectionByNameOrId("budgets");
      b.listRule = AUTH_ALL;
      b.viewRule = AUTH_ALL;
      b.createRule = AUTH_ALL;
      b.updateRule = AUTH_ALL;
      b.deleteRule = AUTH_ALL;
      app.save(b);

      const cf = app.findCollectionByNameOrId("cashflow_entries");
      cf.listRule = AUTH_ALL;
      cf.viewRule = AUTH_ALL;
      cf.createRule = AUTH_ALL;
      cf.updateRule = AUTH_ALL;
      cf.deleteRule = AUTH_ALL;
      app.save(cf);
    } catch (_) {}
  }
);
