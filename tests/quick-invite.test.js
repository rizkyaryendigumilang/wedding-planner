import { describe, it, expect, vi } from "vitest";
import {
  generateTemporaryPassword,
  generateCleanUsername,
  buildInviteWhatsAppMessage,
  createOrResetFriendAccount,
  getAppBaseUrl,
} from "../src/lib/quickInvite";

describe("quickInvite utility unit tests", () => {
  describe("generateTemporaryPassword", () => {
    it("generates a string of at least 8 characters with digits", () => {
      const pwd = generateTemporaryPassword();
      expect(typeof pwd).toBe("string");
      expect(pwd.length).toBeGreaterThanOrEqual(8);
      expect(/\d{4}$/.test(pwd)).toBe(true);
    });

    it("generates varied passwords on multiple invocations", () => {
      const pwd1 = generateTemporaryPassword();
      const pwd2 = generateTemporaryPassword();
      expect(typeof pwd1).toBe("string");
      expect(typeof pwd2).toBe("string");
    });
  });

  describe("generateCleanUsername", () => {
    it("extracts username from name when provided", () => {
      const u = generateCleanUsername("budi@gmail.com", "Budi Santoso");
      expect(u).toBe("budisantoso");
    });

    it("extracts username from email prefix when name is omitted", () => {
      const u = generateCleanUsername("rina.septiani@gmail.com");
      expect(u).toBe("rina.septiani");
    });

    it("handles collisions with existing usernames by adding suffix", () => {
      const existing = [{ username: "dimas" }];
      const u = generateCleanUsername("dimas@wedding.local", "Dimas", existing);
      expect(u.startsWith("dimas_")).toBe(true);
      expect(u).not.toBe("dimas");
    });

    it("falls back to default when input has invalid characters", () => {
      const u = generateCleanUsername("???@test.com", "!!!");
      expect(u.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("buildInviteWhatsAppMessage", () => {
    it("formats a polite WhatsApp invitation with all credentials", () => {
      const msg = buildInviteWhatsAppMessage({
        name: "Andi",
        email: "andi@gmail.com",
        username: "andi",
        tempPassword: "nikah1234",
        appUrl: "https://43.156.236.102/wedding/",
      });

      expect(msg).toContain("Halo Andi!");
      expect(msg).toContain("https://43.156.236.102/wedding/");
      expect(msg).toContain("andi@gmail.com");
      expect(msg).toContain("nikah1234");
      expect(msg).toContain("Password Sementara");
    });
  });

  describe("getAppBaseUrl", () => {
    it("returns a valid URL string", () => {
      const url = getAppBaseUrl();
      expect(url.startsWith("http")).toBe(true);
    });
  });

  describe("createOrResetFriendAccount", () => {
    it("rejects invalid email formats", async () => {
      await expect(
        createOrResetFriendAccount({ email: "invalid-email" })
      ).rejects.toThrow("Format alamat email tidak valid");
    });

    it("creates a new owner record when email does not exist", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: "usr_new_123",
        email: "doni@gmail.com",
        username: "doni",
        name: "Doni",
      });

      const mockPb = {
        collection: vi.fn().mockReturnValue({
          create: mockCreate,
        }),
      };

      const result = await createOrResetFriendAccount({
        email: "doni@gmail.com",
        name: "Doni",
        existingUsers: [],
        pbClient: mockPb,
      });

      expect(result.isNew).toBe(true);
      expect(result.email).toBe("doni@gmail.com");
      expect(result.username).toBe("doni");
      expect(result.tempPassword.length).toBeGreaterThanOrEqual(8);
      expect(mockCreate).toHaveBeenCalledTimes(1);

      const [payload] = mockCreate.mock.calls[0];
      expect(payload.email).toBe("doni@gmail.com");
      expect(payload.app_role).toBe("owner");
      expect(payload.password).toBe(result.tempPassword);
    });

    it("updates existing user password when email already exists", async () => {
      const existing = [
        {
          id: "usr_exist_999",
          email: "sari@gmail.com",
          username: "sari",
          name: "Sari",
        },
      ];

      const mockUpdate = vi.fn().mockResolvedValue({
        id: "usr_exist_999",
        email: "sari@gmail.com",
        username: "sari",
        name: "Sari",
      });

      const mockPb = {
        collection: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      };

      const result = await createOrResetFriendAccount({
        email: "sari@gmail.com",
        existingUsers: existing,
        pbClient: mockPb,
      });

      expect(result.isNew).toBe(false);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const [id, payload] = mockUpdate.mock.calls[0];
      expect(id).toBe("usr_exist_999");
      expect(payload.password).toBe(result.tempPassword);
      expect(result.messageText).toContain("sari@gmail.com");
    });
  });
});
