import { describe, it, expect } from "vitest";
import {
  normalizePbUrl,
  isVpsHostname,
  isVpsPublicProxy,
  rewritePbUrl,
} from "../src/lib/pocketbase";

describe("pocketbase.js unit tests", () => {
  describe("normalizePbUrl", () => {
    it("normalizes standard HTTP and HTTPS origins", () => {
      expect(normalizePbUrl("http://127.0.0.1:8090/")).toBe("http://127.0.0.1:8090");
      expect(normalizePbUrl("https://43.156.236.102/wedding/api")).toBe("https://43.156.236.102");
      expect(normalizePbUrl("  http://localhost:8090  ")).toBe("http://localhost:8090");
    });

    it("rejects malicious or invalid URL schemes", () => {
      expect(normalizePbUrl("javascript:alert(1)")).toBe("");
      expect(normalizePbUrl("file:///etc/passwd")).toBe("");
      expect(normalizePbUrl("data:text/html,...")).toBe("");
      expect(normalizePbUrl("not-a-url")).toBe("");
      expect(normalizePbUrl("")).toBe("");
      expect(normalizePbUrl(null)).toBe("");
    });
  });

  describe("isVpsHostname", () => {
    it("identifies direct VPS IP and configured wildcard domains", () => {
      expect(isVpsHostname("43.156.236.102")).toBe(true);
      expect(isVpsHostname("43.156.236.102.sslip.io")).toBe(true);
      expect(isVpsHostname("43.156.236.102.nip.io")).toBe(true);
      expect(isVpsHostname("sub.43.156.236.102.sslip.io")).toBe(true);
    });

    it("returns false for localhost, LAN, or external domains", () => {
      expect(isVpsHostname("localhost")).toBe(false);
      expect(isVpsHostname("127.0.0.1")).toBe(false);
      expect(isVpsHostname("192.168.1.100")).toBe(false);
      expect(isVpsHostname("example.com")).toBe(false);
      expect(isVpsHostname("")).toBe(false);
      expect(isVpsHostname(null)).toBe(false);
    });
  });

  describe("isVpsPublicProxy", () => {
    it("recognizes standard HTTPS traffic on VPS host as proxy targets", () => {
      expect(isVpsPublicProxy("https://43.156.236.102/api/collections")).toBe(true);
      expect(isVpsPublicProxy("https://43.156.236.102:443/api/collections")).toBe(true);
    });

    it("ignores non-standard ports or non-VPS destinations", () => {
      expect(isVpsPublicProxy("http://43.156.236.102:8090/api/collections")).toBe(false);
      expect(isVpsPublicProxy("http://127.0.0.1:8090/api/collections")).toBe(false);
      expect(isVpsPublicProxy("https://api.telegram.org/bot123")).toBe(false);
    });
  });

  describe("rewritePbUrl", () => {
    it("rewrites /api/ to /wedding-api/ for VPS public traffic", () => {
      const original = "https://43.156.236.102/api/collections/budgets/records";
      const rewritten = rewritePbUrl(original);
      expect(rewritten).toBe("https://43.156.236.102/wedding-api/collections/budgets/records");
    });

    it("prevents duplicate prefix concatenation", () => {
      const duplicate1 = "https://43.156.236.102/wedding-api/api/collections";
      expect(rewritePbUrl(duplicate1)).toBe("https://43.156.236.102/wedding-api/collections");

      const duplicate2 = "https://43.156.236.102/wedding-api/wedding-api/collections";
      expect(rewritePbUrl(duplicate2)).toBe("https://43.156.236.102/wedding-api/collections");
    });

    it("leaves local development and non-VPS URLs untouched", () => {
      const local = "http://127.0.0.1:8090/api/collections/couples";
      expect(rewritePbUrl(local)).toBe(local);
    });
  });
});
