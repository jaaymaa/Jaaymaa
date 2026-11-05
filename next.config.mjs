import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { fileURLToPath } from "node:url";

if (process.env.NODE_ENV === "development" && process.env.CF_REMOTE_DEV === "true") {
  // Pin local Next.js development to Cloudflare bindings only if explicitly requested.
  const wranglerConfigPath = fileURLToPath(new URL("./wrangler.jsonc", import.meta.url));
  initOpenNextCloudflareForDev({
    configPath: wranglerConfigPath,
    persist: false,
    remoteBindings: true,
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 300,
    },
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
