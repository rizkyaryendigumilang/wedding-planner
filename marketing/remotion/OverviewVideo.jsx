import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, THEME, VIDEO_SCENES } from "./data.js";
import { IPhoneMockup } from "./components/IPhoneMockup.jsx";
import { WebBrowserMockup } from "./components/WebBrowserMockup.jsx";

const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * VideoScene — Menampilkan 1 dari 12 adegan rekaman live browser:
 * - Mode "web-full" (Menu 01 s/d 11): Layar penuh Web Desktop dengan rekaman live
 *   kursor mengklik tab menu, scroll halaman, dan efek kamera Zoom-In -> Pan -> Zoom-Out,
 *   dilengkapi kartu penjelasan 3 poin fungsi menu di bawahnya.
 * - Mode "mobile-showcase" (Adegan 12): Sesi khusus tampilan HP iPhone ber-Notch
 *   dengan rekaman live navigasi bawah & Mode Gelap/Terang.
 */
export const VideoScene = ({
  scene,
  sceneIndex,
  totalScenes,
  format = "reels",
  cleanText = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = scene.durationInFrames;
  const isReels = format === "reels";
  const pad = isReels ? 76 : 72;

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });

  const exitOpacity = cleanText
    ? 1
    : interpolate(frame, [dur - 10, dur], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_IN_OUT,
      });

  const sceneOpacity = cleanText ? 1 : Math.min(enterProgress, exitOpacity);

  const progressWithinScene = interpolate(frame, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Kurva Kamera Zoom-In -> Fokus Konten -> Zoom-Out yang Proporsional di SEMUA 12 Adegan:
  // - p1 -> p2: Zoom-In ke arah Sidebar Kiri (tepi kiri terkunci utuh sehingga nama menu terbaca 100%)
  // - p2 -> p3: Pan & Zoom Fokus ke Area Konten Utama 1176px di Kanan (tepi kanan terkunci utuh sehingga kartu & angka Rp 62.000.000 tampil penuh 100% tanpa terpotong)
  // - p3 -> p4: Zoom-Out kembali ke tampilan penuh proporsional (1.0x)
  const p0 = 0;
  const p1 = Math.round(dur * 0.10);
  const p2 = Math.round(dur * 0.34);
  const p3 = Math.round(dur * 0.70);
  const p4 = Math.round(dur * 0.92);
  const p5 = dur;

  const browserW = isReels ? 928 : 790;
  const browserH = Math.round(browserW * (900 / 1440));
  const zSidebar = 1.18;
  const zContent = 1.20;

  // Agar tepi kiri pas di 0 saat zSidebar, panX = +(browserW * (zSidebar - 1)) / (2 * zSidebar)
  const leftAlignedPanX = (browserW * (zSidebar - 1)) / (2 * zSidebar);
  // Agar area konten utama (kanan) pas penuh tanpa memotong kartu kanan saat zContent, panX = -(browserW * (zContent - 1)) / (2 * zContent)
  const rightAlignedPanX = -(browserW * (zContent - 1)) / (2 * zContent);

  const topAlignedPanY = (browserH * (zSidebar - 1)) / (2 * zSidebar) * 0.65;
  const contentPanY = (browserH * (zContent - 1)) / (2 * zContent) * 0.35;

  const webZoomScale = interpolate(
    frame,
    [p0, p1, p2, p3, p4, p5],
    [1.0, 1.0, zSidebar, zContent, 1.0, 1.0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    }
  );

  const webPanX = interpolate(
    frame,
    [p0, p1, p2, p3, p4, p5],
    [0, 0, leftAlignedPanX, rightAlignedPanX, 0, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    }
  );

  const webPanY = interpolate(
    frame,
    [p0, p1, p2, p3, p4, p5],
    [0, 0, topAlignedPanY, contentPanY, 0, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    }
  );

  // Zoom-In & Zoom-Out proporsional pada keseluruhan perangkat Web Browser
  const deviceFrameScale = interpolate(
    frame,
    [p0, p1, p2, p3, p4, p5],
    [1.0, 1.0, 1.035, 1.045, 1.0, 1.0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    }
  );

  const phoneSpring = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.9 },
  });

  const phoneTranslateY = interpolate(phoneSpring, [0, 1], [38, 0]);
  // Zoom-In & Zoom-Out proporsional pada seluruh unit iPhone Pro agar Notch & Navigasi Bawah utuh 100%
  const phoneZoomInOut = interpolate(
    frame,
    [p0, p1, p2, p3, p4, p5],
    [1.0, 1.0, 1.08, 1.12, 1.0, 1.0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    }
  );
  const phoneInnerScale = 1.0;
  const phoneScale = interpolate(phoneSpring, [0, 1], [0.95, 1]) * phoneZoomInOut;
  const textY = interpolate(enterProgress, [0, 1], [18, 0]);

  const isMobileShowcase = scene.mode === "mobile-showcase";

  return (
    <AbsoluteFill
      style={{
        opacity: sceneOpacity,
        paddingLeft: pad,
        paddingRight: pad,
      }}
    >
      {/* JUDUL & PENJELASAN MENU (Dikosongkan bila cleanText=true agar bisa diedit di Concat) */}
      {!cleanText && (
        <div
          style={{
            position: "absolute",
            left: pad,
            right: pad,
            top: isReels ? 148 : 118,
            transform: `translateY(${textY}px)`,
            zIndex: 8,
          }}
        >
          <h1
            style={{
              fontSize: isReels ? 50 : 42,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              fontWeight: 800,
              color: THEME.ink,
              margin: 0,
              maxWidth: 928,
            }}
          >
            {scene.title}
          </h1>

          <p
            style={{
              fontSize: isReels ? 21.5 : 18.5,
              lineHeight: 1.48,
              color: THEME.inkMuted,
              fontWeight: 400,
              marginTop: isReels ? 14 : 10,
              maxWidth: 910,
            }}
          >
            {scene.subtitle}
          </p>
        </div>
      )}

      {/* PANGGUNG UTAMA */}
      {isMobileShowcase ? (
        /* SESI KHUSUS TAMPILAN HP IPHONE BER-NOTCH (LIVE MOBILE RECORDING) */
        <div
          style={{
            position: "absolute",
            left: pad,
            right: pad,
            top: isReels ? 430 : 340,
            bottom: isReels ? 110 : 84,
            zIndex: 6,
          }}
        >
          {/* Kartu Penjelasan Mobile View & CTA Demo di Sisi Kiri */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: isReels ? 60 : 28,
              width: isReels ? 470 : 485,
              background: THEME.ink,
              color: "#faf7f4",
              borderRadius: 22,
              padding: isReels ? "28px 28px" : "24px 26px",
              zIndex: 7,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#fda4af",
                marginBottom: 12,
              }}
            >
              {scene.menuBadge}
            </div>

            <div
              style={{
                fontSize: isReels ? 26 : 22,
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: 18,
              }}
            >
              Semua 11 menu nyaman dibuka dari HP iPhone maupun Android.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
              {(scene.highlights || []).map((point, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: isReels ? 16.5 : 15,
                    lineHeight: 1.4,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: "#fda4af", fontWeight: 800 }}>✓</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: 14,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", color: "#fda4af" }}>
                  COBA AKUN DEMO SEKARANG
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                  Komentar / DM “DEMO”
                </div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 17, fontWeight: 800, color: "#fff" }}>
                {BRAND.demoUser} / {BRAND.demoPass}
              </div>
            </div>
          </div>

          {/* HP iPhone Pro Utama (Memutar Video Live Mobile View) */}
          <div
            style={{
              position: "absolute",
              right: isReels ? 24 : 36,
              top: isReels ? 0 : -10,
              transform: `translateY(${phoneTranslateY}px) scale(${phoneScale})`,
              transformOrigin: "center center",
              zIndex: 9,
            }}
          >
            <IPhoneMockup
              videoFile={scene.videoClip}
              shotName={scene.mobileShot}
              width={isReels ? 410 : 365}
              screenScale={phoneInnerScale}
            />
          </div>
        </div>
      ) : (
        /* SESI WEB DESKTOP + IPHONE MOBILE VIEW BERDAMPINGAN (KLIK SEMUA 11 TAB + ZOOM IN / ZOOM OUT) */
        <div
          style={{
            position: "absolute",
            left: pad,
            right: pad,
            top: isReels ? 410 : 326,
            bottom: isReels ? 105 : 76,
            zIndex: 6,
          }}
        >
          {/* Layar Web Desktop Browser */}
          <div
            style={{
              transform: `translateY(${interpolate(enterProgress, [0, 1], [20, 0])}px) scale(${deviceFrameScale})`,
              transformOrigin: "left top",
            }}
          >
            <WebBrowserMockup
              videoFile={scene.videoClip}
              shotName={scene.webShot}
              width={isReels ? 928 : 790}
              zoomScale={webZoomScale}
              panX={webPanX}
              panY={webPanY}
              showLaptopBase
            />
          </div>

          {/* Kartu Penjelasan Fitur Menu di Kiri Bawah */}
          <div
            style={{
              marginTop: isReels ? 34 : 20,
              width: isReels ? 610 : 680,
              background: "#ffffff",
              border: `1px solid ${THEME.line}`,
              borderRadius: 20,
              padding: isReels ? "24px 26px" : "16px 22px",
              display: "flex",
              flexDirection: "column",
              gap: isReels ? 14 : 9,
              position: "relative",
              zIndex: 7,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: isReels ? 12.5 : 11.5,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: THEME.rose,
                }}
              >
                {scene.menuBadge}
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: THEME.inkMuted,
                }}
              >
                Demo: {BRAND.demoUser} / {BRAND.demoPass}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: isReels ? 10 : 7,
              }}
            >
              {(scene.highlights || []).map((point, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: isReels ? 16.5 : 14,
                    lineHeight: 1.36,
                    fontWeight: 600,
                    color: THEME.ink,
                  }}
                >
                  <span style={{ color: THEME.rose, fontWeight: 800 }}>✓</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tampilan HP iPhone Pro ber-Notch (Live Mobile View untuk Setiap Menu) */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: isReels ? 470 : 95,
              transform: `translateY(${phoneTranslateY}px) scale(${phoneScale})`,
              transformOrigin: "bottom right",
              zIndex: 9,
            }}
          >
            <IPhoneMockup
              videoFile={(scene.videoClip || "").replace("web-", "mobile-")}
              shotName={scene.mobileShot}
              width={isReels ? 292 : 236}
              screenScale={phoneInnerScale}
            />
          </div>
        </div>
      )}

      {/* PROGRESS BAR 12 ADEGAN */}
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          bottom: isReels ? 62 : 46,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
          }}
        >
          {Array.from({ length: totalScenes }).map((_, i) => {
            const fill =
              i < sceneIndex ? 1 : i === sceneIndex ? progressWithinScene : 0;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 99,
                  background: "rgba(28, 25, 23, 0.12)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.round(fill * 100)}%`,
                    height: "100%",
                    background: THEME.rose,
                    borderRadius: 99,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const OverviewVideo = ({
  format = "reels",
  singleSceneIndex = null,
  cleanText = false,
}) => {
  const isReels = format === "reels";
  const pad = isReels ? 76 : 72;

  let currentStart = 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.canvas,
        color: THEME.ink,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Bingkai Tipis */}
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: `1px solid ${THEME.line}`,
          borderRadius: 24,
          pointerEvents: "none",
          zIndex: 20,
        }}
      />

      {/* Top Brand Header Konstan */}
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          top: isReels ? 62 : 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 15,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: THEME.rose,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Img
              src={staticFile("logo-transparent.png")}
              style={{ width: 25, height: 25, objectFit: "contain" }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: THEME.ink,
              }}
            >
              {BRAND.name}
            </div>
            <div style={{ fontSize: 12, color: THEME.inkFaint, fontWeight: 500 }}>
              {BRAND.couple} • {BRAND.venue}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: `1px solid ${THEME.line}`,
            borderRadius: 999,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: THEME.ink,
          }}
        >
          AKUN DEMO: {BRAND.demoUser} / {BRAND.demoPass}
        </div>
      </div>

      {/* Mode 1 Adegan Tunggal (untuk klip modular di Concat) atau Seluruh Adegan */}
      {singleSceneIndex !== null ? (
        <VideoScene
          scene={VIDEO_SCENES[singleSceneIndex] || VIDEO_SCENES[0]}
          sceneIndex={singleSceneIndex}
          totalScenes={VIDEO_SCENES.length}
          format={format}
          cleanText={cleanText}
        />
      ) : (
        VIDEO_SCENES.map((scene, idx) => {
          const from = currentStart;
          currentStart += scene.durationInFrames;
          return (
            <Sequence
              key={scene.id}
              from={from}
              durationInFrames={scene.durationInFrames}
              name={`${String(idx + 1).padStart(2, "0")}-${scene.id}`}
            >
              <VideoScene
                scene={scene}
                sceneIndex={idx}
                totalScenes={VIDEO_SCENES.length}
                format={format}
                cleanText={cleanText}
              />
            </Sequence>
          );
        })
      )}
    </AbsoluteFill>
  );
};
