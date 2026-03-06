import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/personal-site",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
