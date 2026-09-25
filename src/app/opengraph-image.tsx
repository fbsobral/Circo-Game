import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Circo Game"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0d0d1a 0%, #111120 60%, #0a0a18 100%)",
          position: "relative",
        }}
      >
        {/* Gold top line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, transparent, #c9a84c, #f0c878, #c9a84c, transparent)" }} />

        {/* Emoji */}
        <div style={{ fontSize: 120, marginBottom: 24, lineHeight: 1 }}>🎪</div>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontSize: 96, fontWeight: 700, letterSpacing: "0.12em", color: "#c9a84c", textTransform: "uppercase" }}>
            CIRCO
          </span>
          <span style={{ fontSize: 48, fontWeight: 300, letterSpacing: "0.3em", color: "#7c5cbf", textTransform: "uppercase" }}>
            GAME
          </span>
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", marginTop: 16, letterSpacing: "0.15em" }}>
          gamificação para turmas de circo
        </div>

        {/* Gold bottom line */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, transparent, #c9a84c, #f0c878, #c9a84c, transparent)" }} />
      </div>
    ),
    { ...size }
  )
}
