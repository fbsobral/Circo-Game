import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #1a1a33 0%, #0d0d1a 100%)",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 140 140">
          <rect x="68.5" y="6" width="3" height="28" fill="#c9a84c" />
          <polygon points="71.5,6 98,13 71.5,20" fill="#7c5cbf" />
          <polygon points="70,32 10,84 30,84" fill="#c9a84c" />
          <polygon points="70,32 30,84 50,84" fill="#7c5cbf" />
          <polygon points="70,32 50,84 70,84" fill="#c9a84c" />
          <polygon points="70,32 70,84 90,84" fill="#7c5cbf" />
          <polygon points="70,32 90,84 110,84" fill="#c9a84c" />
          <polygon points="70,32 110,84 130,84" fill="#7c5cbf" />
          <rect x="20" y="84" width="20" height="44" fill="#f0c878" />
          <rect x="40" y="84" width="20" height="44" fill="#c9a84c" />
          <rect x="60" y="84" width="20" height="44" fill="#f0c878" />
          <rect x="80" y="84" width="20" height="44" fill="#c9a84c" />
          <rect x="100" y="84" width="20" height="44" fill="#f0c878" />
          <path d="M58 128 L58 108 Q70 92 82 108 L82 128 Z" fill="#0d0d1a" />
          <rect x="12" y="128" width="116" height="5" rx="2" fill="#c9a84c" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
