"use client";

// 본문에 박는 인라인 챗. 헤더를 누르면 채팅방이 펼쳐지고 다시 누르면 접힌다.
// 플로팅 버튼 대신 글 흐름 안에 들어가는 형태. iframe(/embed)으로 격리되며,
// 한 번 열면 계속 마운트해 둬서 접었다 펴도 대화가 유지된다.

import { useRef, useState } from "react";
import { MessageSquare, ChevronDown } from "lucide-react";

export function InlineChat() {
  const [open, setOpen] = useState(false);
  // 처음 펼친 뒤로는 계속 마운트 — 접어도 대화 내용이 날아가지 않게.
  const [mounted, setMounted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggle = () => {
    setOpen((v) => !v);
    setMounted(true);
  };

  return (
    <section className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="inline-chat-panel"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--muted-bg)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)]">
          <MessageSquare size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">포트폴리오 챗봇에게 직접 물어보기</span>
          <span className="block text-xs text-[var(--muted)]">
            {open ? "접으려면 다시 누르세요" : "눌러서 대화를 시작하세요"}
          </span>
        </span>
        <ChevronDown
          size={20}
          className="shrink-0 text-[var(--muted)] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <div
        id="inline-chat-panel"
        className="overflow-hidden border-t border-[var(--border)] transition-[height] duration-300 ease-in-out"
        style={{ height: open ? "min(600px, 80vh)" : 0 }}
      >
        {mounted && (
          <iframe
            ref={iframeRef}
            src="/embed?theme=auto"
            title="포트폴리오 챗봇"
            className="block h-full w-full border-0"
          />
        )}
      </div>
    </section>
  );
}
