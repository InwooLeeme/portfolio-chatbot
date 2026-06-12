"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, ChatStreamEvent, Source } from "./types";

export interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  suggestions?: string[];
}

// /api/chat의 NDJSON 스트림을 소비해 메시지 상태를 갱신하는 클라이언트 훅.
export function useChat(initial: UiMessage[]) {
  const [messages, setMessages] = useState<UiMessage[]>(initial);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const patch = useCallback((id: string, fn: (m: UiMessage) => UiMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      const userMsg: UiMessage = { id: crypto.randomUUID(), role: "user", content };
      const botId = crypto.randomUUID();
      const botMsg: UiMessage = { id: botId, role: "assistant", content: "" };

      // API에 보낼 히스토리(추천 칩 같은 메타는 제외, content만).
      // 첫 user 메시지 앞의 assistant(캔드 인사말)는 실제 대화가 아니므로 제외 —
      // 안 그러면 첫 질문인데도 서버가 history로 보고 불필요한 rephrase를 돌린다.
      const withUser = [...messagesRef.current, userMsg].filter(
        (m) => m.content.trim().length > 0,
      );
      const firstUserIdx = withUser.findIndex((m) => m.role === "user");
      const payload: ChatMessage[] = (
        firstUserIdx >= 0 ? withUser.slice(firstUserIdx) : withUser
      ).map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
        });

        if (res.status === 429) {
          patch(botId, (m) => ({
            ...m,
            content: "요청이 너무 많아요. 잠시 후 다시 시도해주세요.",
          }));
          return;
        }
        if (!res.ok || !res.body) {
          patch(botId, (m) => ({
            ...m,
            content: "답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요.",
          }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handle = (evt: ChatStreamEvent) => {
          switch (evt.type) {
            case "token":
              patch(botId, (m) => ({ ...m, content: m.content + evt.value }));
              break;
            case "sources":
              patch(botId, (m) => ({ ...m, sources: evt.sources }));
              break;
            case "suggestions":
              patch(botId, (m) => ({ ...m, suggestions: evt.suggestions }));
              break;
            case "error":
              patch(botId, (m) => ({ ...m, content: evt.message }));
              break;
          }
        };

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            try {
              handle(JSON.parse(line) as ChatStreamEvent);
            } catch {
              /* 불완전한 줄은 무시 */
            }
          }
        }
      } catch {
        patch(botId, (m) => ({
          ...m,
          content: m.content || "네트워크 오류가 발생했어요. 다시 시도해주세요.",
        }));
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, patch],
  );

  return { messages, isStreaming, send };
}
