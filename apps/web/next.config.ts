import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholder photography until real brand images exist.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
