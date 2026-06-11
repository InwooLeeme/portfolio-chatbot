import type { NextConfig } from "next";

// /embed iframe을 임베드할 수 있는 부모 origin (CSP frame-ancestors).
// 'self'는 항상 허용(데모/랜딩 페이지). 그 외에는 내 블로그만 명시.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const frameAncestors = ["'self'", ...allowedOrigins].join(" ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // /embed는 허용된 origin(내 블로그)에서만 iframe으로 띄울 수 있게 제한.
        // 외부 사이트가 이 챗봇을 임베드하는 것을 막는다.
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
