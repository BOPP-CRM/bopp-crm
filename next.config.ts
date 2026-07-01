import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_BACKEND_PATH;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      ...(apiUrl
        ? [
            {
              source: "/api/:path*",
              destination: `${apiUrl}/api/:path*`,
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
