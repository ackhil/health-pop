export default function manifest() {
  return {
    name: "Health Pop",
    short_name: "Health Pop",
    description: "Your health, one log at a time",
    start_url: "/",
    display: "standalone",
    background_color: "#EFEAF4",
    theme_color: "#EFEAF4",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
