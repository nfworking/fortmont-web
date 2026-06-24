import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    middlewareClientMaxBodySize: "20gb",
  },
allowedDevOrigins: [ 'api.fortmont.me'],
};

export default nextConfig;
