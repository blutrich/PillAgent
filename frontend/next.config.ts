import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force cache busting for JavaScript files to ensure latest fixes are deployed
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // Add cache-control headers to prevent aggressive caching of JS files
  async headers() {
    return [
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/js/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
