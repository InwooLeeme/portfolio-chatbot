import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { getEmbeddings } from "./gemini";
import { config, portfolio, type Portfolio } from "./config";
import type { Source } from "./types";

const DEFAULT_LINK = "https://inwooleeme.vercel.app";

// 한 포트폴리오 항목 → 임베딩/근거 표시에 쓸 문서 씨앗.
interface DocSeed {
  pageContent: string; // 임베딩용 자연어 문장
  title: string; // 근거 링크 라벨
  link?: string; // 없으면 DEFAULT_LINK
}

interface SectionDef {
  key: keyof Portfolio;
  suggestion: string; // 답을 못 찾았을 때 노출할 fallback 추천 질문
  toSeed: (item: never) => DocSeed;
}

// 항목별 타입을 추론하면서 SectionDef로 모으는 헬퍼.
function defineSection<K extends keyof Portfolio>(
  key: K,
  suggestion: string,
  toSeed: (item: Portfolio[K][number]) => DocSeed,
): SectionDef {
  return { key, suggestion, toSeed: toSeed as SectionDef["toSeed"] };
}

// 검색·추천을 한곳에서 관리하는 섹션 레지스트리.
// 새 포트폴리오 섹션을 추가하려면 Portfolio 타입에 필드를 더하고 여기에 한 항목만 추가하면 된다.
// 배열 순서 = fallback 추천 질문 우선순위.
const SECTIONS: SectionDef[] = [
  defineSection("projects", "어떤 프로젝트를 진행했는지 보여주세요", (p) => {
    const parts = [`프로젝트 · ${p.name}`];
    if (p.subtitle) parts.push(`(${p.subtitle})`);
    if (p.highlights?.length) parts.push(`주요 내용: ${p.highlights.join(" / ")}`);
    if (p.tech?.length) parts.push(`사용 기술: ${p.tech.join(", ")}`);
    return { pageContent: parts.join(" "), title: p.name, link: p.links?.[0]?.href };
  }),
  defineSection("awards", "수상 이력이 궁금해요", (a) => ({
    pageContent: `수상 이력 · ${a.title} (${a.date})${a.detail ? ` — ${a.detail}` : ""}`,
    title: a.title,
  })),
  defineSection("techStack", "어떤 기술 스택을 사용하나요?", (t) => ({
    pageContent: `기술 스택 · ${t.category}: ${t.items.join(", ")}`,
    title: `기술 스택 — ${t.category}`,
  })),
  defineSection("competitions", "참가한 대회 성적이 궁금해요", (c) => ({
    pageContent: `대회 참가 · ${c.name} (${c.date})${c.result ? ` 결과: ${c.result}` : ""}`,
    title: c.name,
  })),
  defineSection("certifications", "보유한 자격증을 알려주세요", (c) => {
    const en = c.nameEn ? ` (${c.nameEn})` : "";
    const date = c.date ? ` (${c.date})` : "";
    const issuer = c.issuer ? ` 발급: ${c.issuer}` : "";
    return { pageContent: `자격증 · ${c.name}${en}${date}${issuer}`, title: c.name };
  }),
  defineSection("contestWorks", "대회 출제·운영 경험이 있나요?", (w) => ({
    pageContent: `대회 출제·운영 · ${w.title} (${w.date})${w.detail ? ` — ${w.detail}` : ""}`,
    title: w.title,
  })),
];

function buildDocuments(): Document[] {
  return SECTIONS.flatMap(({ key, toSeed }) =>
    (portfolio[key] as unknown[]).map((item) => {
      const seed = toSeed(item as never);
      return new Document({
        pageContent: seed.pageContent,
        metadata: { section: key, title: seed.title, link: seed.link ?? DEFAULT_LINK },
      });
    }),
  );
}

// 동시 요청의 중복 임베딩을 막으려 Promise 자체를 1회만 캐시
let _storePromise: Promise<MemoryVectorStore> | null = null;
function getVectorStore(): Promise<MemoryVectorStore> {
  if (!_storePromise) {
    _storePromise = MemoryVectorStore.fromDocuments(buildDocuments(), getEmbeddings()).catch(
      (err) => {
        _storePromise = null; // 실패 시 다음 요청에서 재시도 가능하게
        throw err;
      },
    );
  }
  return _storePromise;
}

export interface RetrieveResult {
  documents: Document[];
  sources: Source[];
  topScore: number;
  grounded: boolean; // topScore가 임계값 미만이면 근거 부족
}

export async function retrieve(query: string): Promise<RetrieveResult> {
  const store = await getVectorStore();
  const scored = await store.similaritySearchWithScore(query, config.rag.topK);

  const topScore = scored.length ? scored[0][1] : 0;
  const grounded = topScore >= config.rag.minScore;

  // 임계값을 넘는 문서만 근거로 채택 (단, top이 grounded면 최소 1개는 유지).
  const kept = scored
    .filter(([, score], i) => i === 0 || score >= config.rag.minScore)
    .map(([doc]) => doc);

  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const doc of kept) {
    const m = doc.metadata as { section: string; title: string; link?: string };
    const key = `${m.title}|${m.link ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({ title: m.title, link: m.link, section: m.section });
  }

  return { documents: kept, sources, topScore, grounded };
}

// 데이터가 있는 섹션 기준으로 추천 질문 최대 3개 생성
export function fallbackSuggestions(): string[] {
  return SECTIONS.filter(({ key }) => (portfolio[key] as unknown[]).length > 0)
    .map((s) => s.suggestion)
    .slice(0, 3);
}
