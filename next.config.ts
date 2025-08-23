import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  redirects: async () => [
    // Redirect www to apex domain
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.runpool.space" }],
      destination: "https://runpool.space/:path*",
      permanent: true,
    },
  ],
};

export default nextConfig;
