# 포트폴리오 챗봇

내 포트폴리오 정보를 벡터 검색으로 찾아 맥락에 맞게 답해주는 RAG 챗봇입니다.
블로그에는 iframe으로 임베드되어 호스트의 CSS·JS와 완전히 분리된 채로 동작하고,
답변은 미리 넣어둔 포트폴리오 데이터에만 근거하도록 막아 두었습니다.

LangChain.js로 검색·생성 파이프라인을 구성하고, 임베딩과 답변 생성은 Gemini를 씁니다.

## 주요 기능

- 포트폴리오 데이터를 임베딩해 인메모리 벡터스토어로 검색하고, 유사도가 기준에 못 미치면
  엉뚱한 답을 지어내는 대신 관련 질문을 추천합니다.
- 후속 질문을 대화 맥락까지 반영한 독립 질문으로 다시 써서 검색합니다(history-aware retrieval).
- 답변은 NDJSON으로 토큰 단위 스트리밍되고, 근거로 쓴 포트폴리오 항목을 출처 링크로 함께 보여줍니다.
- `/embed` 페이지를 별도 origin의 iframe으로 띄워 블로그와 격리하고, CSP `frame-ancestors`로
  허용한 도메인에서만 임베드되게 제한합니다.
- 부모(블로그) 테마를 `postMessage`로 받아 위젯에 실시간 반영합니다.
- Upstash Redis를 연결하면 IP 기준 레이트리밋이 켜집니다(없으면 그냥 통과).

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS 4
- LangChain.js
- Google Gemini — 생성 `gemini-2.5-flash`, 임베딩 `gemini-embedding-001`
- Upstash Redis (레이트리밋, 선택)

## 동작 구조

요청이 들어오면 `/api/chat`에서 레이트리밋과 입력 검증을 거친 뒤, 히스토리가 있으면 질문을
독립 질문으로 재작성합니다. 그 질문으로 벡터스토어를 검색해 기준 점수를 넘는 근거가 있으면
그 문맥만으로 답변을 스트리밍하고, 근거가 부족하면 추천 질문으로 유도합니다.

포트폴리오 데이터를 문서로 변환하고 추천 질문을 만드는 부분은 [lib/rag.ts](lib/rag.ts)의
섹션 레지스트리 한 곳에서 관리합니다. 새 항목 유형을 추가하려면 `Portfolio` 타입에 필드를 더하고
레지스트리에 한 줄만 추가하면 됩니다.

## 시작하기

먼저 의존성을 설치합니다.

```bash
npm install
```

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

포트폴리오 데이터는 두 가지 방법으로 넣을 수 있습니다.

- 로컬: `data/portfolio.json` 파일에 작성 (이 파일은 git에 올라가지 않습니다)
- 배포: `PORTFOLIO_JSON` 환경변수에 같은 JSON을 한 줄로 넣기

데이터 형식은 [lib/config.ts](lib/config.ts)의 `Portfolio` 인터페이스를 따릅니다.

개발 서버를 실행하고 http://localhost:3000 에서 확인합니다.

```bash
npm run dev
```

## 환경변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `GEMINI_API_KEY` | 예 | Gemini API 키. 없으면 채팅 요청 시 에러가 납니다. |
| `PORTFOLIO_JSON` | 배포 시 | 포트폴리오 데이터 JSON 문자열. 로컬은 `data/portfolio.json`으로 대신할 수 있습니다. |
| `ALLOWED_ORIGINS` | 임베드 시 | iframe 임베드를 허용할 블로그 origin. 콤마로 여러 개 지정, 끝 슬래시는 빼고 적습니다. |
| `UPSTASH_REDIS_REST_URL` | 아니오 | 레이트리밋용 Upstash Redis URL. |
| `UPSTASH_REDIS_REST_TOKEN` | 아니오 | 레이트리밋용 Upstash Redis 토큰. |

## 스크립트

```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npm run start      # 빌드 결과 실행
npm run typecheck  # 타입 검사
```

## 배포

Vercel에 레포를 연결하면 Next.js를 자동 감지해 배포합니다. 위 환경변수를 프로젝트 설정에
등록하면 되고, `data/portfolio.json`은 올라가지 않으니 배포 환경에서는 `PORTFOLIO_JSON`을
꼭 채워야 합니다. `runtime`이 Node로 지정되어 있어 파일 읽기가 그대로 동작합니다.

## 블로그에 임베드하기

블로그 레포에 넣는 first-party 로더와 설치 방법은 [blog-embed/README.md](blog-embed/README.md)에
정리해 두었습니다.

## 프로젝트 구조

```
app/
  api/chat/route.ts   # RAG 채팅 스트리밍 API
  embed/              # iframe으로 띄우는 챗봇 본체
  page.tsx            # 데모 랜딩 페이지
components/
  chat/ChatWidget.tsx # 채팅 UI
  demo/               # 데모용 플로팅 런처
lib/
  config.ts           # 포트폴리오 로드 + 설정 상수
  rag.ts              # 문서 변환 · 벡터 검색 · 추천 질문
  gemini.ts           # Gemini 모델 팩토리
  ratelimit.ts        # Upstash 레이트리밋
blog-embed/           # 블로그에 복사해 쓰는 로더
```
