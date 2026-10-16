/// <summary>
/// 2027-01-06 — Koleksi recycle_bin untuk fitur Soft Delete & Tempat Sampah.
/// </summary>
migrate(
  (app) => {
    try {
      const existing = app.findCollectionByNameOrId("recycle_bin");
      if (existing) return;
    } catch (_) {
      // Belum ada, lanjutkan buat
    }

    const collection = new Collection({
      name: "recycle_bin",
      type: "base",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        new Field({
          name: "collection_name",
          type: "text",
          required: true,
          presentable: false,
          system: false,
          hidden: false,
        }),
        new Field({
          name: "item_title",
          type: "text",
          required: true,
          presentable: false,
          system: false,
          hidden: false,
        }),
        new Field({
          name: "item_data",
          type: "json",
          required: false,
          presentable: false,
          system: false,
          hidden: false,
        }),
        new Field({
          name: "deleted_by",
          type: "text",
          required: false,
          presentable: false,
          system: false,
          hidden: false,
        }),
      ],
    });

    app.save(collection);
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("recycle_bin");
      if (collection) {
        app.delete(collection);
      }
    } catch (_) {}
  }
);
