import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGitHubPages ? "/lifespan-app" : "",
  assetPrefix: isGitHubPages ? "/lifespan-app/" : "",
  devIndicators: false,
};

export default nextConfig;
