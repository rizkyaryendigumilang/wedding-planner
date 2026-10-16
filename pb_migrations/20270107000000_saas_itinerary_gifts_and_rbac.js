/// <summary>
/// 2027-01-07 — SaaS Foundation, Itinerary Hari-H, Reception Check-in & Gift Tracker
/// </summary>
migrate(
  (app) => {
    const couplesCollection = app.findCollectionByNameOrId("couples");
    const couplesId = couplesCollection.id;
    const usersCollection = app.findCollectionByNameOrId("users");
    const usersId = usersCollection.id;
    const guestsCollection = app.findCollectionByNameOrId("wedding_guests");
    const guestsId = guestsCollection.id;

    const AUTH = "@request.auth.id != ''";

    // 1. Tambah owner ke couples (Multi-tenant SaaS)
    try {
      if (!couplesCollection.fields.getByName("owner")) {
        couplesCollection.fields.add(
          new Field({
            name: "owner",
            type: "relation",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            collectionId: usersId,
            cascadeDelete: false,
            maxSelect: 1,
            displayFields: ["username", "email"],
          })
        );
        app.save(couplesCollection);
      }
    } catch (e) {
      console.log("Error updating couples:", e);
    }

    // 2. Tambah app_role dan couple ke users (RBAC: owner vs panitia vs wo)
    try {
      if (!usersCollection.fields.getByName("app_role")) {
        usersCollection.fields.add(
          new Field({
            name: "app_role",
            type: "select",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            values: ["owner", "couple", "panitia", "wo"],
            maxSelect: 1,
          })
        );
      }
      if (!usersCollection.fields.getByName("couple")) {
        usersCollection.fields.add(
          new Field({
            name: "couple",
            type: "relation",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            collectionId: couplesId,
            cascadeDelete: false,
            maxSelect: 1,
            displayFields: ["cpp_nickname", "cpw_nickname"],
          })
        );
      }
      app.save(usersCollection);

      // Defaultkan admin yang sudah ada sebagai "owner"
      try {
        const admin = app.findAuthRecordByEmail("users", "admin@wedding.local");
        if (admin && !admin.getString("app_role")) {
          admin.set("app_role", "owner");
          app.save(admin);
        }
      } catch (_) {}
    } catch (e) {
      console.log("Error updating users:", e);
    }

    // 3. Tambah field check-in resepsi ke wedding_guests
    try {
      if (!guestsCollection.fields.getByName("checked_in")) {
        guestsCollection.fields.add(
          new Field({
            name: "checked_in",
            type: "bool",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
          })
        );
      }
      if (!guestsCollection.fields.getByName("checked_in_at")) {
        guestsCollection.fields.add(
          new Field({
            name: "checked_in_at",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 50,
          })
        );
      }
      if (!guestsCollection.fields.getByName("actual_pax")) {
        guestsCollection.fields.add(
          new Field({
            name: "actual_pax",
            type: "number",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            min: 0,
            max: 50,
            noDecimal: true,
          })
        );
      }
      if (!guestsCollection.fields.getByName("souvenir_given")) {
        guestsCollection.fields.add(
          new Field({
            name: "souvenir_given",
            type: "bool",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
          })
        );
      }
      app.save(guestsCollection);
    } catch (e) {
      console.log("Error updating wedding_guests:", e);
    }

    // 4. Koleksi rundown_events (Itinerary Hari-H)
    try {
      app.findCollectionByNameOrId("rundown_events");
    } catch (_) {
      const rundown = new Collection({
        name: "rundown_events",
        type: "base",
        system: false,
        listRule: AUTH,
        viewRule: AUTH,
        createRule: AUTH,
        updateRule: AUTH,
        deleteRule: AUTH,
        fields: [
          new Field({
            name: "couple",
            type: "relation",
            required: true,
            presentable: false,
            system: false,
            hidden: false,
            collectionId: couplesId,
            cascadeDelete: true,
            maxSelect: 1,
            displayFields: [],
          }),
          new Field({
            name: "phase",
            type: "select",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            values: ["Persiapan", "Akad / Pemberkatan", "Resepsi", "After Party"],
            maxSelect: 1,
          }),
          new Field({
            name: "time_start",
            type: "text",
            required: true,
            presentable: false,
            system: false,
            hidden: false,
            max: 10,
          }),
          new Field({
            name: "time_end",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 10,
          }),
          new Field({
            name: "title",
            type: "text",
            required: true,
            presentable: false,
            system: false,
            hidden: false,
            max: 250,
          }),
          new Field({
            name: "location",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 250,
          }),
          new Field({
            name: "pic_name",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 150,
          }),
          new Field({
            name: "pic_phone",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 50,
          }),
          new Field({
            name: "notes",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 1000,
          }),
          new Field({
            name: "is_completed",
            type: "bool",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
          }),
          new Field({
            name: "sort_order",
            type: "number",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            noDecimal: true,
          }),
        ],
      });
      app.save(rundown);
    }

    // 5. Koleksi wedding_gifts (Pencatatan Angpao & Kado)
    try {
      app.findCollectionByNameOrId("wedding_gifts");
    } catch (_) {
      const gifts = new Collection({
        name: "wedding_gifts",
        type: "base",
        system: false,
        listRule: AUTH,
        viewRule: AUTH,
        createRule: AUTH,
        updateRule: AUTH,
        deleteRule: AUTH,
        fields: [
          new Field({
            name: "couple",
            type: "relation",
            required: true,
            presentable: false,
            system: false,
            hidden: false,
            collectionId: couplesId,
            cascadeDelete: true,
            maxSelect: 1,
            displayFields: [],
          }),
          new Field({
            name: "guest_name",
            type: "text",
            required: true,
            presentable: false,
            system: false,
            hidden: false,
            max: 200,
          }),
          new Field({
            name: "guest",
            type: "relation",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            collectionId: guestsId,
            cascadeDelete: false,
            maxSelect: 1,
            displayFields: ["name"],
          }),
          new Field({
            name: "gift_type",
            type: "select",
            required: true,
            presentable: false,
            system: false,
            hidden: false,
            values: [
              "Amplop Tunai",
              "Transfer Bank / QRIS",
              "Kado Fisik",
              "Logam Mulia",
              "Lainnya",
            ],
            maxSelect: 1,
          }),
          new Field({
            name: "amount",
            type: "number",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            noDecimal: true,
          }),
          new Field({
            name: "item_description",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 500,
          }),
          new Field({
            name: "destination_account",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 100,
          }),
          new Field({
            name: "received_by",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 100,
          }),
          new Field({
            name: "thank_you_sent",
            type: "bool",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
          }),
          new Field({
            name: "notes",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 500,
          }),
        ],
      });
      app.save(gifts);
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("rundown_events"));
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId("wedding_gifts"));
    } catch (_) {}
  }
);
