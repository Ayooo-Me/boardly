import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: process.env.NODE_ENV !== "production" ? ["192.168.1.12", "localhost"] : [],
};

export default nextConfig;
