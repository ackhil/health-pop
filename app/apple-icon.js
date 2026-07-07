import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EFEAF4",
        }}
      >
        <svg width={153} height={153} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="30" fill="#B5EC9E" />
          <g>
            <circle cx="24" cy="27" r="2.6" fill="#141414" />
            <circle cx="40" cy="27" r="2.6" fill="#141414" />
          </g>
          <path d="M24 38 q8 9 16 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
