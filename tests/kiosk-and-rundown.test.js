import { describe, it, expect } from "vitest";
import {
  shiftTimeString,
  computeRundownShift,
  generateVendorBriefText,
} from "../src/lib/rundownShifter";
import {
  generateCrewToken,
  verifyCrewToken,
  getCrewKioskUrl,
  generateCrewWhatsAppShareMessage,
} from "../src/lib/kiosk";

describe("Rundown Shifter Engine", () => {
  it("shifts time forward correctly", () => {
    expect(shiftTimeString("08:30", 15)).toBe("08:45");
    expect(shiftTimeString("08:45", 15)).toBe("09:00");
    expect(shiftTimeString("09:50", 25)).toBe("10:15");
  });

  it("shifts time backward correctly", () => {
    expect(shiftTimeString("09:15", -15)).toBe("09:00");
    expect(shiftTimeString("09:00", -30)).toBe("08:30");
  });

  it("handles midnight wrap around", () => {
    expect(shiftTimeString("23:50", 20)).toBe("00:10");
    expect(shiftTimeString("00:10", -20)).toBe("23:50");
  });

  it("handles empty or invalid time values safely", () => {
    expect(shiftTimeString("", 15)).toBe("");
    expect(shiftTimeString(null, 15)).toBe("");
    expect(shiftTimeString("invalid", 15)).toBe("invalid");
  });

  it("computes batch shift with start index preview", () => {
    const mockRundowns = [
      { id: "1", title: "MUA", time_start: "05:00", time_end: "07:00" },
      { id: "2", title: "Briefing", time_start: "07:00", time_end: "07:30" },
      { id: "3", title: "Akad", time_start: "08:00", time_end: "09:00" },
    ];

    // Shift 15 minutes starting from index 1 (Briefing)
    const shifted = computeRundownShift(mockRundowns, 15, 1);
    expect(shifted[0].time_start_new).toBe("05:00");
    expect(shifted[0].is_shifted).toBe(false);

    expect(shifted[1].time_start_new).toBe("07:15");
    expect(shifted[1].time_end_new).toBe("07:45");
    expect(shifted[1].is_shifted).toBe(true);

    expect(shifted[2].time_start_new).toBe("08:15");
    expect(shifted[2].time_end_new).toBe("09:15");
    expect(shifted[2].is_shifted).toBe(true);
  });

  it("generates formatted vendor brief text", () => {
    const text = generateVendorBriefText({
      vendorCategory: "catering",
      couple: { cpp_nickname: "Andi", cpw_nickname: "Bella" },
      rundowns: [{ title: "Prasmanan", time_start: "11:30", time_end: "13:30", is_completed: false }],
      guestSummary: { total: 200, totalPax: 400, hadir: 180 },
    });

    expect(text).toContain("Andi & Bella");
    expect(text).toContain("CATATAN KHUSUS CATERING");
    expect(text).toContain("400 porsi");
    expect(text).toContain("11:30 - 13:30");
  });
});

describe("Kiosk & Crew Quick-Link Engine", () => {
  const coupleId = "cpl_test_123456";

  it("generates deterministic crew token", () => {
    const token1 = generateCrewToken(coupleId);
    const token2 = generateCrewToken(coupleId);
    expect(token1).toBe(token2);
    expect(token1.length).toBeGreaterThan(6);
    expect(token1).toContain("crw_cpl_");
  });

  it("verifies valid and invalid crew tokens", () => {
    const validToken = generateCrewToken(coupleId);
    expect(verifyCrewToken(coupleId, validToken)).toBe(true);
    expect(verifyCrewToken(coupleId, "wrong_token")).toBe(false);
    expect(verifyCrewToken("other_couple", validToken)).toBe(false);
  });

  it("generates kiosk URL correctly", () => {
    const url = getCrewKioskUrl(coupleId, "https://wedding.my.id");
    expect(url).toContain("https://wedding.my.id/kiosk");
    expect(url).toContain(`c=${coupleId}`);
    expect(url).toContain("token=crw_");
  });

  it("formats WhatsApp share message", () => {
    const msg = generateCrewWhatsAppShareMessage({
      coupleName: "Andi & Bella",
      kioskUrl: "https://wedding.my.id/kiosk?c=123&token=abc",
    });
    expect(msg).toContain("Andi & Bella");
    expect(msg).toContain("https://wedding.my.id/kiosk?c=123&token=abc");
    expect(msg).toContain("Tidak perlu login");
  });
});
