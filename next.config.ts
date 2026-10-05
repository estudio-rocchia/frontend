import type { NextConfig } from "next";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
