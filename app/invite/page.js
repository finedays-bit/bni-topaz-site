import { formatKoreanDate } from "@/lib/data";
import { getMembers, getSettings } from "@/lib/store";
import { meetingDate } from "@/lib/invite";
import { fromQuery } from "@/lib/invitations";
import InviteView from "./InviteView";

export const revalidate = 60;

export async function generateMetadata({ searchParams }) {
  const { invite } = await getSettings();
  const inv = fromQuery(await searchParams);
  const date = inv?.date ?? meetingDate(invite);
  const by = inv?.inviter ? ` · ${inv.inviter.replace(/\s*\(.*\)$/, "")} 님의 초대` : "";
  const description = `${formatKoreanDate(date)} ${invite.time} · BNI 토파즈 비즈니스 조찬모임에 초대합니다${by}`;
  return {
    title: "초대장 · BNI 토파즈 챕터",
    description,
    openGraph: { title: "BNI 토파즈 챕터 초대장", description, images: ["/brand/topaz-main.png"] },
  };
}

// 고정 주소 초대장 — 날짜는 매주 자동. 주소에 ?d=… 가 붙어 있으면 멤버가 만든 초대장(짧은 주소 저장이 안 됐을 때)
export default async function InvitePage({ searchParams }) {
  const [{ invite }, members] = await Promise.all([getSettings(), getMembers()]);
  return <InviteView invite={invite} members={members} inv={fromQuery(await searchParams)} />;
}
