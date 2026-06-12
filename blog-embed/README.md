# 블로그 임베드 로더 (first-party)

내 블로그 레포에 직접 넣어 쓰는 챗봇 로더예요.
외부 `<script>`를 주입하는 방식이 아니라, 챗봇 UI가 들어 있는 별도 origin의 `/embed`
페이지를 iframe으로 띄웁니다. iframe이 다른 origin이다 보니 블로그의 CSS나 JS와
서로 간섭할 일이 없습니다.

## 설치

먼저 `ChatbotLauncher.tsx`를 블로그 레포의 컴포넌트 폴더로 복사하세요.
(예: `components/ChatbotLauncher.tsx`) 그런 다음 최상위 레이아웃에 한 줄만 추가하면 됩니다.

```tsx
// app/layout.tsx (블로그)
import { ChatbotLauncher } from "@/components/ChatbotLauncher";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatbotLauncher host="https://YOUR-CHATBOT-HOST" />
      </body>
    </html>
  );
}
```

`host`에는 챗봇 앱이 배포된 origin을 넣습니다. 예를 들면 `https://portfolio-chatbot.vercel.app`처럼요.

## 동작 방식

우하단에 플로팅 버튼이 뜨고, 누르면 둥근 모서리와 그림자가 있는 iframe 패널이 부드럽게
열리고 닫힙니다. 블로그 테마(next-themes)를 토글하면 `postMessage({ type: "theme", value })`로
iframe에 곧바로 전달돼, 패널을 다시 로드하지 않고 색만 바뀝니다.

iframe은 로딩이 끝나면 부모 창에 `chatbot:ready`를 보내는데, 이 신호를 받은 뒤에 테마를
넘겨야 타이밍이 어긋나지 않습니다. 부모가 받는 메시지는 `event.origin`이 챗봇 host origin과
일치하는지 확인한 것만 신뢰합니다.

## 보안

`/embed`의 CSP `frame-ancestors`는 챗봇 앱의 `ALLOWED_ORIGINS`에 등록된 origin만 허용합니다.
그러니 블로그 origin을 거기에 넣어 둬야 임베드가 동작하고, 등록되지 않은 다른 도메인에서는
iframe 임베드가 차단됩니다.

`GEMINI_API_KEY`는 챗봇 앱 서버에서만 쓰이고 iframe이나 블로그 번들에는 들어가지 않습니다.

## next-themes를 안 쓴다면

`useTheme`를 쓰는 부분만 들어내고 초기 테마를 `?theme=auto`로 두면 OS 설정을 그대로 따라갑니다.
이후 테마를 바꾸고 싶을 때는 `iframe.contentWindow.postMessage({ type: "theme", value }, host)`를
직접 호출하면 됩니다.
