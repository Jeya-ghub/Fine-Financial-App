import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.173.186.208', '10.119.47.208'],
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
