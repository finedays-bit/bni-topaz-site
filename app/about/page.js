import Link from "next/link";
import { getMembers, getSettings } from "@/lib/store";
import Icon from "../Icon";

export const metadata = {
  title: "챕터 소개 · BNI 토파즈 챕터",
  description: "화성의 첫 연결, 세계로 이어지는 신뢰. 경기도 화성시에서 처음 시작된 BNI 챕터, 토파즈 챕터를 소개합니다.",
};
export const revalidate = 60;

// 핵심 가치 — 소개글에서 뽑은 다섯 가지
const values = [
  { icon: "handshake", title: "Givers Gain®", body: "주는 자가 얻는다. 먼저 서로의 성장을 돕습니다." },
  { icon: "user", title: "한 분야 한 명", body: "전문 분야별로 한 명의 멤버가 활동합니다." },
  { icon: "people", title: "믿고 소개하는 관계", body: "서로의 사업을 깊이 이해하고, 신뢰를 실질적인 기회로 만듭니다." },
  { icon: "calendar", title: "매주 실천", body: "정기 미팅과 일대일 만남에서 필요한 연결을 찾습니다." },
  { icon: "trend", title: "화성에서 세계로", body: "지역의 비즈니스와 글로벌 네트워크를 잇습니다." },
];

const paras = (text) => (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const lines = (text) => (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

export default async function AboutPage() {
  const [{ about, chapter }, members] = await Promise.all([getSettings(), getMembers()]);

  return (
    <main>
      <div className="page-head wrap">
        <p className="eyebrow">About</p>
        <h1>챕터 소개</h1>
      </div>

      <section className="wrap about">
        <div className="about-hero">
          <img src="/brand/topaz-main.png" alt="TOPAZ CHAPTER — DONGTAN · HWASEONG · GLOBAL" />
          <h2>{about.headline}</h2>
          <p className="about-sub">{about.sub}</p>
        </div>

        <div className="about-body">
          {paras(about.body).map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
        </div>

        <h2 className="sub-h">핵심 가치</h2>
        <div className="about-values">
          {values.map((v) => (
            <div className="about-value" key={v.title}>
              <span className="edu-icon"><Icon name={v.icon} /></span>
              <b>{v.title}</b>
              <p>{v.body}</p>
            </div>
          ))}
        </div>

        <h2 className="sub-h">정기 모임 안내</h2>
        <div className="panel about-meet">
          <div><small>일시</small><b>{chapter.meetingDay} {chapter.meetingTime}</b></div>
          <div><small>장소</small><b>{chapter.venue}</b></div>
          <div><small>멤버</small><b>{members.length}명 · 한 분야 한 명</b></div>
        </div>

        <blockquote className="about-closing">
          {lines(about.closing).map((l) => <span key={l}>{l}</span>)}
        </blockquote>

        <div className="about-cta">
          {lines(about.cta).map((l) => <p key={l}>{l}</p>)}
          <div className="actions">
            <Link href="/invite" className="btn btn-main">정기 미팅 참관 신청</Link>
            <Link href="/members" className="btn btn-line">멤버 둘러보기</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
