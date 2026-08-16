import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
