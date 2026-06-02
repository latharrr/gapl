import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["razorpay", "unpdf", "pdf-parse"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};

export default nextConfig;
