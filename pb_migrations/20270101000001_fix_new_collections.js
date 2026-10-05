/// <summary>
/// 2027-01-01-fix — The previous migration created vendor_checklists and
/// cashflow_entries via the Collection({ fields: [...] }) constructor, which
/// PocketBase 0.40 silently ignores (fields must be added through
/// collection.fields.add()). This migration adds the real fields.
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
    const rel = (name, collectionId) => ({
      name,
      type: "relation",
      required: false,
      presentable: false,
      system: false,
      hidden: false,
      collectionId,
      cascadeDelete: true,
      minSelect: null,
      maxSelect: 1,
      displayFields: [],
    });
    const select = (name, values) => ({
      name,
      type: "select",
      required: false,
      presentable: false,
      system: false,
      hidden: false,
      values,
      maxSelect: 1,
    });

    const AUTH = '@request.auth.id != ""';
    const coupleId = app.findCollectionByNameOrId("couples").id;

    // ---- vendor_checklists ------------------------------------------------
    {
      const c = app.findCollectionByNameOrId("vendor_checklists");
      const has = (n) => c.fields.getByName(n) != null;
      if (!has("couple")) c.fields.add(new Field(rel("couple", coupleId)));
      if (!has("category")) c.fields.add(new Field(text("category", { required: true, max: 120 })));
      if (!has("activity_name"))
        c.fields.add(new Field(text("activity_name", { required: true, max: 250 })));
      if (!has("deadline_date")) c.fields.add(new Field(date("deadline_date")));
      if (!has("is_completed")) c.fields.add(new Field(bool("is_completed")));
      if (!has("notes")) c.fields.add(new Field(text("notes", { max: 500 })));
      if (!has("sort_order")) c.fields.add(new Field(number("sort_order")));
      c.listRule = AUTH;
      c.viewRule = AUTH;
      c.createRule = AUTH;
      c.updateRule = AUTH;
      c.deleteRule = AUTH;
      app.save(c);
    }

    // ---- cashflow_entries -------------------------------------------------
    {
      const c = app.findCollectionByNameOrId("cashflow_entries");
      const has = (n) => c.fields.getByName(n) != null;
      if (!has("couple")) c.fields.add(new Field(rel("couple", coupleId)));
      if (!has("entry_date")) c.fields.add(new Field(date("entry_date")));
      if (!has("description"))
        c.fields.add(new Field(text("description", { required: true, max: 250 })));
      if (!has("kind")) c.fields.add(new Field(select("kind", ["income", "expense"])));
      if (!has("owner"))
        c.fields.add(new Field(select("owner", ["CPP", "CPW", "Bersama"])));
      if (!has("amount")) c.fields.add(new Field(number("amount")));
      if (!has("sort_order")) c.fields.add(new Field(number("sort_order")));
      c.listRule = AUTH;
      c.viewRule = AUTH;
      c.createRule = AUTH;
      c.updateRule = AUTH;
      c.deleteRule = AUTH;
      app.save(c);
    }
  },
  (_app) => {
    // no-op rollback; the parent migration owns these collections
  }
);
