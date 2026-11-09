/// <summary>
/// 2027-01-14 — Lampiran Berkas Digital (Kontrak / Struk Pembayaran Vendor & Dokumen Administrasi Legal)
/// </summary>
migrate(
  (app) => {
    // 1. vendor_checklists: attachment (file PDF / gambar bukti struk / kontrak)
    try {
      const vendors = app.findCollectionByNameOrId("vendor_checklists");
      if (!vendors.fields.getByName("attachment")) {
        vendors.fields.add(
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
          })
        );
      }
      app.save(vendors);
    } catch (_) {}

    // 2. administrations: attachment (file PDF / scan berkas KTP, KK, Surat Pengantar KUA)
    try {
      const administrations = app.findCollectionByNameOrId("administrations");
      if (!administrations.fields.getByName("attachment")) {
        administrations.fields.add(
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
          })
        );
      }
      app.save(administrations);
    } catch (_) {}
  },
  (_app) => {}
);
