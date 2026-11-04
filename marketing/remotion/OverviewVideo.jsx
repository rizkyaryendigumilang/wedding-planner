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

const EASE_OUT_EXPO = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * Satu Adegan (Scene) dalam Video Overview Remotion:
 * - Efek Transisi Masuk & Keluar yang mulus
 * - Kamera Web View: Zoom-In -> Tahan Fokus -> Zoom-Out
 * - iPhone Mobile View dengan Notch khas & animasi scroll vertikal
 * - Mendukung `cleanText` untuk menghasilkan klip bersih yang teks judulnya
 *   dapat diedit manual secara langsung di aplikasi Concat Desktop
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
    : interpolate(frame, [dur - 12, dur], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_IN_OUT,
      });

  const sceneOpacity = cleanText ? 1 : Math.min(enterProgress, exitOpacity);

  const kf = scene.cameraKeyframes || [
    { frame: 0, scale: 1, x: 0, y: 0 },
    { frame: 55, scale: 1.26, x: -40, y: -22 },
    { frame: 105, scale: 1.02, x: 0, y: 0 },
  ];

  const webZoomScale = interpolate(
    frame,
    kf.map((k) => k.frame),
    kf.map((k) => k.scale),
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    }
  );

  const webPanX = interpolate(
    frame,
    kf.map((k) => k.frame),
    kf.map((k) => k.x),
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    }
  );

  const webPanY = interpolate(
    frame,
    kf.map((k) => k.frame),
    kf.map((k) => k.y),
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    }
  );

  const phoneSpring = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.9 },
  });

  const phoneTranslateY = interpolate(phoneSpring, [0, 1], [42, 0]);
  const phoneScale = interpolate(phoneSpring, [0, 1], [0.95, 1]);

  const [scrollStart, scrollEnd] = scene.mobileScroll || [0, -25];
  const mobileScrollY = interpolate(frame, [12, dur - 18], [scrollStart, scrollEnd], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT_EXPO,
  });

  const textY = interpolate(enterProgress, [0, 1], [20, 0]);

  const progressWithinScene = interpolate(frame, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity: sceneOpacity,
        paddingLeft: pad,
        paddingRight: pad,
      }}
    >
      {/* JUDUL & PENJELASAN FITUR (Dikosongkan bila cleanText=true agar bisa diedit di Concat) */}
      {!cleanText && (
        <div
          style={{
            position: "absolute",
            left: pad,
            right: pad,
            top: isReels ? 154 : 126,
            transform: `translateY(${textY}px)`,
            zIndex: 8,
          }}
        >
          <h1
            style={{
              fontSize: isReels ? 54 : 46,
              lineHeight: 1.09,
              letterSpacing: "-0.03em",
              fontWeight: 800,
              color: THEME.ink,
              margin: 0,
              maxWidth: 920,
            }}
          >
            {scene.title}
          </h1>

          <p
            style={{
              fontSize: isReels ? 22.5 : 19.5,
              lineHeight: 1.5,
              color: THEME.inkMuted,
              fontWeight: 400,
              marginTop: 16,
              maxWidth: 890,
            }}
          >
            {scene.subtitle}
          </p>
        </div>
      )}

      {/* PANGGUNG UTAMA: WEB VIEW (ZOOM IN / ZOOM OUT) + IPHONE DENGAN NOTCH */}
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          top: isReels ? 455 : 390,
          height: isReels ? 1165 : 765,
          zIndex: 6,
        }}
      >
        {/* Web Desktop Browser dengan Kamera Zoom-In & Zoom-Out */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: isReels ? 20 : 16,
            transform: `translateY(${interpolate(enterProgress, [0, 1], [24, 0])}px)`,
          }}
        >
          <WebBrowserMockup
            shotName={scene.webShot}
            width={isReels ? 820 : 740}
            zoomScale={webZoomScale}
            panX={webPanX}
            panY={webPanY}
            showLaptopBase
          />
        </div>

        {/* Mobile View: HP iPhone dengan Notch Khas */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: isReels ? 290 : 12,
            transform: `translateY(${phoneTranslateY}px) scale(${phoneScale})`,
            transformOrigin: "bottom right",
            zIndex: 9,
          }}
        >
          <IPhoneMockup
            shotName={scene.mobileShot}
            width={isReels ? 376 : 308}
            scrollY={mobileScrollY}
          />
        </div>

        {/* Kartu Rincian Fitur & Akun Demo di Kiri Bawah (Khusus 9:16 Reels) */}
        {isReels && (
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 32,
              width: 500,
              background: scene.isOutro ? THEME.ink : "#ffffff",
              color: scene.isOutro ? "#faf7f4" : THEME.ink,
              border: `1px solid ${scene.isOutro ? THEME.ink : THEME.line}`,
              borderRadius: 20,
              padding: "22px 26px",
              zIndex: 7,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: scene.isOutro ? "#fda4af" : THEME.rose,
                marginBottom: 12,
              }}
            >
              {scene.section}
            </div>

            {/* 3 Poin Elaborasi Fitur */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
              {(scene.highlights || []).map((point, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: 15.5,
                    lineHeight: 1.38,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      color: scene.isOutro ? "#fda4af" : THEME.rose,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 14,
                borderTop: `1px solid ${
                  scene.isOutro ? "rgba(255,255,255,0.16)" : THEME.line
                }`,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <span>Coba Akun Demo Gratis:</span>
              <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700 }}>
                {BRAND.demoUser} / {BRAND.demoPass}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PROGRESS BAR SEGMEN */}
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          bottom: isReels ? 68 : 52,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
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
          top: isReels ? 66 : 54,
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
              name={`${idx + 1}-${scene.id}`}
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
