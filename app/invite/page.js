import { formatKoreanDate } from "@/lib/data";
import { getMembers, getSettings } from "@/lib/store";
import VisitForm from "./VisitForm";
import ShareButtons from "./ShareButtons";
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
  const when = `${formatKoreanDate(meetingDate(invite))} ${invite.time}`;
  const rows = [
    ["일 시", when],
    ["장 소", invite.venue],
    ["드레스코드", invite.dressCode],
    ["준 비 물", invite.bring],
    ["참 가 비", <>{invite.fee}<br /><span className="nowrap">{invite.account}</span></>],
  ];

  return (
    <main className="invite-bg">
      <article className="invitation">
        <div className="inv-logo"><span className="bni">BNI</span> TOPAZ</div>
        <p className="inv-tag">A Brighter Tomorrow Together</p>
        <h1 className="inv-title">INVITATION</h1>
        <p className="inv-sub">귀하를 정중히 초대합니다</p>
        <p className="inv-body">
          BNI는 기업 경영자와 전문가들이<br />비즈니스 소개를 주고받으며<br />
          상호 간의 사업 성장을 지원하는<br />세계 최대의 비즈니스 네트워크입니다.
        </p>
        <p className="inv-body">
          대표님의 업종에 정기적으로 고객을 소개해 드릴 수 있는{" "}
          제가 신뢰하는 사업가들의 협업 모임에 초대합니다.
        </p>
        <div className="seal"><b>BNI</b><span>TOPAZ</span></div>
        <table className="inv-table">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}><th>{k}</th><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="inv-foot">TOGETHER WE GROW</p>
      </article>

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
