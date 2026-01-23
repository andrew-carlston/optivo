import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Use local temp directory to avoid iCloud sync issues
  distDir: '/tmp/optivo-next',
};

export default nextConfig;
