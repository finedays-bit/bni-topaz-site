import { getMembers, getSettings } from "@/lib/store";
import MemberGrid from "./MemberGrid";

export const revalidate = 60;

export const metadata = { title: "멤버 · BNI 토파즈 챕터" };

export default async function MembersPage() {
  const [members, { power_teams: powerTeams }] = await Promise.all([getMembers(), getSettings()]);
  return (
    <main className="wrap">
      <div className="page-head">
        <p className="eyebrow">Members</p>
        <h1>토파즈 챕터 멤버</h1>
        <p className="muted">한 업종에 한 명. {members.length}명의 대표님을 이미지 명함으로 소개합니다.</p>
      </div>
      <MemberGrid members={members} teams={powerTeams} />
    </main>
  );
}
