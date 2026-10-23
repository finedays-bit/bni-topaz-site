import { existsSync } from "node:fs";
import { join } from "node:path";
import { getPeople, getSettings } from "@/lib/store";
import LeaderGroups from "./LeaderGroups";
import { faceSrc } from "@/lib/media";

export const metadata = { title: "리더십팀 · BNI 토파즈 챕터" };
export const revalidate = 60;

// 얼굴 사진은 npm run faces 로 만든다 (없으면 이름 첫 글자)
const hasFace = (name) => existsSync(join(process.cwd(), "public", "faces", `${name}.jpg`));

export default async function LeadershipPage() {
  const [profiles, { leadership }] = await Promise.all([getPeople(), getSettings()]);
  const groups = leadership.groups.map((g) => ({
    title: g.title,
    people: g.people.map((p) => {
      const profile = profiles.find((m) => m.name === p.name) ?? null;
      return { ...p, company: p.company || profile?.company, face: faceSrc(profile ?? p, hasFace(p.name)), profile };
    }),
  }));

  return (
    <main>
      <div className="page-head wrap">
        <p className="eyebrow">Leadership</p>
        <h1>리더십팀</h1>
        <p className="muted">토파즈 챕터를 이끄는 리더십팀입니다. 멤버를 누르면 명함을 볼 수 있습니다.</p>
      </div>

      <section className="wrap lt">
        <div className="lt-title">
          <h2>{leadership.term} 리더십팀</h2>
          <span className="lt-live">활동 중</span>
          <span className="muted">{leadership.period}</span>
        </div>
        <LeaderGroups groups={groups} />
      </section>
    </main>
  );
}
