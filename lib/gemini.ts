import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { config } from "./config";

function requireKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  return key;
}

// 블로그 임베드 시 악의적 입력에 대비한 모델 레벨 유해 콘텐츠 차단.
// 괴롭힘·혐오·성적·위험 콘텐츠를 중간 강도 이상부터 차단한다.
const safetySettings = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map((category) => ({
  category,
  threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}));

// 인덱싱·질의에서 동일 인스턴스 재사용
let _embeddings: GoogleGenerativeAIEmbeddings | null = null;
export function getEmbeddings(): GoogleGenerativeAIEmbeddings {
  if (!_embeddings) {
    _embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: requireKey(),
      model: config.models.embedding,
      maxRetries: 2, // 기본 6회 재시도는 과해서 실패 한 번이 사용량을 폭증시킨다
    });
  }
  return _embeddings;
}

export function getChatModel(): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({
    apiKey: requireKey(),
    model: config.models.generation,
    temperature: 0.3,
    streaming: true,
    maxRetries: 2, // 기본 6회 재시도 → 실패 시 사용량 폭증 방지
    safetySettings,
  });
}
