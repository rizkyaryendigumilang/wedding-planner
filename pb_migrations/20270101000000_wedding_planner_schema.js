/// <summary>
/// 2027-01-01 — Wedding Planner: complete schema alignment with Excel
/// ("Copy of Wedding Planner for Reina.xlsx").
///
/// The original collections were created empty (only id/created/updated),
/// so every frontend create/read of a business field failed silently.
/// This migration adds all business fields and the two missing collections
/// (vendor_checklists, cashflow_entries) plus wedding_budget_items.
/// </summary>
migrate(
  (app) => {
    // Every collection is readable/writable only by authenticated users,
    // except couples/dashboard data which the app also reads anonymously.
    const AUTH = '@request.auth.id != ""';

    // ---------------------------------------------------------------- helpers
    const text = (name, opts = {}) => ({
      name,
      type: "text",
      required: opts.required ?? false,
      presentable: opts.presentable ?? false,
      system: false,
      hidden: false,
      max: opts.max ?? 0,
      min: opts.min ?? 0,
      pattern: opts.pattern ?? "",
      autogeneratePattern: opts.autogeneratePattern ?? "",
      primaryKey: false,
    });

    const number = (name, opts = {}) => ({
      name,
      type: "number",
      required: opts.required ?? false,
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
      cascadeDelete: opts.cascadeDelete ?? false,
      minSelect: null,
      maxSelect: opts.maxSelect ?? 1,
      displayFields: [],
    });

    const select = (name, values, opts = {}) => ({
      name,
      type: "select",
      required: opts.required ?? false,
      presentable: false,
      system: false,
      hidden: false,
      values,
      maxSelect: opts.maxSelect ?? 1,
    });

    const findId = (name) => {
      const col = app.findCollectionByNameOrId(name);
      return col.id;
    };

    // =====================================================================
    // 1. couples — pasangan & tanggal pernikahan
    // =====================================================================
    {
      const c = app.findCollectionByNameOrId("couples");
      c.fields.add(new Field(text("wedding_date", { max: 20 })));
      c.fields.add(new Field(number("target_budget", { noDecimal: true })));
      c.fields.add(new Field(text("prewed_drive_link", { max: 500 })));
      c.fields.add(new Field(text("cpp_full_name")));
      c.fields.add(new Field(text("cpp_nickname")));
      c.fields.add(new Field(text("cpp_gender")));
      c.fields.add(new Field(text("cpw_full_name")));
      c.fields.add(new Field(text("cpw_nickname")));
      c.fields.add(new Field(text("cpw_gender")));
      c.fields.add(new Field(text("venue")));
      c.fields.add(new Field(text("notes")));
      c.listRule = "";
      c.viewRule = "";
      c.createRule = AUTH;
      c.updateRule = AUTH;
      c.deleteRule = AUTH;
      app.save(c);
    }

    // =====================================================================
    // 2. budgets — Engagement/Sangjit + Wedding budget items (termin)
    // =====================================================================
    {
      const c = app.findCollectionByNameOrId("budgets");
      c.fields.add(
        new Field(
          rel("couple", findId("couples"), { cascadeDelete: true, maxSelect: 1 })
        )
      );
      c.fields.add(new Field(select("budget_type", ["sangjit", "wedding"])));
      c.fields.add(new Field(text("category", { max: 120 })));
      c.fields.add(new Field(text("detail", { required: true })));
      c.fields.add(new Field(text("status", { max: 60 })));
      c.fields.add(new Field(text("vendor", { max: 160 })));
      c.fields.add(new Field(number("total_biaya", { noDecimal: true })));
      c.fields.add(new Field(number("termin1", { noDecimal: true })));
      c.fields.add(new Field(number("termin2", { noDecimal: true })));
      c.fields.add(new Field(number("termin3", { noDecimal: true })));
      c.fields.add(new Field(number("termin4", { noDecimal: true })));
      c.fields.add(new Field(text("keterangan", { max: 500 })));
      c.listRule = AUTH;
      c.viewRule = AUTH;
      c.createRule = AUTH;
      c.updateRule = AUTH;
      c.deleteRule = AUTH;
      app.save(c);
    }

    // =====================================================================
    // 3. administrations — dokumen legal + checklist persiapan
    // =====================================================================
    {
      const c = app.findCollectionByNameOrId("administrations");
      c.fields.add(
        new Field(
          rel("couple", findId("couples"), { cascadeDelete: true, maxSelect: 1 })
        )
      );
      c.fields.add(new Field(text("section", { max: 160, required: true })));
      c.fields.add(new Field(text("section_code", { max: 4 })));
      c.fields.add(new Field(text("item", { max: 250, required: true })));
      c.fields.add(new Field(text("progress", { max: 60 })));
      c.fields.add(new Field(bool("cpp_complete")));
      c.fields.add(new Field(bool("cpw_complete")));
      c.fields.add(new Field(bool("is_document")));
      c.fields.add(new Field(text("details", { max: 500 })));
      c.fields.add(new Field(number("sort_order", { noDecimal: true })));
      c.listRule = AUTH;
      c.viewRule = AUTH;
      c.createRule = AUTH;
      c.updateRule = AUTH;
      c.deleteRule = AUTH;
      app.save(c);
    }

    // =====================================================================
    // 4. seserahan_items — daftar barang seserahan + link Shopee
    // =====================================================================
    {
      const c = app.findCollectionByNameOrId("seserahan_items");
      c.fields.add(
        new Field(
          rel("couple", findId("couples"), { cascadeDelete: true, maxSelect: 1 })
        )
      );
      c.fields.add(new Field(text("category", { max: 120 })));
      c.fields.add(new Field(text("detail", { required: true })));
      c.fields.add(new Field(text("brand", { max: 160 })));
      c.fields.add(new Field(number("qty", { noDecimal: true })));
      c.fields.add(new Field(text("link", { max: 500 })));
      c.fields.add(new Field(number("budget", { noDecimal: true })));
      c.fields.add(new Field(number("actually_harga", { noDecimal: true })));
      c.fields.add(new Field(bool("checklist")));
      c.fields.add(new Field(text("notes", { max: 500 })));
      c.listRule = AUTH;
      c.viewRule = AUTH;
      c.createRule = AUTH;
      c.updateRule = AUTH;
      c.deleteRule = AUTH;
      app.save(c);
    }

    // =====================================================================
    // 5. wedding_guests — daftar tamu CPP & CPW
    // =====================================================================
    {
      const c = app.findCollectionByNameOrId("wedding_guests");
      c.fields.add(
        new Field(
          rel("couple", findId("couples"), { cascadeDelete: true, maxSelect: 1 })
        )
      );
      c.fields.add(new Field(select("side", ["CPP", "CPW"])));
      c.fields.add(new Field(text("name", { required: true, max: 200 })));
      c.fields.add(new Field(text("relationship", { max: 120 })));
      c.fields.add(new Field(text("group_name", { max: 120 })));
      c.fields.add(
        new Field(
          select("priority", [
            "A - Must Invite",
            "B - Should Invite",
            "C - If Capacity Allows",
          ])
        )
      );
      c.fields.add(new Field(number("pax", { noDecimal: true })));
      c.fields.add(new Field(text("origin", { max: 160 })));
      c.fields.add(new Field(bool("checklist")));
      c.fields.add(new Field(select("type", ["Digital", "Fisik"])));
      c.fields.add(
        new Field(
          select("status", ["Belum", "Hadir", "Tidak Hadir", "Tanpa Keterangan"])
        )
      );
      c.fields.add(new Field(text("notes", { max: 500 })));
      c.listRule = AUTH;
      c.viewRule = AUTH;
      c.createRule = AUTH;
      c.updateRule = AUTH;
      c.deleteRule = AUTH;
      app.save(c);
    }

    // =====================================================================
    // 6. activity_logs — audit aktivitas dashboard
    // =====================================================================
    {
      const c = app.findCollectionByNameOrId("activity_logs");
      c.fields.add(
        new Field(
          rel("couple", findId("couples"), { cascadeDelete: true, maxSelect: 1 })
        )
      );
      c.fields.add(
        new Field(
          rel("actor_user", findId("users"), {
            cascadeDelete: false,
            maxSelect: 1,
          })
        )
      );
      c.fields.add(new Field(text("action_description", { max: 500 })));
      c.fields.add(new Field(select("action_type", ["info", "payment", "task", "guest", "document"])));
      c.fields.add(new Field(number("amount", { noDecimal: true })));
      c.listRule = AUTH;
      c.viewRule = AUTH;
      c.createRule = AUTH;
      c.updateRule = AUTH;
      c.deleteRule = AUTH;
      app.save(c);
    }

    // =====================================================================
    // 7. vendor_checklists — NEW: booking vendor + things to do + countdown
    // =====================================================================
    {
      const c = new Collection({
        name: "vendor_checklists",
        type: "base",
        system: false,
        fields: [
          new Field(
            rel("couple", findId("couples"), {
              cascadeDelete: true,
              maxSelect: 1,
            })
          ),
          new Field(text("category", { max: 120, required: true })),
          new Field(text("activity_name", { max: 250, required: true })),
          new Field(date("deadline_date")),
          new Field(bool("is_completed")),
          new Field(text("notes", { max: 500 })),
          new Field(number("sort_order", { noDecimal: true })),
        ],
        listRule: AUTH,
        viewRule: AUTH,
        createRule: AUTH,
        updateRule: AUTH,
        deleteRule: AUTH,
      });
      app.save(c);
    }

    // =====================================================================
    // 8. cashflow_entries — NEW: Wedding Cashflow CPP/CPW
    // =====================================================================
    {
      const c = new Collection({
        name: "cashflow_entries",
        type: "base",
        system: false,
        fields: [
          new Field(
            rel("couple", findId("couples"), {
              cascadeDelete: true,
              maxSelect: 1,
            })
          ),
          new Field(date("entry_date")),
          new Field(text("description", { required: true, max: 250 })),
          new Field(select("kind", ["income", "expense"])),
          new Field(select("owner", ["CPP", "CPW", "Bersama"])),
          new Field(number("amount", { noDecimal: true })),
          new Field(number("sort_order", { noDecimal: true })),
        ],
        listRule: AUTH,
        viewRule: AUTH,
        createRule: AUTH,
        updateRule: AUTH,
        deleteRule: AUTH,
      });
      app.save(c);
    }
  },
  (app) => {
    // Down migration: drop new collections and remove added fields.
    try {
      app.delete(app.findCollectionByNameOrId("vendor_checklists"));
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId("cashflow_entries"));
    } catch (_) {}
    // Note: field-level rollback is intentionally omitted to avoid data loss.
  }
);
