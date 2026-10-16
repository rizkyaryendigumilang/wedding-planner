/// <summary>
/// 2027-01-04 — Pengaturan Alerts dan Field partner_role untuk Skema 2 Akun.
/// </summary>
migrate(
  (app) => {
    // 1. app_settings: alert_vendor_deadline, alert_vendor_days, alert_budget_overrun, alert_rsvp_reminder
    try {
      const settings = app.findCollectionByNameOrId("app_settings");
      if (!settings.fields.getByName("alert_vendor_deadline")) {
        settings.fields.add(
          new Field({
            name: "alert_vendor_deadline",
            type: "bool",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
          })
        );
      }
      if (!settings.fields.getByName("alert_vendor_days")) {
        settings.fields.add(
          new Field({
            name: "alert_vendor_days",
            type: "number",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            min: 1,
            max: 90,
          })
        );
      }
      if (!settings.fields.getByName("alert_budget_overrun")) {
        settings.fields.add(
          new Field({
            name: "alert_budget_overrun",
            type: "bool",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
          })
        );
      }
      if (!settings.fields.getByName("alert_rsvp_reminder")) {
        settings.fields.add(
          new Field({
            name: "alert_rsvp_reminder",
            type: "bool",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
          })
        );
      }
      app.save(settings);
    } catch (_) {}

    // 2. users: partner_role
    try {
      const users = app.findCollectionByNameOrId("users");
      if (!users.fields.getByName("partner_role")) {
        users.fields.add(
          new Field({
            name: "partner_role",
            type: "text",
            required: false,
            presentable: false,
            system: false,
            hidden: false,
            max: 10,
          })
        );
      }
      users.listRule = "@request.auth.id != ''";
      app.save(users);
    } catch (_) {}
  },
  (_app) => {}
);
