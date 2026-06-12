"use client";

/**
 * 블로그 레포에 추가하는 first-party 로더. 외부 <script> 없이 별도 origin의
 * /embed를 iframe으로 띄운다. 레이아웃에 <ChatbotLauncher host="..." /> 한 줄 추가.
 * next-themes 의존 — 안 쓰면 theme 동기화 부분만 제거하면 된다.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface Props {
  /** 챗봇 호스트 origin. 예: https://portfolio-chatbot.vercel.app */
  host: string;
}

export function ChatbotLauncher({ host }: Props) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { resolvedTheme } = useTheme();

  const origin = useMemo(() => {
    try {
      return new URL(host).origin;
    } catch {
      return host;
    }
  }, [host]);

  // iframe → 부모 메시지 수신 (origin 검증)
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin) return;
      const data = e.data;
      if (data?.type === "chatbot:ready") setReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [origin]);

  // 블로그 테마 변경 시 iframe에 실시간 반영
  useEffect(() => {
    if (!ready || !resolvedTheme) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "theme", value: resolvedTheme === "dark" ? "dark" : "light" },
      origin,
    );
  }, [resolvedTheme, ready, origin]);

  // iframe src는 최초 테마로 한 번만 고정 — 이후 블로그 테마 변경은 리로드 없이 postMessage로만 반영.
  // 첫 렌더에 resolvedTheme이 아직 없으면 auto(OS 설정)로 로드하고, ready 후 postMessage가 보정한다.
  const [src] = useState(() => {
    const t = resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "auto";
    return `${origin}/embed?theme=${t}`;
  });

  return (
    <>
      <div
        aria-hidden={!open}
        style={{
          position: "fixed",
          right: 20,
          bottom: 88,
          zIndex: 2147483000,
          width: "min(380px, calc(100vw - 40px))",
          height: "min(600px, calc(100vh - 140px))",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          background: "transparent",
          transformOrigin: "bottom right",
          transition: "opacity .22s ease, transform .22s ease",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(12px) scale(0.96)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <iframe
          ref={iframeRef}
          src={src}
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
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 2147483000,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: 0,
          cursor: "pointer",
          background: "#0d9488",
          color: "#fff",
          boxShadow: "0 8px 24px rgba(13,148,136,0.45)",
          display: "grid",
          placeItems: "center",
          transition: "transform .2s ease, background .2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>
    </>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
