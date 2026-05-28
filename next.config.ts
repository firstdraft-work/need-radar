import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bypass proxy for server-side fetch to Reddit / Product Hunt / GLM
  // These APIs are accessed directly, not through local proxy
  serverExternalPackages: [],
};

export default nextConfig;
