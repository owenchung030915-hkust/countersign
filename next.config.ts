import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  serverExternalPackages: ["@paypal/agent-toolkit", "axios"],
};

export default nextConfig;
