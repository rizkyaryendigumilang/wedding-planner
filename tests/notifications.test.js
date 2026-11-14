import { describe, it, expect } from "vitest";
import { generateNotifications } from "../src/lib/notifications";

describe("Notifications Engine", () => {
  it("generates D-Day countdown milestone notifications", () => {
    const today = new Date();
    const d5 = new Date();
    d5.setDate(today.getDate() + 5);

    const weddingData = {
      couple: {
        wedding_date: d5.toISOString().split("T")[0],
        target_budget: 100000000,
      },
    };

    const notifs = generateNotifications(weddingData);
    const dDayNotif = notifs.find((n) => n.id === "dday_d7");
    expect(dDayNotif).toBeDefined();
    expect(dDayNotif.type).toBe("urgent");
    expect(dDayNotif.title).toContain("H-5");
  });

  it("triggers budget overspend alert when actual cost exceeds target", () => {
    const weddingData = {
      couple: {
        target_budget: 50000000,
      },
      budgets: [
        { actual_cost: 30000000 },
        { actual_cost: 25000000 },
      ],
    };

    const notifs = generateNotifications(weddingData);
    const overspend = notifs.find((n) => n.id === "budget_over");
    expect(overspend).toBeDefined();
    expect(overspend.type).toBe("urgent");
    expect(overspend.message).toContain("Rp 5.000.000");
  });

  it("warns about pending RSVPs", () => {
    const weddingData = {
      guests: [
        { id: "1", name: "Budi", rsvp_status: "Hadir" },
        { id: "2", name: "Siti", rsvp_status: "Belum" },
        { id: "3", name: "Andi", rsvp_status: "Belum" },
      ],
    };

    const notifs = generateNotifications(weddingData);
    const rsvpNotif = notifs.find((n) => n.id === "rsvp_pending");
    expect(rsvpNotif).toBeDefined();
    expect(rsvpNotif.title).toContain("2 Tamu");
  });

  it("respects preferences to disable specific alert types", () => {
    const weddingData = {
      couple: { target_budget: 50000000 },
      budgets: [{ actual_cost: 60000000 }],
      guests: [{ rsvp_status: "Belum" }],
    };

    const notifs = generateNotifications(weddingData, {
      budgetAlerts: false,
      rsvpReminders: false,
    });

    expect(notifs.find((n) => n.id === "budget_over")).toBeUndefined();
    expect(notifs.find((n) => n.id === "rsvp_pending")).toBeUndefined();
  });
});
