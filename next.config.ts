import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use empty turbopack config to silence the warning
  // Solana libraries work fine with Turbopack defaults
  turbopack: {},
};

export default nextConfig;
