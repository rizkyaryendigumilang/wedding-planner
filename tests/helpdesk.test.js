import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getHelpdeskHandoffUrl,
  openHelpdeskTicket,
  formatUserRole,
  uploadHelpdeskAttachment,
  sendHelpdeskReport,
  laporkanKendalaKeHelpdesk,
  dapatkanSesiPenggunaAktif,
  HELPDESK_BASE_URL,
  HELPDESK_APP_SLUG,
} from "../src/lib/helpdesk";
import pb from "../src/lib/pocketbase";

describe("Helpdesk SSO Handoff Module", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { href: "https://43.156.236.102/wedding/#/settings" },
      open: vi.fn(),
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("constructs proper handoff URL for authenticated owner user", () => {
    const user = {
      id: "usr_owner_12345",
      name: "Rizky Pratama",
      app_role: "owner",
    };

    const urlString = getHelpdeskHandoffUrl(user);
    const url = new URL(urlString);

    expect(urlString.startsWith(HELPDESK_BASE_URL)).toBe(true);
    expect(url.searchParams.get("app")).toBe(HELPDESK_APP_SLUG);
    expect(url.searchParams.get("app")).toBe("wedding");
    expect(url.searchParams.get("uid")).toBe("usr_owner_12345");
    expect(url.searchParams.get("name")).toBe("Rizky Pratama");
    expect(url.searchParams.get("role")).toBe("Owner / Pengantin");
    expect(url.searchParams.get("new")).toBe("1");
    expect(url.searchParams.get("from_url")).toBe("https://43.156.236.102/wedding/#/settings");
  });

  it("formats different user roles correctly", () => {
    expect(formatUserRole({ app_role: "panitia" })).toBe("Panitia Acara");
    expect(formatUserRole({ app_role: "wo" })).toBe("Wedding Organizer");
    expect(formatUserRole({ isSuperuser: true })).toBe("Super Admin");
    expect(formatUserRole({ role: "Staff" })).toBe("Staff");
    expect(formatUserRole(null)).toBe("Tamu / Pengguna");
  });

  it("uses fallback guest identity and custom from_url when user is null", () => {
    const customUrl = "https://43.156.236.102/wedding/#/reception";
    const urlString = getHelpdeskHandoffUrl(null, customUrl);
    const url = new URL(urlString);

    expect(url.searchParams.get("app")).toBe("wedding");
    expect(url.searchParams.get("uid")).toMatch(/^guest_/);
    expect(url.searchParams.get("name")).toBe("Pengguna Wedding Planner");
    expect(url.searchParams.get("role")).toBe("Tamu / Pengguna");
    expect(url.searchParams.get("from_url")).toBe(customUrl);
    expect(url.searchParams.get("new")).toBe("1");
  });

  it("opens window with target _blank and noopener,noreferrer", () => {
    const user = {
      id: "usr_test_99",
      name: "Tester",
      app_role: "panitia",
    };

    openHelpdeskTicket(user);

    expect(window.open).toHaveBeenCalledTimes(1);
    const [openedUrl, target, features] = window.open.mock.calls[0];

    expect(openedUrl).toContain("https://43.156.236.102/helpdesk/handoff");
    expect(openedUrl).toContain("app=wedding");
    expect(target).toBe("_blank");
    expect(features).toBe("noopener,noreferrer");
  });

  it("handles uploadHelpdeskAttachment correctly with PocketBase mock", async () => {
    expect(await uploadHelpdeskAttachment(null)).toBeNull();

    const mockRecord = {
      id: "rec_report_123",
      attachment: "photo_error.png",
    };

    const mockCreate = vi.fn().mockResolvedValue(mockRecord);
    vi.spyOn(pb, "collection").mockReturnValue({
      create: mockCreate,
    });
    vi.spyOn(pb.files, "getURL").mockReturnValue(
      "https://43.156.236.102/wedding-api/files/helpdesk_reports/rec_report_123/photo_error.png"
    );

    const fakeFile = new File(["dummy content"], "photo_error.png", { type: "image/png" });
    const resultUrl = await uploadHelpdeskAttachment(fakeFile, {
      name: "Budi",
      role: "Panitia Acara",
      complaint: "Tampilan blank saat simpan",
      fromUrl: "https://43.156.236.102/wedding/#/rundown",
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(resultUrl).toBe(
      "https://43.156.236.102/wedding-api/files/helpdesk_reports/rec_report_123/photo_error.png"
    );
  });

  it("sendHelpdeskReport dispatches report and opens handoff url with subject & description", async () => {
    const user = {
      id: "usr_panitia_55",
      name: "Siti Rahma",
      app_role: "panitia",
    };

    const result = await sendHelpdeskReport({
      user,
      complaint: "Tombol simpan vendor tidak merespon saat diklik",
      fromUrl: "https://43.156.236.102/wedding/#/vendors",
      autoSubmit: true,
    });

    expect(result.ok).toBe(true);
    expect(window.open).toHaveBeenCalledTimes(1);

    const [openedUrl] = window.open.mock.calls[0];
    const url = new URL(openedUrl);

    expect(url.searchParams.get("app")).toBe("wedding");
    expect(url.searchParams.get("uid")).toBe("usr_panitia_55");
    expect(url.searchParams.get("name")).toBe("Siti Rahma");
    expect(url.searchParams.get("role")).toBe("Panitia Acara");
    expect(url.searchParams.get("subject")).toContain("Tombol simpan vendor tidak merespon");
    expect(url.searchParams.get("description")).toContain("Tombol simpan vendor tidak merespon saat diklik");
    expect(url.searchParams.get("description")).toContain("https://43.156.236.102/wedding/#/vendors");
    expect(url.searchParams.get("auto_submit")).toBe("1");
    expect(url.searchParams.get("new")).toBe("1");
  });

  it("laporkanKendalaKeHelpdesk dispatches direct handoff with isUrgent priority and category", () => {
    pb.authStore.save("dummy-token", {
      id: "usr_active_888",
      username: "admin_acara",
      name: "Admin Utama",
      app_role: "admin",
    });

    const activeUser = dapatkanSesiPenggunaAktif();
    expect(activeUser?.id).toBe("usr_active_888");

    const targetUrl = laporkanKendalaKeHelpdesk({
      subject: "Layar blank saat cetak QR tamu",
      description: "Saat menekan cetak QR tamu meja VVIP, dialog cetak tidak muncul.",
      category: "bug_error",
      isUrgent: true,
    });

    expect(window.open).toHaveBeenCalledTimes(1);
    const [openedUrl, target, features] = window.open.mock.calls[0];

    expect(openedUrl).toBe(targetUrl);
    expect(target).toBe("_blank");
    expect(features).toBe("noopener,noreferrer");

    const url = new URL(openedUrl);
    expect(url.searchParams.get("app")).toBe("wedding");
    expect(url.searchParams.get("uid")).toBe("usr_active_888");
    expect(url.searchParams.get("name")).toBe("Admin Utama");
    expect(url.searchParams.get("role")).toBe("Super Admin");
    expect(url.searchParams.get("subject")).toBe("Layar blank saat cetak QR tamu");
    expect(url.searchParams.get("category")).toBe("bug_error");
    expect(url.searchParams.get("priority")).toBe("urgent");
    expect(url.searchParams.get("auto_submit")).toBe("1");
    expect(url.searchParams.get("new")).toBe("1");
    expect(url.searchParams.get("from_url")).toBe("https://43.156.236.102/wedding/#/settings");

    pb.authStore.clear();
  });
});
