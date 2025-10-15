import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: [
      "@reown/appkit",
      "@reown/appkit-adapter-wagmi",
      "@reown/appkit-wallet-button",
      "viem",
      "framer-motion",
      "@icons-pack/react-simple-icons",
      "@safe-global",
      "appkit-scaffold-ui",
      "appkit-ui",
      "appkit-wallet",
    ],
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(nextConfig);
