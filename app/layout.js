import { Noto_Sans_KR, Noto_Serif_KR, Cinzel } from "next/font/google";
import Link from "next/link";
import { SITE_URL } from "@/lib/data";
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
          <nav>
            <Link href="/members">멤버</Link>
            <Link href="/invite" className="nav-cta">참관 신청</Link>
          </nav>
        </header>
        {children}
        <footer className="footer">
          <p><span className="bni">BNI</span> TOPAZ Chapter · 동탄</p>
          <p className="muted">Together We Grow</p>
        </footer>
      </body>
    </html>
  );
}
