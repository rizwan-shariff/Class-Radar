import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    const backendTarget = process.env.INTERNAL_BACKEND_URL || 'http://backend:3000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendTarget}/api/v1/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendTarget}/socket.io/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
