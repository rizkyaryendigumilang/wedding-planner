import { Img, staticFile } from "remotion";

/**
 * High-Craft iPhone Pro Mockup dengan Notch / Dynamic Island khas iPhone,
 * bezel titanium, tombol samping fisik, status bar iOS, dan home indicator.
 */
export const IPhoneMockup = ({
  shotName = "m-dashboard",
  width = 360,
  scrollY = 0,
  screenScale = 1,
  style = {},
  darkNotchBar = false,
}) => {
  const height = Math.round(width * (844 / 390));
  const bezel = Math.max(9, Math.round(width * 0.03));
  const outerRadius = Math.round(width * 0.145);
  const innerRadius = Math.max(24, outerRadius - bezel + 2);
  const notchWidth = Math.round(width * 0.31);
  const notchHeight = Math.max(22, Math.round(width * 0.072));
  const lensSize = Math.max(9, Math.round(notchHeight * 0.42));

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: outerRadius,
        padding: bezel,
        background: "#171413",
        boxShadow:
          "0 38px 78px -26px rgba(20, 17, 24, 0.52), 0 16px 32px -16px rgba(20, 17, 24, 0.34), inset 0 0 0 1.5px rgba(255, 255, 255, 0.18), inset 0 0 0 3px rgba(0, 0, 0, 0.65)",
        userSelect: "none",
        ...style,
      }}
    >
      {/* Tombol Samping Kiri: Action Button + Volume Up + Volume Down */}
      <div
        style={{
          position: "absolute",
          left: -3,
          top: Math.round(height * 0.16),
          width: 3,
          height: Math.round(height * 0.038),
          borderRadius: "3px 0 0 3px",
          background: "#3d3835",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -3,
          top: Math.round(height * 0.23),
          width: 3,
          height: Math.round(height * 0.07),
          borderRadius: "3px 0 0 3px",
          background: "#3d3835",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -3,
          top: Math.round(height * 0.315),
          width: 3,
          height: Math.round(height * 0.07),
          borderRadius: "3px 0 0 3px",
          background: "#3d3835",
        }}
      />

      {/* Tombol Samping Kanan: Power / Side Button */}
      <div
        style={{
          position: "absolute",
          right: -3,
          top: Math.round(height * 0.25),
          width: 3,
          height: Math.round(height * 0.105),
          borderRadius: "0 3px 3px 0",
          background: "#3d3835",
        }}
      />

      {/* Celah Speaker Earpiece tipis di bezel atas */}
      <div
        style={{
          position: "absolute",
          top: Math.max(3, Math.round(bezel * 0.35)),
          left: "50%",
          transform: "translateX(-50%)",
          width: Math.round(width * 0.13),
          height: 3,
          borderRadius: 99,
          background: "rgba(0,0,0,0.75)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          zIndex: 6,
        }}
      />

      {/* Layar Dalam iPhone */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: innerRadius,
          overflow: "hidden",
          background: shotName.includes("dark") ? "#141118" : "#faf7f4",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
        }}
      >
        {/* Gambar Tangkapan Layar Mobile Live (dimulai tepat di bawah Safe Area Notch iOS) */}
        <div
          style={{
            position: "absolute",
            top: notchHeight + 12,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `translateY(${scrollY}px) scale(${screenScale})`,
              transformOrigin: "top center",
            }}
          >
            <Img
              src={staticFile(`marketing/shots/${shotName}.png`)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* Status Bar iOS + iPhone Notch / Dynamic Island */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: notchHeight + 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `6px ${Math.round(width * 0.07)}px 0`,
            zIndex: 5,
            pointerEvents: "none",
            color:
              shotName.includes("dark") || darkNotchBar ? "#f5f5f4" : "#1c1917",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: Math.max(10, Math.round(width * 0.032)),
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          <span>09:41</span>

          {/* Notch / Dynamic Island Khas iPhone dengan Lensa Kamera */}
          <div
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              width: notchWidth,
              height: notchHeight,
              borderRadius: 999,
              background: "#060507",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: Math.round(notchHeight * 0.32),
              gap: 6,
            }}
          >
            {/* Sensor FaceID Infrared */}
            <div
              style={{
                width: Math.max(5, Math.round(lensSize * 0.55)),
                height: Math.max(5, Math.round(lensSize * 0.55)),
                borderRadius: "50%",
                background: "#18151f",
                opacity: 0.85,
              }}
            />
            {/* Lensa Kamera Depan dengan Refleksi Optik */}
            <div
              style={{
                position: "relative",
                width: lensSize,
                height: lensSize,
                borderRadius: "50%",
                background: "#121a2d",
                boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.14)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "24%",
                  left: "26%",
                  width: "28%",
                  height: "28%",
                  borderRadius: "50%",
                  background: "rgba(147, 197, 253, 0.65)",
                }}
              />
            </div>
          </div>

          {/* Indikator Sinyal & Baterai iOS */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 9 }}>
              <span style={{ width: 2.2, height: 4, borderRadius: 1, background: "currentColor" }} />
              <span style={{ width: 2.2, height: 6, borderRadius: 1, background: "currentColor" }} />
              <span style={{ width: 2.2, height: 7.5, borderRadius: 1, background: "currentColor" }} />
              <span style={{ width: 2.2, height: 9, borderRadius: 1, background: "currentColor" }} />
            </div>
            <div
              style={{
                width: 17,
                height: 9,
                borderRadius: 3,
                border: "1.2px solid currentColor",
                padding: 1.2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 1,
                  background: "currentColor",
                }}
              />
            </div>
          </div>
        </div>

        {/* Home Indicator Bar iOS di Bawah */}
        <div
          style={{
            position: "absolute",
            bottom: 7,
            left: "50%",
            transform: "translateX(-50%)",
            width: Math.round(width * 0.34),
            height: 4.5,
            borderRadius: 99,
            background: shotName.includes("dark")
              ? "rgba(255,255,255,0.55)"
              : "rgba(28,25,23,0.42)",
            zIndex: 5,
          }}
        />
      </div>
    </div>
  );
};
