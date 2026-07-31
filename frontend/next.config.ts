import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // BACKEND_URL is a runtime server-only env var (NOT NEXT_PUBLIC_)
    // On Render: set BACKEND_URL=https://astra-backend-l57n.onrender.com
    // Locally with docker-compose: set BACKEND_URL=http://backend:5000
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    console.log(`[next.config] Rewriting /api/* → ${backendUrl}/api/*`);
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

