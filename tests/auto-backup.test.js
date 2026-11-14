import { describe, it, expect, beforeEach } from "vitest";
import {
  saveAutoBackupSnapshot,
  getAutoBackupMeta,
  getAutoBackupSnapshot,
  formatBytes,
} from "../src/lib/autoBackup";

// Mock localStorage and window for Node environment
const storage = new Map();
const mockLocalStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};

globalThis.localStorage = mockLocalStorage;
if (typeof window === "undefined") {
  globalThis.window = globalThis;
}

describe("Auto-Sync Backup Engine", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("saves and retrieves auto-backup snapshot correctly", () => {
    const mockWeddingData = {
      couple: { id: "couple_123", cpp_nickname: "Rizky", cpw_nickname: "Sarah" },
      guests: [{ id: "g1", name: "Budi" }, { id: "g2", name: "Siti" }],
      budgets: [{ id: "b1", category: "Catering", actual: 5000000 }],
      vendors: [{ id: "v1", name: "Vendor Dekor" }],
      rundowns: [{ id: "r1", title: "Akad Nikah" }],
      gifts: [{ id: "gf1", amount: 100000 }],
    };

    const meta = saveAutoBackupSnapshot(mockWeddingData);
    expect(meta).toBeDefined();
    expect(meta.coupleId).toBe("couple_123");
    expect(meta.guestCount).toBe(2);
    expect(meta.budgetCount).toBe(1);
    expect(meta.vendorCount).toBe(1);

    const retrievedMeta = getAutoBackupMeta("couple_123");
    expect(retrievedMeta).toEqual(meta);

    const snapshot = getAutoBackupSnapshot("couple_123");
    expect(snapshot).toBeDefined();
    expect(snapshot.couple.cpp_nickname).toBe("Rizky");
    expect(snapshot.guests.length).toBe(2);
    expect(snapshot.version).toBe("2.0");
  });

  it("handles null or missing coupleId gracefully without throwing", () => {
    const res = saveAutoBackupSnapshot({});
    expect(res).toBeNull();
    expect(getAutoBackupMeta("unknown")).toBeNull();
    expect(getAutoBackupSnapshot("unknown")).toBeNull();
  });

  it("formats bytes accurately into human-readable strings", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(524288)).toBe("512 KB");
  });
});
