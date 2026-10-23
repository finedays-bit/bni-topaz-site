import Link from "next/link";
import { getMembers, getSettings } from "@/lib/store";

export const revalidate = 60;

const values = [
  { title: "Givers Gain®", body: "먼저 주는 사람이 더 많이 얻는다. 서로의 고객을 먼저 소개합니다." },
  { title: "한 업종 한 명", body: "업종마다 한 명만 앉습니다. 내 업종의 소개는 모두 나에게 옵니다." },
  { title: "검증된 리퍼럴", body: "매주 얼굴을 보며 쌓은 신뢰로, 책임지고 소개합니다." },
  { title: "글로벌 네트워크", body: "76개국 11,600여 챕터, 35만여 멤버와 연결됩니다." },
];

const flow = [
  "오픈 네트워킹 — 자유롭게 인사하고 명함을 나눕니다",
  "위클리 프리젠테이션 — 멤버별 40초 사업 소개",
  "피처 프리젠테이션 — 한 멤버의 사업을 깊이 있게 10분",
  "리퍼럴·감사 발표 — 한 주 동안 주고받은 소개를 나눕니다",
  "1:1 미팅 — 모임 밖에서 서로의 사업을 더 알아갑니다",
];

export default async function Home() {
  const [{ chapter }, members] = await Promise.all([getSettings(), getMembers()]);
  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">{chapter.slogan}</p>
          <h1 className="cheer">
            {chapter.cheer[0]} <span className="accent">{chapter.cheer[1]}</span>
          </h1>
          <p className="hero-sub">서로의 고객을 소개하는 {chapter.region} 사업가들의 아침</p>
          <p className="lead">
            BNI 토파즈 챕터는 업종마다 한 명씩, 서로 믿고 고객을 소개하는 비즈니스 모임입니다.
          </p>
          <div className="actions">
            <Link href="/invite" className="btn btn-main">이번 주 모임 참관 신청</Link>
            <Link href="/members" className="btn btn-line">멤버 둘러보기</Link>
          </div>
          <div className="meeting-chip">
            <span><b>{chapter.meetingDay}</b> {chapter.meetingTime}</span>
            <span>{chapter.venue}</span>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="stats">
            {chapter.stats.map((s) => (
              <div className="stat" key={s.label}>
                <b>{s.value}<small>{s.unit}</small></b>
                <span>{s.label}</span>
              </div>
            ))}
            <div className="stat">
              <b>{members.length}<small>명</small></b>
              <span>활동 멤버</span>
            </div>
          </div>        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <p className="eyebrow">About BNI</p>
          <h2>세계 최대의 비즈니스 소개 네트워크</h2>
          <div className="values">
            {values.map((v) => (
              <div className="value" key={v.title}>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <p className="eyebrow">Our Meeting</p>
          <h2>화요일 아침, 이렇게 진행됩니다</h2>
          <ol className="flow">
            {flow.map((f) => <li key={f}>{f}</li>)}
          </ol>
        </div>
      </section>

      <section className="band">
        <div className="wrap cta-box">
          <p className="eyebrow">Visit</p>
          <h2>한 번 와서 직접 보세요</h2>
          <p>참관은 언제든 환영합니다. 명함만 챙겨 오시면 됩니다.</p>
          <Link href="/invite" className="btn btn-main">초대장 보기 · 참관 신청</Link>
        </div>
      </section>
    </main>
  );
}
