import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increase limit for mobile photos
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lqleqqnfnbxzuxqquqgj.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      }
    ],
  },
};

export default nextConfig;
