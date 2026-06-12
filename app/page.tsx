import { DemoLauncher } from "@/components/demo/DemoLauncher";

// 데모/랜딩 페이지. 우하단 플로팅 런처로 챗봇을 직접 띄워볼 수 있고,
// 블로그에 임베드하는 방법을 안내한다.
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--chip-bg)] px-3 py-1 text-xs font-medium text-[var(--chip-fg)] ring-1 ring-[var(--chip-border)]">
        RAG · LangChain.js · Gemini
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">포트폴리오 챗봇</h1>
      <p className="mt-3 text-[var(--muted)]">
        포트폴리오 정보를 벡터 검색으로 찾아 맥락적으로 답하는 RAG 챗봇이에요. 블로그에는
        iframe으로 임베드되어 호스트 CSS·JS와 완전히 격리됩니다. 우하단{" "}
        <span className="font-medium text-[var(--foreground)]">플로팅 버튼</span>을 눌러
        바로 사용해보세요.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">블로그에 임베드하기</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          블로그 레포에 <code className="rounded bg-[var(--muted-bg)] px-1.5 py-0.5">ChatbotLauncher</code>{" "}
          컴포넌트(이 레포의 <code className="rounded bg-[var(--muted-bg)] px-1.5 py-0.5">blog-embed/</code>)를
          추가하고 레이아웃에 한 줄 넣으면 됩니다.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-relaxed">
{`// app/layout.tsx (블로그)
import { ChatbotLauncher } from "@/components/ChatbotLauncher";

<ChatbotLauncher host="https://YOUR-CHATBOT-HOST" />`}
        </pre>
        <p className="mt-3 text-sm text-[var(--muted)]">
          또는 직접 iframe만 쓰려면:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-relaxed">
{`<iframe
  src="https://YOUR-CHATBOT-HOST/embed?theme=auto"
  title="포트폴리오 챗봇"
  loading="lazy"
  style="border:0"
/>`}
        </pre>
      </section>

      <DemoLauncher />
    </main>
  );
}
