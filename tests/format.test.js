import { describe, it, expect } from "vitest";
import {
  formatRupiah,
  formatNumber,
  formatCompact,
  parseRupiahInput,
  formatRupiahInput,
  formatDateId,
  formatDateShort,
  daysUntil,
  countdownParts,
  initials,
  pct,
  monthlySavingNeeded,
  timeAgo,
} from "../src/lib/format";

describe("format.js unit tests", () => {
  describe("formatRupiah", () => {
    it("formats standard positive numbers to Indonesian Rupiah", () => {
      expect(formatRupiah(85000000)).toBe("Rp 85.000.000");
      expect(formatRupiah(1500000)).toBe("Rp 1.500.000");
    });

    it("formats 0 and empty/falsy values gracefully", () => {
      expect(formatRupiah(0)).toBe("Rp 0");
      expect(formatRupiah(null)).toBe("Rp 0");
      expect(formatRupiah(undefined)).toBe("Rp 0");
      expect(formatRupiah("")).toBe("Rp 0");
    });

    it("formats negative amounts", () => {
      expect(formatRupiah(-500000)).toBe("Rp -500.000");
    });
  });

  describe("formatNumber & formatCompact", () => {
    it("formats thousands without Rp prefix", () => {
      expect(formatNumber(1500000)).toBe("1.500.000");
      expect(formatNumber(0)).toBe("0");
    });

    it("formats compact representations for dashboards", () => {
      expect(formatCompact(85000000)).toBe("85,0 jt");
      expect(formatCompact(1500000000)).toBe("1,5 M");
      expect(formatCompact(500000)).toBe("500 rb");
      expect(formatCompact(500)).toBe("500");
    });
  });

  describe("parseRupiahInput", () => {
    it("parses raw rupiah string with prefix and dots into clean number", () => {
      expect(parseRupiahInput("Rp 85.000.000")).toBe(85000000);
      expect(parseRupiahInput("1.500.000")).toBe(1500000);
      expect(parseRupiahInput("Rp50000")).toBe(50000);
      expect(parseRupiahInput("")).toBe(0);
      expect(parseRupiahInput("abc")).toBe(0);
    });
  });

  describe("formatRupiahInput", () => {
    it("formats numeric inputs into dot-separated thousands", () => {
      expect(formatRupiahInput("85000000")).toBe("85.000.000");
      expect(formatRupiahInput(1500000)).toBe("1.500.000");
      expect(formatRupiahInput("")).toBe("");
    });
  });

  describe("formatDateId & formatDateShort", () => {
    it("formats ISO date string into Indonesian locale format", () => {
      const formatted = formatDateId("2028-02-17");
      expect(formatted).toBe("17 Februari 2028");
    });

    it("formats short date correctly", () => {
      expect(formatDateShort("2028-02-17")).toBe("17 Feb 2028");
    });

    it("returns dash for invalid or empty dates", () => {
      expect(formatDateId("")).toBe("-");
      expect(formatDateId(null)).toBe("-");
      expect(formatDateId("invalid-date")).toBe("-");
    });
  });

  describe("daysUntil & countdownParts", () => {
    it("returns null for invalid dates", () => {
      expect(daysUntil("")).toBeNull();
      expect(daysUntil(null)).toBeNull();
    });

    it("calculates positive days for future date", () => {
      const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
      expect(daysUntil(future)).toBeGreaterThanOrEqual(4);
    });

    it("calculates countdown parts accurately", () => {
      const future = new Date(Date.now() + 86400000 + 3600000).toISOString();
      const parts = countdownParts(future);
      expect(parts.days).toBeGreaterThanOrEqual(1);
      expect(parts.isPast).toBe(false);
    });
  });

  describe("initials", () => {
    it("extracts up to 2 uppercase initials", () => {
      expect(initials("Rizky Aryendi Gumilang")).toBe("RA");
      expect(initials("Reina")).toBe("R");
      expect(initials("")).toBe("");
    });
  });

  describe("pct (percentage)", () => {
    it("calculates percentage accurately", () => {
      expect(pct(50, 100)).toBe(50);
      expect(pct(1, 4)).toBe(25);
    });

    it("handles zero denominator safely", () => {
      expect(pct(50, 0)).toBe(0);
    });

    it("caps percentage at 100", () => {
      expect(pct(150, 100)).toBe(100);
    });
  });

  describe("monthlySavingNeeded", () => {
    it("calculates required monthly savings toward future date", () => {
      const future = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
      const needed = monthlySavingNeeded(30000000, future);
      expect(needed).toBeGreaterThan(0);
    });

    it("returns 0 when target date is passed or invalid", () => {
      expect(monthlySavingNeeded(10000000, null)).toBe(0);
    });
  });

  describe("timeAgo", () => {
    it("formats recent timestamps into friendly Indonesian relative time", () => {
      const now = new Date().toISOString();
      expect(timeAgo(now)).toBe("baru saja");
      expect(timeAgo("")).toBe("-");
    });
  });
});
