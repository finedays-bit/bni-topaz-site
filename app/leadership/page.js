import { existsSync } from "node:fs";
import { join } from "node:path";
import { members } from "@/lib/data";
import leadership from "@/lib/leadership.json";

export const metadata = { title: "리더쉽팀 · BNI 토파즈 챕터" };

// 얼굴 사진은 npm run faces 로 만든다 (없으면 이름 첫 글자)
const hasFace = (name) => existsSync(join(process.cwd(), "public", "faces", `${name}.jpg`));

export default function LeadershipPage() {
  return (
    <main>
      <div className="page-head wrap">
        <p className="eyebrow">Leadership</p>
        <h1>리더쉽팀</h1>
        <p className="muted">토파즈 챕터를 이끄는 리더쉽팀입니다.</p>
      </div>

      <section className="wrap lt">
        <div className="lt-title">
          <h2>{leadership.term} 리더쉽팀</h2>
          <span className="lt-live">활동 중</span>
          <span className="muted">{leadership.period}</span>
        </div>

        {leadership.groups.map((g) => (
          <div className="lt-group" key={g.title}>
            <h3>{g.title}</h3>
            <div className="lt-grid">
              {g.people.map((p) => {
                const company = p.company || members.find((m) => m.name === p.name)?.company;
                return (
                  <div className="lt-card" key={p.role}>
                    {hasFace(p.name)
                      ? <img src={`/faces/${encodeURIComponent(p.name)}.jpg`} alt={p.name} loading="lazy" />
                      : <span className="lt-noface">{p.name[0]}</span>}
                    <div>
                      <small>{p.role}</small>
                      <b>{p.name}</b>
                      {company && <span>{company}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
