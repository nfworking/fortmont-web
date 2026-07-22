import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: "20gb",
  },

  transpilePackages: ["@fortmont/fortmont-ui"],

allowedDevOrigins: ["api.fortmont.me"],

  async headers() {
    // Comma-separated allowlist, e.g. "http://localhost:8080,https://app.example.com"
    const origins =
      process.env.OAUTH_CORS_ORIGINS ||
      process.env.CORS_ALLOW_ORIGIN ||
      "http://localhost:8080";
    // Next.js static headers cannot vary per request; use first origin or * for multi.
    // For multiple origins, prefer handling CORS in the token route — here we set a
    // sensible default that covers the primary SPA origin.
    const primaryOrigin = origins.split(",")[0]?.trim() || "http://localhost:8080";

    return [
      {
        source: "/api/oauth/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: primaryOrigin,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
      {
        source: "/api/jwks",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
        ],
      },
      {
        source: "/.well-known/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
        ],
      },
    ];
  },
};

export default nextConfig;