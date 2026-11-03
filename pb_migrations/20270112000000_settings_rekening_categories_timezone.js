/// <summary>
/// 2027-01-12 — Pengaturan Rekening Bank & QRIS, Kategori Adat/Vendor Dinamis, dan Zona Waktu Acara.
/// </summary>
migrate(
  (app) => {
    try {
      const settings = app.findCollectionByNameOrId("app_settings");
      if (!settings) return;

      const addFieldIfMissing = (name, type, opts = {}) => {
        try {
          if (settings.fields.getByName(name)) return;
        } catch (_) {}
        settings.fields.add(
          new Field({
            name,
            type,
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: opts.max || 0,
          })
        );
      };

      // 1. Rekening Bank & QRIS Amplop Digital
      addFieldIfMissing("bank_accounts", "json");
      addFieldIfMissing("qris_image_url", "text", { max: 1000 });
      addFieldIfMissing("qris_instruction", "text", { max: 1000 });

      // 2. Kategori Adat & Vendor Dinamis
      addFieldIfMissing("custom_budget_categories", "json");
      addFieldIfMissing("custom_vendor_categories", "json");

      // 3. Zona Waktu & Format Tanggal
      addFieldIfMissing("event_timezone", "text", { max: 50 });
      addFieldIfMissing("date_format_style", "text", { max: 50 });

      app.save(settings);
    } catch (err) {
      console.warn("Migrasi pengaturan rekening, kategori, & zona waktu dilewati:", err);
    }
  },
  (app) => {
    try {
      const settings = app.findCollectionByNameOrId("app_settings");
      if (!settings) return;
      const removeField = (name) => {
        try {
          const f = settings.fields.getByName(name);
          if (f) settings.fields.remove(f);
        } catch (_) {}
      };
      removeField("bank_accounts");
      removeField("qris_image_url");
      removeField("qris_instruction");
      removeField("custom_budget_categories");
      removeField("custom_vendor_categories");
      removeField("event_timezone");
      removeField("date_format_style");
      app.save(settings);
    } catch (_) {}
  }
);
