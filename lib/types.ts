// 클라이언트 ↔ 서버 채팅 메시지
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// 답변 근거로 사용한 포트폴리오 항목 링크
export interface Source {
  title: string;
  link?: string;
  section: string;
}

// /api/chat NDJSON 스트림의 한 줄(이벤트) 스키마.
// 클라이언트는 줄 단위로 파싱해 토큰을 누적하고, sources/suggestions를 렌더한다.
export type ChatStreamEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "token"; value: string }
  | { type: "suggestions"; suggestions: string[] }
  | { type: "error"; message: string }
  | { type: "done" };
