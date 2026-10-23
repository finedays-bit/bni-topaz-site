import { Noto_Sans_KR, Noto_Serif_KR, Cinzel } from "next/font/google";
import Link from "next/link";
import { SITE_URL, links } from "@/lib/data";
import "./globals.css";

const sans = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-sans" });
const serif = Noto_Serif_KR({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-serif" });
const display = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-display" });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "BNI 토파즈 챕터",
  description: "동탄 BNI 토파즈 챕터 — 매주 화요일 아침, 서로의 고객을 소개하는 사업가 모임",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable} ${display.variable}`}>
      <body>
        <header className="nav">
          <Link href="/" className="brand">
            <span className="bni">BNI</span> TOPAZ
          </Link>
          <nav className="nav-links">
            <Link href="/members">멤버</Link>
            <Link href="/leadership">리더쉽팀</Link>
            <Link href="/education">교육 정보</Link>
            <Link href="/rps">RPS</Link>
          </nav>
          <div className="nav-actions">
            <Link href="/invite" className="nav-cta">참관 신청</Link>
            <a href={links.bniConnect} className="nav-connect" target="_blank" rel="noopener noreferrer">BNI Connect</a>
          </div>
        </header>
        {children}
        <footer className="footer">
          {/* 3기 비전 (2026-10-06 비전선포식 비전보드) */}
          <ul className="vision">
            <li><small>멘토링은 깊게</small><b>MENTOR</b></li>
            <li><small>연결은 넓게</small><b>CONNECT</b></li>
            <li><small>성장은 높게</small><b>GROW</b></li>
          </ul>
          <p className="vision-line">서로를 믿고 연결하며 함께 성장하는 토파즈</p>
          <a href={links.bniConnect} className="footer-connect" target="_blank" rel="noopener noreferrer">BNI Connect 로그인 ↗</a>
          <p className="muted"><span className="bni">BNI</span> TOPAZ Chapter · 동탄</p>
        </footer>
      </body>
    </html>
  );
}
