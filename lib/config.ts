import fs from "node:fs";
import path from "node:path";

// 포트폴리오 데이터 타입 (data/portfolio.json 스키마)
export interface Portfolio {
  techStack: Array<{ category: string; items: string[] }>;
  awards: Array<{ date: string; title: string; detail?: string }>;
  competitions: Array<{ date: string; name: string; result?: string }>;
  contestWorks: Array<{ date: string; title: string; detail?: string }>;
  projects: Array<{
    name: string;
    subtitle?: string;
    highlights?: string[];
    tech?: string[];
    links?: Array<{ label: string; href: string; type?: string }>;
  }>;
  certifications: Array<{ date?: string; name: string; nameEn?: string; issuer?: string }>;
}

const emptyPortfolio: Portfolio = {
  techStack: [],
  awards: [],
  competitions: [],
  contestWorks: [],
  projects: [],
  certifications: [],
};

// 실데이터 로드: 환경변수(PORTFOLIO_JSON) → 로컬 파일(gitignore됨) → 빈 기본값.
// 정적 import를 쓰지 않아 파일이 없어도 빌드가 깨지지 않음.
function loadPortfolio(): Portfolio {
  if (process.env.PORTFOLIO_JSON) {
    try {
      return { ...emptyPortfolio, ...JSON.parse(process.env.PORTFOLIO_JSON) };
    } catch {
      // 잘못된 JSON이면 다음 소스로 폴백
    }
  }
  try {
    const p = path.join(process.cwd(), "data", "portfolio.json");
    if (fs.existsSync(p)) {
      return { ...emptyPortfolio, ...JSON.parse(fs.readFileSync(p, "utf8")) };
    }
  } catch {
    // 파일 읽기 실패 시 빈 기본값
  }
  return emptyPortfolio;
}

export const portfolio = loadPortfolio();

// 허용 origin 목록 (CORS allow-list 및 frame-ancestors). 끝 슬래시 제거.
export const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

// RAG / 생성 / 가드 관련 상수
export const config = {
  models: {
    generation: "gemini-2.0-flash",
    embedding: "text-embedding-004",
  },
  rag: {
    topK: 4, // 벡터 유사도 검색으로 가져올 관련 항목 수 (k=4)
    minScore: 0.55, // 코사인 유사도 하한 — top 결과가 이 미만이면 fallback 제안으로 유도
  },
  guard: {
    maxInputChars: 2000, // 사용자 메시지 1건 최대 길이
    maxMessages: 20, // 히스토리로 받을 최대 메시지 수
  },
  rateLimit: {
    requests: 30, // IP당 허용 요청 수
    windowSeconds: 3600, // 윈도우(초) — 시간당 30회
  },
} as const;
