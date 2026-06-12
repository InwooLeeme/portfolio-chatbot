"use client";

// 데모용 런처. ChatbotLauncher와 같지만 자체 토글로 블로그 테마 동기화를
// 시뮬레이션하고, same-origin이라 iframe src에 상대 경로(/embed)를 쓴다.

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";

export function DemoLauncher() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // iframe src는 최초 테마로 한 번만 고정 — 이후 변경은 리로드 없이 postMessage로만 반영
  const [iframeSrc] = useState(() => `/embed?theme=${theme}`);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "chatbot:ready") setReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // 데모 테마 토글 → iframe에 실시간 반영 (블로그 동기화 시뮬레이션)
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "theme", value: theme },
      window.location.origin,
    );
  }, [theme, ready]);

  return (
    <>
      <button
        type="button"
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        className="fixed left-5 bottom-5 z-[2147483000] rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm shadow-md"
      >
        데모 테마: {theme === "dark" ? "🌙 다크" : "☀️ 라이트"} (클릭해 전환)
      </button>

      <div
        aria-hidden={!open}
        className="fixed right-5 bottom-[88px] z-[2147483000] overflow-hidden rounded-2xl shadow-2xl transition-all duration-200"
        style={{
          width: "min(380px, calc(100vw - 40px))",
          height: "min(600px, calc(100vh - 140px))",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(12px) scale(0.96)",
          transformOrigin: "bottom right",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="포트폴리오 챗봇"
          loading="lazy"
          style={{ border: 0, width: "100%", height: "100%", display: "block" }}
        />
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "챗봇 닫기" : "챗봇 열기"}
        aria-expanded={open}
        className="fixed right-5 bottom-5 z-[2147483000] grid h-14 w-14 place-items-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
        style={{ background: "#0d9488", boxShadow: "0 8px 24px rgba(13,148,136,0.45)" }}
      >
        {open ? <X size={22} /> : <MessageSquare size={24} />}
      </button>
    </>
  );
}
