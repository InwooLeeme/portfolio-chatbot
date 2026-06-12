import { InlineChat } from "@/components/demo/InlineChat";

// 데모/랜딩 페이지. 본문에 박힌 인라인 챗을 펼쳐 직접 써볼 수 있다.
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <InlineChat />
    </main>
  );
}
