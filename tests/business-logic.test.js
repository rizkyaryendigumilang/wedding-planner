import { describe, it, expect } from "vitest";
import {
  computeStats,
  getBudgetPaid,
  getScopedCacheKey,
  countBy,
} from "../src/lib/weddingData";

describe("business-logic.test.js unit tests", () => {
  describe("getBudgetPaid", () => {
    it("sums up termin 1 through 4 correctly", () => {
      const budget = {
        termin1: 5000000,
        termin2: 5000000,
        termin3: 5000000,
        termin4: 0,
      };
      expect(getBudgetPaid(budget)).toBe(15000000);
    });

    it("handles missing or string termin values safely", () => {
      expect(getBudgetPaid({ termin1: "2500000" })).toBe(2500000);
      expect(getBudgetPaid(null)).toBe(0);
      expect(getBudgetPaid({})).toBe(0);
    });
  });

  describe("getScopedCacheKey", () => {
    it("creates user or couple scoped local storage keys", () => {
      expect(getScopedCacheKey("cpl_12345")).toBe("wedding_planner_cache_v2_cpl_12345");
      expect(getScopedCacheKey({ couple: "cpl_67890" })).toBe("wedding_planner_cache_v2_cpl_67890");
      expect(getScopedCacheKey({ id: "usr_abcde" })).toBe("wedding_planner_cache_v2_usr_abcde");
      expect(getScopedCacheKey(null)).toBe("wedding_planner_cache_v2");
    });
  });

  describe("countBy", () => {
    it("groups and counts items by given key and sorts by frequency descending", () => {
      const items = [
        { category: "Dekorasi" },
        { category: "Catering" },
        { category: "Catering" },
        { category: "Catering" },
        { category: "Dokumentasi" },
      ];
      const result = countBy(items, "category");
      expect(result).toEqual([
        { label: "Catering", value: 3 },
        { label: "Dekorasi", value: 1 },
        { label: "Dokumentasi", value: 1 },
      ]);
    });

    it("falls back to 'Lainnya' when key is missing", () => {
      const items = [{ name: "A" }, { name: "B" }];
      const result = countBy(items, "type");
      expect(result).toEqual([{ label: "Lainnya", value: 2 }]);
    });
  });

  describe("computeStats", () => {
    it("accurately computes financial metrics and targets", () => {
      const mockData = {
        couple: {
          target_budget: 85000000,
        },
        budgets: [
          { total_biaya: 15000000, termin1: 5000000, termin2: 5000000 },
          { total_biaya: 3000000, termin1: 3000000 },
        ],
        administrations: [
          { is_document: true, cpp_complete: true, cpw_complete: true },
          { is_document: true, cpp_complete: true, cpw_complete: false },
          { is_document: false, progress: "Sudah" },
        ],
        seserahan: [
          { budget: 1000000, actually_harga: 950000, checklist: true },
        ],
        vendors: [
          { is_completed: true },
          { is_completed: false },
        ],
        guests: [
          { name: "Budi", pax: 2, status: "Hadir", checked_in: true, actual_pax: 2 },
          { name: "Siti", pax: 1, status: "Belum", checked_in: false },
        ],
        cashflow: [
          { kind: "income", owner: "CPP", amount: 50000000 },
          { kind: "income", owner: "CPW", amount: 20000000 },
          { kind: "expense", owner: "CPP", amount: 8000000 },
        ],
        photos: [],
        settings: null,
        rundowns: [
          { title: "Akad", is_completed: true, phase: "Akad" },
          { title: "Resepsi", is_completed: false, phase: "Resepsi" },
        ],
        gifts: [
          { gift_type: "Amplop Tunai", amount: 1000000 },
          { gift_type: "Transfer Bank / QRIS", amount: 500000 },
        ],
      };

      const stats = computeStats(mockData);

      // Financial calculations
      expect(stats.finance.income).toBe(70000000);
      expect(stats.finance.expense).toBe(8000000);
      expect(stats.finance.balance).toBe(62000000);
      expect(stats.finance.targetBudget).toBe(85000000);
      expect(stats.finance.remainingTarget).toBe(23000000);

      // Budgets
      expect(stats.budgetSummary.total).toBe(18000000);
      expect(stats.budgetSummary.paid).toBe(13000000);
      expect(stats.budgetSummary.outstanding).toBe(5000000);

      // Guests & Reception Check-in
      expect(stats.guestSummary.total).toBe(2);
      expect(stats.guestSummary.totalPax).toBe(3);
      expect(stats.guestSummary.paxHadir).toBe(2);
      expect(stats.guestSummary.checkedInCount).toBe(1);

      // Gifts
      expect(stats.giftSummary.total).toBe(2);
      expect(stats.giftSummary.totalGiftAmount).toBe(1500000);

      // Rundown
      expect(stats.rundownSummary.total).toBe(2);
      expect(stats.rundownSummary.done).toBe(1);
      expect(stats.rundownSummary.remaining).toBe(1);
    });

    it("correctly groups seserahan budgets including backward-compatible sangjit items", () => {
      const mockBudgets = [
        { id: "b1", detail: "Kotak Seserahan Adat", budget_type: "seserahan", total_biaya: 2500000 },
        { id: "b2", detail: "Kain & Pakaian Adat", budget_type: "sangjit", total_biaya: 1500000 },
        { id: "b3", detail: "Gedung Resepsi", budget_type: "wedding", total_biaya: 25000000 },
      ];

      const seserahanBudgets = mockBudgets.filter(
        (b) => b.budget_type === "seserahan" || b.budget_type === "sangjit"
      );
      const weddingBudgets = mockBudgets.filter((b) => b.budget_type === "wedding");

      expect(seserahanBudgets).toHaveLength(2);
      expect(weddingBudgets).toHaveLength(1);
      expect(seserahanBudgets.map((b) => b.id)).toEqual(["b1", "b2"]);
    });
  });
});
