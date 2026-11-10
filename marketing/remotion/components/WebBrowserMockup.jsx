import { Img, OffthreadVideo, staticFile } from "remotion";

/**
 * WebBrowserMockup — Menampilkan tampilan Web Desktop (1440x900)
 * lengkap dengan top bar browser modern yang menutup/mengganti URL bar
 * (sehingga IP server tertutup 100%), serta mendukung pemutaran video
 * rekaman live browser (<OffthreadVideo>) maupun gambar statis (<Img>),
 * dengan efek kamera Zoom-In & Zoom-Out + Pan yang mulus.
 */
export const WebBrowserMockup = ({
  shotName = "d-dashboard",
  videoFile = null,
  width = 928,
  zoomScale = 1,
  panX = 0,
  panY = 0,
  urlText = "Wedding Planner — Akun Demo: demo / demo123",
  showLaptopBase = false,
  style = {},
}) => {
  const screenHeight = Math.round(width * (900 / 1440));
  const barHeight = Math.max(32, Math.round(width * 0.038));

  // Jaga agar panX & panY tidak pernah melewati tepi luar halaman 1440x900 saat zoom
  const maxSafeX = zoomScale > 1 ? (width * (zoomScale - 1)) / (2 * zoomScale) : 0;
  const maxSafeY = zoomScale > 1 ? (screenHeight * (zoomScale - 1)) / (2 * zoomScale) : 0;
  const safePanX = Math.max(-maxSafeX, Math.min(maxSafeX, panX));
  const safePanY = Math.max(-maxSafeY, Math.min(maxSafeY, panY));

  return (
    <div
      style={{
        position: "relative",
        width,
        userSelect: "none",
        ...style,
      }}
    >
      {/* Bingkai Jendela Browser / Lid Laptop */}
      <div
        style={{
          width: "100%",
          borderRadius: showLaptopBase ? "20px 20px 6px 6px" : 20,
          background: "#18151c",
          padding: 10,
          boxShadow:
            "0 36px 72px -28px rgba(20, 17, 24, 0.48), 0 12px 26px -14px rgba(20, 17, 24, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.14)",
        }}
      >
        {/* Top Browser Chrome Bar (Menutup URL / IP Server) */}
        <div
          style={{
            height: barHeight,
            background: "#221e27",
            borderRadius: "12px 12px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Traffic Lights */}
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ff5f57",
              }}
            />
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#febc2e",
              }}
            />
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#28c840",
              }}
            />
          </div>

          {/* Address Bar Bersih (Tanpa IP) */}
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "4px 18px",
              color: "#e7e5e4",
              fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
              fontSize: Math.max(11, Math.round(width * 0.0135)),
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>🔒</span>
            <span>{urlText}</span>
          </div>

          <div style={{ width: 42 }} />
        </div>

        {/* Area Viewport Web dengan Efek Kamera Zoom-In / Zoom-Out + Pan */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: screenHeight,
            borderRadius: "0 0 11px 11px",
            overflow: "hidden",
            background: "#faf7f4",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `scale(${zoomScale}) translate(${safePanX}px, ${safePanY}px)`,
              transformOrigin: "center center",
              willChange: "transform",
            }}
          >
            {videoFile ? (
              <OffthreadVideo
                src={staticFile(`marketing/live-clips/${videoFile}`)}
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top left",
                  display: "block",
                }}
              />
            ) : (
              <Img
                src={staticFile(`marketing/shots/${shotName}.png`)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top left",
                  display: "block",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Base Bawah Laptop Opsional */}
      {showLaptopBase && (
        <div
          style={{
            height: 14,
            margin: "0 -16px",
            background: "#26212c",
            borderTop: "1px solid rgba(255,255,255,0.14)",
            borderRadius: "0 0 14px 14px",
            position: "relative",
            boxShadow: "0 18px 32px -14px rgba(20,17,24,0.48)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              transform: "translateX(-50%)",
              width: 92,
              height: 5,
              background: "rgba(255,255,255,0.16)",
              borderRadius: "0 0 6px 6px",
            }}
          />
        </div>
      )}
    </div>
  );
};
