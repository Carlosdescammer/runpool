import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: Removed custom www->apex redirect to avoid conflict with Vercel domain-level redirects

  // Fix development indicators configuration
  devIndicators: {
    position: 'bottom-right',
  },
};

export default nextConfig;
