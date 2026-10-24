import { formatKoreanDate } from "@/lib/data";
import { getMembers, getSettings } from "@/lib/store";
import VisitForm from "./VisitForm";
import ShareButtons from "./ShareButtons";
import InviteCard, { inviteWhen } from "./InviteCard";
import { meetingDate, upcomingDates } from "@/lib/invite";

export const revalidate = 60;

export async function generateMetadata() {
  const { invite } = await getSettings();
  const description = `${formatKoreanDate(meetingDate(invite))} ${invite.time} · BNI 토파즈 비즈니스 조찬모임에 초대합니다`;
  return {
    title: "초대장 · BNI 토파즈 챕터",
    description,
    openGraph: { title: "BNI 토파즈 챕터 초대장", description, images: ["/brand/topaz-main.png"] },
  };
}

export default async function InvitePage() {
  const [{ invite }, members] = await Promise.all([getSettings(), getMembers()]);
  const when = inviteWhen(invite);

  return (
    <main className="invite-bg">
      <InviteCard invite={invite} />

      <ShareButtons text={`${when} BNI 토파즈 챕터 비즈니스 조찬모임에 초대합니다.`} />

      <section className="apply" id="apply">
        <p className="eyebrow">Visitor</p>
        <h2>참관 신청</h2>
        <p className="muted">한 번의 참관으로 BNI 비즈니스 네트워킹을 직접 경험해 보세요. 신청해 주시면 운영진이 확인 후 연락드립니다.</p>
        <VisitForm
          members={members.map(({ name, company }) => ({ name, company }))}
          dates={upcomingDates(invite).map((d) => ({ value: d, label: `${formatKoreanDate(d)} ${invite.time}` }))}
        />
      </section>
    </main>
  );
}
