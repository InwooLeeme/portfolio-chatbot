"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Send, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat, type UiMessage } from "@/lib/useChat";

type Theme = "light" | "dark";

const GREETING: UiMessage = {
  id: "greeting",
  role: "assistant",
  content: "안녕하세요! 포트폴리오 챗봇이에요. 무엇이 궁금하신가요?",
  suggestions: [
    "어떤 프로젝트를 진행했나요?",
    "수상 이력이 궁금해요",
    "어떤 기술 스택을 사용하나요?",
  ],
};

function prefersDark(): boolean {
  return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

// ?theme 파라미터(light|dark|auto)와 OS 설정으로 초기 테마 결정.
function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const param = new URLSearchParams(window.location.search).get("theme");
  if (param === "light" || param === "dark") return param;
  return prefersDark() ? "dark" : "light"; // auto 또는 미지정 → OS 설정
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ChatWidget() {
  const [theme, setTheme] = useState<Theme>("light");
  const { messages, isStreaming, send } = useChat([GREETING]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // 초기 테마 적용 + 부모(블로그) postMessage 연동
  useEffect(() => {
    const initial = resolveInitialTheme();
    setTheme(initial);
    applyTheme(initial);

    // 부모에게 준비 완료 알림 (로더가 패널을 표시/리사이즈할 수 있게)
    window.parent?.postMessage({ type: "chatbot:ready" }, "*");

    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "theme") {
        const v = data.value;
        if (v === "light" || v === "dark") {
          setTheme(v);
          applyTheme(v);
        } else if (v === "auto") {
          const resolved = prefersDark() ? "dark" : "light";
          setTheme(resolved);
          applyTheme(resolved);
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // 새 메시지/토큰마다 맨 아래로 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      // 블로그가 위젯의 테마 변경을 따라가고 싶다면 사용할 수 있는 신호(선택)
      window.parent?.postMessage({ type: "chatbot:theme", value: next }, "*");
      return next;
    });
  }, []);

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) return;
      setInput("");
      if (taRef.current) taRef.current.style.height = "auto";
      void send(value);
    },
    [send],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)]">
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">포트폴리오 챗봇</p>
          <p className="truncate text-xs text-[var(--muted)]">AI 어시스턴트</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="테마 전환"
          title="라이트/다크 전환"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <MessageItem key={m.id} message={m} onSuggestion={submit} isStreaming={isStreaming} />
        ))}
      </div>

      <div className="border-t border-[var(--border)] p-3">
        <div className="flex items-end gap-2 rounded-[calc(var(--radius)*0.7)] border border-[var(--border)] bg-[var(--input)] px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--ring)]">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="궁금한 점을 입력하세요…"
            className="max-h-[120px] flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-[var(--muted)]"
          />
          <Button
            size="icon"
            onClick={() => submit(input)}
            disabled={!input.trim() || isStreaming}
            aria-label="전송"
            className="shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-[var(--muted)]">
          포트폴리오 정보 기반으로 답변해요. 실제와 다를 수 있어요.
        </p>
      </div>
    </div>
  );
}

function MessageItem({
  message,
  onSuggestion,
  isStreaming,
}: {
  message: UiMessage;
  onSuggestion: (text: string) => void;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";
  const isEmptyBot = !isUser && message.content.length === 0;

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-[var(--bubble-user-bg)] text-[var(--bubble-user-fg)]"
            : "rounded-bl-md bg-[var(--bubble-bot-bg)] text-[var(--bubble-bot-fg)]",
        )}
      >
        {isEmptyBot ? <TypingDots /> : message.content}
      </div>

      {/* 근거 링크 */}
      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="mt-1.5 flex max-w-[85%] flex-wrap gap-1.5">
          {message.sources.map((s, i) => (
            <a
              key={`${s.title}-${i}`}
              href={s.link ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[var(--chip-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--chip-fg)] ring-1 ring-[var(--chip-border)] transition-opacity hover:opacity-80"
            >
              {s.title}
            </a>
          ))}
        </div>
      )}

      {/* fallback 추천 질문 칩 */}
      {!isUser && message.suggestions && message.suggestions.length > 0 && (
        <div className="mt-2 flex max-w-[90%] flex-wrap gap-2">
          {message.suggestions.map((q) => (
            <button
              key={q}
              type="button"
              disabled={isStreaming}
              onClick={() => onSuggestion(q)}
              className="rounded-full border border-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-0.5" aria-label="입력 중">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
