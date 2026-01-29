import type { NextConfig } from "next";

const isElectronBuild = process.env.BUILD_TARGET === "electron";

const nextConfig: NextConfig = {
  assetPrefix: isElectronBuild ? "./" : undefined,
  images: {
    unoptimized: isElectronBuild,
  },
  output: isElectronBuild ? "export" : undefined,
  trailingSlash: isElectronBuild,
};

export default nextConfig;
