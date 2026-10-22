import { members, powerTeams } from "@/lib/data";
import MemberGrid from "./MemberGrid";

export const metadata = { title: "멤버 · BNI 토파즈 챕터" };

export default function MembersPage() {
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
