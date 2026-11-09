import { describe, it, expect } from "vitest";
import {
  getCppNickname,
  getCpwNickname,
  getCppFullName,
  getCpwFullName,
  getCoupleDisplayName,
  getCoupleInitials,
} from "../src/lib/couple";

describe("couple.js unit tests", () => {
  describe("getCppNickname", () => {
    it("returns couple nickname when set and not generic placeholder", () => {
      const couple = { cpp_nickname: "Rizky" };
      expect(getCppNickname(couple, null)).toBe("Rizky");
    });

    it("falls back to user name if user has partner_role CPP", () => {
      const couple = { cpp_nickname: "CPP" };
      const user = { partner_role: "CPP", name: "Rizky Aryendi" };
      expect(getCppNickname(couple, user)).toBe("Rizky Aryendi");
    });

    it("defaults to CPP if empty", () => {
      expect(getCppNickname(null, null)).toBe("CPP");
    });
  });

  describe("getCpwNickname", () => {
    it("returns couple nickname when set and not generic placeholder", () => {
      const couple = { cpw_nickname: "Reina" };
      expect(getCpwNickname(couple, null)).toBe("Reina");
    });

    it("falls back to user name if user has partner_role CPW", () => {
      const couple = { cpw_nickname: "CPW" };
      const user = { partner_role: "CPW", name: "Aurene" };
      expect(getCpwNickname(couple, user)).toBe("Aurene");
    });

    it("defaults to CPW if empty", () => {
      expect(getCpwNickname(null, null)).toBe("CPW");
    });
  });

  describe("getCppFullName & getCpwFullName", () => {
    it("returns full name when available", () => {
      const couple = {
        cpp_full_name: "Rizky Aryendi Gumilang",
        cpw_full_name: "Aurene Reina",
      };
      expect(getCppFullName(couple)).toBe("Rizky Aryendi Gumilang");
      expect(getCpwFullName(couple)).toBe("Aurene Reina");
    });

    it("falls back to nickname when full name is missing", () => {
      const couple = {
        cpp_nickname: "Rizky",
        cpw_nickname: "Reina",
      };
      expect(getCppFullName(couple)).toBe("Rizky");
      expect(getCpwFullName(couple)).toBe("Reina");
    });
  });

  describe("getCoupleDisplayName", () => {
    it("returns combined name when both nicknames exist", () => {
      const couple = { cpp_nickname: "Rizky", cpw_nickname: "Reina" };
      expect(getCoupleDisplayName(couple, null)).toBe("Rizky & Reina");
    });

    it("handles single partner cases cleanly", () => {
      expect(getCoupleDisplayName({ cpp_nickname: "Rizky", cpw_nickname: "CPW" }, null)).toBe(
        "Rizky & Pasangan"
      );
      expect(getCoupleDisplayName({ cpp_nickname: "CPP", cpw_nickname: "Reina" }, null)).toBe(
        "Pasangan & Reina"
      );
    });

    it("falls back to default placeholder", () => {
      expect(getCoupleDisplayName(null, null, "Wedding Planner")).toBe("Wedding Planner");
    });
  });

  describe("getCoupleInitials", () => {
    it("generates two-letter initials with ampersand", () => {
      const couple = { cpp_nickname: "Rizky", cpw_nickname: "Reina" };
      expect(getCoupleInitials(couple, null)).toBe("R&R");
    });

    it("falls back to WP when no customized names exist", () => {
      expect(getCoupleInitials(null, null)).toBe("WP");
    });
  });
});
