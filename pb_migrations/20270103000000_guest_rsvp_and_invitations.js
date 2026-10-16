/// <summary>
/// 2027-01-03 — Field RSVP WhatsApp, Link Undangan Tamu & Pengaturan Template.
/// </summary>
migrate(
  (app) => {
    // 1. wedding_guests: phone, invitation_url, invitation_sent
    try {
      const guests = app.findCollectionByNameOrId("wedding_guests");
      if (!guests.fields.getByName("phone")) {
        guests.fields.add(
          new Field({
            name: "phone",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 50,
          })
        );
      }
      if (!guests.fields.getByName("invitation_url")) {
        guests.fields.add(
          new Field({
            name: "invitation_url",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 500,
          })
        );
      }
      if (!guests.fields.getByName("invitation_sent")) {
        guests.fields.add(
          new Field({
            name: "invitation_sent",
            type: "bool",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
          })
        );
      }
      app.save(guests);
    } catch (_) {}

    // 2. app_settings: invitation_base_url, wa_invitation_template
    try {
      const settings = app.findCollectionByNameOrId("app_settings");
      if (!settings.fields.getByName("invitation_base_url")) {
        settings.fields.add(
          new Field({
            name: "invitation_base_url",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 500,
          })
        );
      }
      if (!settings.fields.getByName("wa_invitation_template")) {
        settings.fields.add(
          new Field({
            name: "wa_invitation_template",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 2000,
          })
        );
      }
      app.save(settings);
    } catch (_) {}
  },
  (_app) => {}
);
