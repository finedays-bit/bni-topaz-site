import { redirect } from "next/navigation";
import { formatKoreanDate } from "@/lib/data";
import { getMembers, getSettings } from "@/lib/store";
import { getInvitation } from "@/lib/invitations";
import InviteView from "../InviteView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { code } = await params;
  const [{ invite }, inv] = await Promise.all([getSettings(), getInvitation(code)]);
  if (!inv) return { title: "초대장 · BNI 토파즈 챕터" };
  const by = inv.inviter ? ` · ${inv.inviter.replace(/\s*\(.*\)$/, "")} 님의 초대` : "";
  const description = `${formatKoreanDate(inv.date)} ${invite.time} · ${inv.sub || "BNI 토파즈 비즈니스 조찬모임에 초대합니다"}${by}`;
  return {
    title: "초대장 · BNI 토파즈 챕터",
    description,
    robots: { index: false },
    openGraph: { title: inv.to ? `${inv.to}께 · BNI 토파즈 초대장` : "BNI 토파즈 챕터 초대장", description, images: ["/brand/topaz-main.png"] },
  };
}

// 멤버가 만든 초대장 (짧은 주소). 없는 코드면 기본 초대장으로
export default async function MemberInvitePage({ params }) {
  const { code } = await params;
  const [{ invite }, members, inv] = await Promise.all([getSettings(), getMembers(), getInvitation(code)]);
  if (!inv) redirect("/invite");
  return <InviteView invite={invite} members={members} inv={inv} />;
}
