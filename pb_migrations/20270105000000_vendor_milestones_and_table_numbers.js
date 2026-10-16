/// <summary>
/// 2027-01-05 — Milestone Pembayaran Vendor, Nomor Meja Tamu & Upload Foto Langsung.
/// </summary>
migrate(
  (app) => {
    // 1. vendor_checklists: total_cost, dp_amount, dp_paid, settlement_paid, vendor_phone
    try {
      const vendors = app.findCollectionByNameOrId("vendor_checklists");
      if (!vendors.fields.getByName("total_cost")) {
        vendors.fields.add(new Field({ name: "total_cost", type: "number" }));
      }
      if (!vendors.fields.getByName("dp_amount")) {
        vendors.fields.add(new Field({ name: "dp_amount", type: "number" }));
      }
      if (!vendors.fields.getByName("dp_paid")) {
        vendors.fields.add(new Field({ name: "dp_paid", type: "bool" }));
      }
      if (!vendors.fields.getByName("settlement_paid")) {
        vendors.fields.add(new Field({ name: "settlement_paid", type: "bool" }));
      }
      if (!vendors.fields.getByName("vendor_phone")) {
        vendors.fields.add(new Field({ name: "vendor_phone", type: "text", max: 50 }));
      }
      app.save(vendors);
    } catch (_) {}

    // 2. wedding_guests: table_number
    try {
      const guests = app.findCollectionByNameOrId("wedding_guests");
      if (!guests.fields.getByName("table_number")) {
        guests.fields.add(new Field({ name: "table_number", type: "text", max: 50 }));
      }
      app.save(guests);
    } catch (_) {}

    // 3. gallery_photos: image
    try {
      const gallery = app.findCollectionByNameOrId("gallery_photos");
      if (!gallery.fields.getByName("image")) {
        gallery.fields.add(
          new Field({
            name: "image",
            type: "file",
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          })
        );
      }
      app.save(gallery);
    } catch (_) {}
  },
  (_app) => {}
);
