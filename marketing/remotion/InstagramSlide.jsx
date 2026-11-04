import { AbsoluteFill, Img, staticFile } from "remotion";
import { BRAND, SLIDES, THEME } from "./data.js";
import { IPhoneMockup } from "./components/IPhoneMockup.jsx";
import { WebBrowserMockup } from "./components/WebBrowserMockup.jsx";

/**
 * InstagramSlide — Komponen Remotion <Still> untuk menghasilkan
 * materi postingan Instagram di 3 rasio resmi:
 * - Portrait Feed Carousel (4:5 — 1080x1350)
 * - Story / Reels Cover (9:16 — 1080x1920)
 * - Square Grid (1:1 — 1080x1080)
 *
 * Mengikuti prinsip Kill-AI-Slop & Technical Writer:
 * - Satu latar kertas hangat yang tenang (#faf7f4) dengan garis bingkai tipis
 * - Hirarki tipografi dari ukuran & ruang (tanpa label berulang di atas judul)
 * - Bahasa Indonesia sehari-hari yang jelas dan mengelaborasi fungsi tiap fitur
 */
export const InstagramSlide = ({ slideIndex = 0, format = "portrait" }) => {
  const slide = SLIDES[slideIndex] || SLIDES[0];
  const isStory = format === "story";
  const isSquare = format === "square";
  const pad = isSquare ? 68 : 78;

  const headSize = isStory ? 60 : isSquare ? 44 : 50;
  const subSize = isStory ? 23.5 : isSquare ? 18 : 21;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.canvas,
        color: THEME.ink,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Garis Bingkai Editorial Presisi */}
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: `1px solid ${THEME.line}`,
          borderRadius: 24,
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* HEADER ATAS */}
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          top: isSquare ? 50 : 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: THEME.rose,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Img
              src={staticFile("logo-transparent.png")}
              style={{ width: 24, height: 24, objectFit: "contain" }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: THEME.ink,
              }}
            >
              {BRAND.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: THEME.inkFaint,
                fontWeight: 500,
                marginTop: 1,
              }}
            >
              {slide.section}
            </div>
          </div>
        </div>

        {/* Nomor Urut Slide */}
        <div
          style={{
            fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: THEME.inkMuted,
            background: "#fff",
            border: `1px solid ${THEME.line}`,
            padding: "7px 14px",
            borderRadius: 999,
          }}
        >
          {slideIndex + 1} / {SLIDES.length}
        </div>
      </div>

      {/* TIPOGRAFI UTAMA: JUDUL & ELABORASI FITUR */}
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          top: isStory ? 148 : isSquare ? 112 : 132,
          zIndex: 6,
        }}
      >
        <h1
          style={{
            fontSize: headSize,
            lineHeight: 1.09,
            letterSpacing: "-0.03em",
            fontWeight: 800,
            color: THEME.ink,
            margin: 0,
            maxWidth: 920,
          }}
        >
          {slide.headline}
        </h1>

        <p
          style={{
            fontSize: subSize,
            lineHeight: 1.55,
            color: THEME.inkMuted,
            fontWeight: 400,
            marginTop: isSquare ? 14 : 18,
            maxWidth: 900,
          }}
        >
          {slide.subcopy}
        </p>
      </div>

      {/* AREA PRESENTASI VISUAL: WEB VIEW (ZOOM) + IPHONE MOBILE VIEW (NOTCH) */}
      {slide.layout === "cta-demo" ? (
        <div
          style={{
            position: "absolute",
            left: pad,
            right: pad,
            top: isStory ? 530 : isSquare ? 372 : 445,
            bottom: 84,
            zIndex: 5,
          }}
        >
          {/* Kotak Akses Demo Langsung (Tanpa IP) */}
          <div
            style={{
              background: THEME.ink,
              color: "#faf7f4",
              borderRadius: 20,
              padding: isSquare ? "18px 24px" : "22px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 28,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#fda4af",
                  marginBottom: 5,
                }}
              >
                AKUN DEMO SIAP DICOBA (LAPTOP & HP)
              </div>
              <div
                style={{
                  fontSize: isSquare ? 17 : 20,
                  fontWeight: 700,
                }}
              >
                Komentar atau DM “DEMO” untuk link percobaan
              </div>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 12,
                  padding: "10px 18px",
                }}
              >
                <div style={{ fontSize: 10, letterSpacing: "0.14em", color: "#a8a29e", textTransform: "uppercase" }}>
                  USERNAME
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 19, fontWeight: 700, color: "#fff" }}>
                  {BRAND.demoUser}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 12,
                  padding: "10px 18px",
                }}
              >
                <div style={{ fontSize: 10, letterSpacing: "0.14em", color: "#a8a29e", textTransform: "uppercase" }}>
                  PASSWORD
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 19, fontWeight: 700, color: "#fff" }}>
                  {BRAND.demoPass}
                </div>
              </div>
            </div>
          </div>

          {/* Web View + Dual iPhone (Light & Dark) */}
          <div style={{ position: "relative", height: "100%" }}>
            <WebBrowserMockup
              shotName="d-dashboard"
              width={isSquare ? 680 : 730}
              zoomScale={1.06}
              panX={0}
              panY={0}
              showLaptopBase
              style={{
                position: "absolute",
                left: 0,
                top: 10,
              }}
            />
            <IPhoneMockup
              shotName="m-dashboard"
              width={isSquare ? 225 : isStory ? 320 : 265}
              style={{
                position: "absolute",
                right: isStory ? 115 : 88,
                top: isStory ? 50 : 0,
                zIndex: 6,
              }}
            />
            <IPhoneMockup
              shotName="m-dashboard-dark"
              width={isSquare ? 205 : isStory ? 290 : 240}
              style={{
                position: "absolute",
                right: -6,
                top: isStory ? 130 : 48,
                zIndex: 5,
              }}
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: pad,
            right: pad,
            top: isStory ? 530 : isSquare ? 372 : 445,
            bottom: 84,
            zIndex: 5,
          }}
        >
          {/* Tampilan Web Desktop dengan Zoom-In pada Fitur */}
          <WebBrowserMockup
            shotName={slide.webShot}
            width={isStory ? 770 : isSquare ? 690 : 745}
            zoomScale={slide.webZoom?.scale || 1.18}
            panX={slide.webZoom?.x || 0}
            panY={slide.webZoom?.y || 0}
            showLaptopBase={!isSquare}
            style={{
              position: "absolute",
              left: 0,
              top: isStory ? 36 : 22,
            }}
          />

          {/* Tampilan Mobile iPhone Khas dengan Notch */}
          <IPhoneMockup
            shotName={slide.mobileShot}
            width={isStory ? 370 : isSquare ? 260 : 312}
            style={{
              position: "absolute",
              right: 0,
              top: isStory ? 140 : isSquare ? -6 : -4,
              zIndex: 7,
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
