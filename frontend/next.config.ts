import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["app.nanacaw.my.id", "nanacaw.my.id", "*.nanacaw.my.id", "host.docker.internal"],
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://backend:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
