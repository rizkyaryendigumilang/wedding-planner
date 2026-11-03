/// <summary>
/// 2027-01-13 — Konfigurasi Otomatis OAuth2 Provider (Google & GitHub)
///
/// Mengaktifkan autentikasi OAuth2 untuk koleksi `users` di PocketBase
/// dengan membaca kredensial dari environment variable sistem
/// (PB_GOOGLE_CLIENT_ID, PB_GOOGLE_CLIENT_SECRET, PB_GITHUB_CLIENT_ID, PB_GITHUB_CLIENT_SECRET)
/// atau file lokal aman `pb_data/oauth_credentials.json` (yang di-ignore oleh Git).
/// Menjaga repository publik tetap aman dari secret scanning push protection.
/// </summary>
/* global $os */
migrate(
  (app) => {
    let googleClientId = "";
    let googleClientSecret = "";
    let githubClientId = "";
    let githubClientSecret = "";

    // 1. Coba baca dari environment variable
    try {
      if (typeof $os !== "undefined" && $os.getenv) {
        googleClientId = $os.getenv("PB_GOOGLE_CLIENT_ID") || $os.getenv("GOOGLE_CLIENT_ID") || "";
        googleClientSecret = $os.getenv("PB_GOOGLE_CLIENT_SECRET") || $os.getenv("GOOGLE_CLIENT_SECRET") || "";
        githubClientId = $os.getenv("PB_GITHUB_CLIENT_ID") || $os.getenv("GITHUB_CLIENT_ID") || "";
        githubClientSecret = $os.getenv("PB_GITHUB_CLIENT_SECRET") || $os.getenv("GITHUB_CLIENT_SECRET") || "";
      }
    } catch (_) {}

    // 2. Coba baca dari file lokal terlindungi (pb_data/oauth_credentials.json)
    if (!googleClientId || !githubClientId) {
      try {
        if (typeof $os !== "undefined" && $os.readFile) {
          const candidates = [
            "/home/ubuntu/platform-repos/wedding-planner/pb_data/oauth_credentials.json",
            "pb_data/oauth_credentials.json",
            "./pb_data/oauth_credentials.json",
            "../pb_data/oauth_credentials.json",
          ];
          for (let i = 0; i < candidates.length; i++) {
            try {
              const content = $os.readFile(candidates[i]);
              if (content) {
                const text = typeof content === "string" ? content : String.fromCharCode.apply(null, content);
                const data = JSON.parse(text);
                googleClientId = googleClientId || data.googleClientId || "";
                googleClientSecret = googleClientSecret || data.googleClientSecret || "";
                githubClientId = githubClientId || data.githubClientId || "";
                githubClientSecret = githubClientSecret || data.githubClientSecret || "";
                if (googleClientId && githubClientId) break;
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    // Jika kredensial belum tersedia di env/file lokal, lewati migrasi dengan aman
    if (!googleClientId && !githubClientId) {
      console.log(
        "[OAuth] Kredensial belum disetel di env (PB_GOOGLE_CLIENT_ID) atau pb_data/oauth_credentials.json. Migrasi dilewati."
      );
      return;
    }

    // 3. Konfigurasi pada Auth Collection `users` (PocketBase modern v0.23+)
    try {
      const users = app.findCollectionByNameOrId("users");
      if (users) {
        if (!users.oauth2) {
          users.oauth2 = {};
        }

        const existingProviders = Array.isArray(users.oauth2.providers)
          ? Array.from(users.oauth2.providers)
          : [];

        // Hapus entri lama untuk google & github bila sudah ada sebelumnya
        const providers = existingProviders.filter(
          (p) => p && p.name !== "google" && p.name !== "github"
        );

        if (googleClientId && googleClientSecret) {
          providers.push({
            name: "google",
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authUrl: "",
            tokenUrl: "",
            userApiUrl: "",
            displayName: "Google",
            pkce: null,
          });
        }

        if (githubClientId && githubClientSecret) {
          providers.push({
            name: "github",
            clientId: githubClientId,
            clientSecret: githubClientSecret,
            authUrl: "",
            tokenUrl: "",
            userApiUrl: "",
            displayName: "GitHub",
            pkce: null,
          });
        }

        users.oauth2.enabled = true;
        users.oauth2.providers = providers;

        app.save(users);
        console.log("[OAuth] Konfigurasi OAuth Google & GitHub berhasil disimpan ke koleksi users.");
      }
    } catch (err) {
      console.warn("Gagal menerapkan oauth2 pada users collection:", err);
    }

    // 4. Fallback untuk versi PocketBase legacy (v0.22 kebawah / global settings)
    try {
      if (typeof app.settings === "function") {
        const s = app.settings();
        if (s) {
          if (s.googleAuth && googleClientId && googleClientSecret) {
            s.googleAuth.enabled = true;
            s.googleAuth.clientId = googleClientId;
            s.googleAuth.clientSecret = googleClientSecret;
          }
          if (s.githubAuth && githubClientId && githubClientSecret) {
            s.githubAuth.enabled = true;
            s.githubAuth.clientId = githubClientId;
            s.githubAuth.clientSecret = githubClientSecret;
          }
          if (typeof app.saveSettings === "function") {
            app.saveSettings(s);
          } else if (typeof app.save === "function") {
            try {
              app.save(s);
            } catch (_) {}
          }
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId("users");
      if (users && users.oauth2 && Array.isArray(users.oauth2.providers)) {
        users.oauth2.providers = users.oauth2.providers.filter(
          (p) => p && p.name !== "google" && p.name !== "github"
        );
        app.save(users);
      }
    } catch (_) {}
  }
);
