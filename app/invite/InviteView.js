import Link from "next/link";
import { formatKoreanDate } from "@/lib/data";
import { upcomingDates, KINDS } from "@/lib/invite";
import { isPast } from "@/lib/invitations";
import VisitForm from "./VisitForm";
import ShareButtons from "./ShareButtons";
import InviteCard, { inviteWhen } from "./InviteCard";

// 초대장 + 참관 신청서 — 기본 초대장(/invite)과 멤버가 만든 초대장(/invite/코드)이 같이 쓴다
// inv 가 있으면 그 날짜로 신청서가 고정된다 (지난 날짜면 다가오는 모임 중에서 고르게)
export default function InviteView({ invite, members, inv }) {
  const past = inv && isPast(invite, inv.date);
  const label = (d) => `${formatKoreanDate(d)} ${invite.time}`;
  const locked = inv && !past;
  const dates = locked ? [inv.date] : upcomingDates(invite, 3);

  return (
    <main className="invite-bg">
      {past && <p className="invite-note">이 초대장의 모임({formatKoreanDate(inv.date)})은 이미 지났어요. 아래에서 다가오는 모임으로 신청해 주세요.</p>}
      <InviteCard invite={invite} date={inv?.date} kind={inv?.kind} text={inv && { title: inv.title, sub: inv.sub, body: inv.body }}
        to={inv?.to} from={inv?.inviter} />

      {inv ? (
        <div className="share">
          <a href="#apply" className="btn invite-cta">참관 신청하기 →</a>
        </div>
      ) : (
        <>
          <ShareButtons text={`${inviteWhen(invite)} BNI 토파즈 챕터 비즈니스 조찬모임에 초대합니다.`} />
          <div className="share"><Link href="/invite/make" className="btn btn-line invite-make">✎ 내 초대장 만들기 (날짜·문구 고르기)</Link></div>
        </>
      )}

      <section className="apply" id="apply">
        <p className="eyebrow">Visitor</p>
        <h2>참관 신청</h2>
        <p className="muted">
          {locked && inv.kind !== "normal" ? `${KINDS[inv.kind]} 날에 모십니다. ` : ""}
          한 번의 참관으로 BNI 비즈니스 네트워킹을 직접 경험해 보세요. 신청해 주시면 운영진이 확인 후 연락드립니다.
        </p>
        <VisitForm
          members={members.map(({ name, company }) => ({ name, company }))}
          dates={dates.map((d) => ({ value: d, label: label(d) }))}
          locked={!!locked}
          inviter={inv?.inviter ?? ""}
        />
      </section>
    </main>
  );
}
