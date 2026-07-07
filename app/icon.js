import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
        <svg width={28} height={28} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="30" fill="#B5EC9E" />
          <g>
            <circle cx="24" cy="27" r="3.2" fill="#141414" />
            <circle cx="40" cy="27" r="3.2" fill="#141414" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
