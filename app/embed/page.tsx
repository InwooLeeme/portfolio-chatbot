import type { Metadata } from "next";
import { ChatWidget } from "@/components/chat/ChatWidget";
import "./embed.css";

export const metadata: Metadata = {
  title: "포트폴리오 챗봇",
  // 임베드 페이지는 검색 노출 불필요
  robots: { index: false, follow: false },
};

// iframe으로 임베드되는 챗봇 본체. 같은 origin의 /api/chat을 호출한다.
export default function EmbedPage() {
  return <ChatWidget />;
}
