import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/delisalgados/admin",
        permanent: false,
      },
      {
        source: "/admin/login",
        destination: "/delisalgados/admin/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

