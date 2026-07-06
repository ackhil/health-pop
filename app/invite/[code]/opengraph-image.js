import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors components/design.js's Face component (same paths, same three moods/shapes
// used on the sign-in screen) so the share card matches the real brand, not a placeholder.
function MiniFace({ shape, fill, mood, size: s }) {
  const shapeEl = {
    circle: <circle cx="32" cy="32" r="30" fill={fill} />,
    square: <rect x="4" y="4" width="56" height="56" rx="16" fill={fill} />,
    blob: <path d="M32 3 C48 3 61 12 61 30 C61 50 50 61 32 61 C14 61 3 50 3 32 C3 14 16 3 32 3 Z" fill={fill} />,
  }[shape];
  const eyes = {
    happy: <g><circle cx="24" cy="27" r="2.6" fill="#141414" /><circle cx="40" cy="27" r="2.6" fill="#141414" /></g>,
    wink: <g><circle cx="24" cy="27" r="2.6" fill="#141414" /><path d="M36 27 h8" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" /></g>,
    calm: <g><path d="M20 28 q4 4 8 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round" /><path d="M36 28 q4 4 8 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round" /></g>,
  }[mood];
  const mouth = {
    happy: <path d="M24 38 q8 9 16 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    wink: <path d="M25 39 q7 7 14 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    calm: <path d="M26 40 q6 5 12 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
  }[mood];
  return (
    <svg width={s} height={s} viewBox="0 0 64 64">
      {shapeEl}{eyes}{mouth}
    </svg>
  );
}

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#EFEAF4",
      }}>
        <div style={{ display: "flex", gap: 28, marginBottom: 40 }}>
          <MiniFace shape="circle" fill="#B5EC9E" mood="happy" size={110} />
          <MiniFace shape="square" fill="#F5A45E" mood="wink" size={110} />
          <MiniFace shape="blob" fill="#C7B6F2" mood="calm" size={110} />
        </div>
        <div style={{ fontSize: 84, fontWeight: 900, color: "#141414", letterSpacing: "-2px", display: "flex" }}>Health Pop</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#6E6B78", marginTop: 18, display: "flex" }}>Your health, one log at a time 💛</div>
      </div>
    ),
    { ...size }
  );
}
