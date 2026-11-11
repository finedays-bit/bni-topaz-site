import { getMembers, getSettings } from "@/lib/store";
import { upcomingDates, kindOf, textsFor, weeksLabel, KINDS } from "@/lib/invite";
import MakeInvite from "./MakeInvite";

export const revalidate = 60;
export const metadata = { title: "내 초대장 만들기 · BNI 토파즈 챕터", robots: { index: false } };

// 멤버 누구나: 날짜(다음주·2주 후·3주 후…)와 종류를 고르고 글자를 고쳐 나만의 초대장 링크를 만든다
export default async function MakeInvitePage() {
  const [{ invite }, members] = await Promise.all([getSettings(), getMembers()]);
  const meetings = upcomingDates(invite, 6).map((date) => ({ date, kind: kindOf(invite, date), rel: weeksLabel(date) }));
  const texts = Object.fromEntries(Object.keys(KINDS).map((k) => [k, textsFor(invite, k)]));
  return (
    <main className="invite-bg make-bg">
      <MakeInvite invite={{ ...invite, account: "" }} meetings={meetings} texts={texts}
        members={members.map(({ name, company }) => ({ name, company }))} />
    </main>
  );
}
