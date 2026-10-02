import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Object form on purpose: `new URL(...)` would pin `search` to "" and
    // reject the sizing query string on Unsplash URLs.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
