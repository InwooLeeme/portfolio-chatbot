import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { config } from "./config";

// Upstash 환경변수가 없으면 비활성(항상 허용) — 개발 편의
let _limiter: Ratelimit | null = null;
let _initialized = false;

function getLimiter(): Ratelimit | null {
  if (_initialized) return _limiter;
  _initialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  _limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(
      config.rateLimit.requests,
      `${config.rateLimit.windowSeconds} s`,
    ),
    prefix: "portfolio-chatbot",
  });
  return _limiter;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const limiter = getLimiter();
  if (!limiter) {
    return { success: true, remaining: config.rateLimit.requests, reset: 0 };
  }
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset };
}

// /embed가 same-origin이라 프록시 헤더를 신뢰
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
