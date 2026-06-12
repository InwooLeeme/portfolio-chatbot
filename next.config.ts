import type { NextConfig } from "next";

// /embed를 임베드할 수 있는 부모 origin. 'self'(데모) + ALLOWED_ORIGINS만 허용.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const frameAncestors = ["'self'", ...allowedOrigins].join(" ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 허용 origin 외 사이트의 /embed iframe 임베드 차단
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors};`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
