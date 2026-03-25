import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const basePath = isGitHubPages ? "/lifespan-app" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: isGitHubPages ? "/lifespan-app/" : "",
  devIndicators: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
