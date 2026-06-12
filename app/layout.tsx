import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio Chatbot",
  description: "RAG-based AI chatbot for an algorithm/dev blog & portfolio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-theme은 클라이언트(ChatWidget/로더)에서 설정되므로 hydration 경고 억제
    <html lang="ko" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
