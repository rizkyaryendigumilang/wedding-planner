/// <summary>
/// 2027-01-16 — Koleksi helpdesk_reports untuk lampiran foto & riwayat keluhan bantuan pengguna
/// </summary>
migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId("helpdesk_reports");
    } catch (_) {
      const c = new Collection({
        name: "helpdesk_reports",
        type: "base",
        system: false,
        listRule: "", // Terbuka agar admin helpdesk dapat memverifikasi pratinjau bukti
        viewRule: "", // Terbuka agar lampiran foto dapat diakses publik
        createRule: "", // Terbuka agar pengguna sesi aktif maupun tamu dapat mengirim kendala
        updateRule: null,
        deleteRule: null,
        fields: [
          new Field({
            name: "app",
            type: "text",
            required: false,
            max: 50,
          }),
          new Field({
            name: "user_name",
            type: "text",
            required: false,
            max: 120,
          }),
          new Field({
            name: "user_role",
            type: "text",
            required: false,
            max: 100,
          }),
          new Field({
            name: "complaint",
            type: "text",
            required: true,
            max: 5000,
          }),
          new Field({
            name: "from_url",
            type: "text",
            required: false,
            max: 1000,
          }),
          new Field({
            name: "attachment",
            type: "file",
            maxSelect: 1,
            maxSize: 10485760, // 10 MB
            mimeTypes: [
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/gif",
              "application/pdf",
            ],
          }),
        ],
      });
      app.save(c);
    }
  },
  (app) => {
    try {
      const c = app.findCollectionByNameOrId("helpdesk_reports");
      app.delete(c);
    } catch (_) {}
  }
);
