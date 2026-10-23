import { invite, members, formatKoreanDate } from "@/lib/data";

export const metadata = {
  title: "초대장 · BNI 토파즈 챕터",
  description: `${formatKoreanDate(invite.date)} ${invite.time} · BNI 토파즈 비즈니스 조찬모임에 초대합니다`,
};

export default function InvitePage() {
  const rows = [
    ["일 시", `${formatKoreanDate(invite.date)} ${invite.time}`],
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

      <div className="share">
        <span className="btn btn-line">초대장 이미지 저장 (3단계)</span>
        <span className="btn btn-line">카카오톡 공유 (3단계)</span>
      </div>

      <section className="apply" id="apply">
        <p className="eyebrow">Visitor</p>
        <h2>참관 신청</h2>
        <p className="muted">신청해 주시면 초대한 멤버가 연락드립니다.</p>
        <form>
          <label>이름 *<input name="name" required /></label>
          <label>휴대폰 번호 *<input name="phone" type="tel" inputMode="numeric" required /></label>
          <label>회사명<input name="company" /></label>
          <label>사업 분야<input name="field" /></label>
          <label>
            초대한 멤버
            <select name="inviter" defaultValue="">
              <option value="">선택 안 함</option>
              {members.map((m) => <option key={m.name}>{m.name} ({m.company})</option>)}
            </select>
          </label>
          <label className="agree">
            <input type="checkbox" required />
            <span>참석 확인과 모임 안내를 위해 이름·연락처를 수집하는 데 동의합니다. (필수)</span>
          </label>
          <button type="button" className="btn btn-main" disabled>신청서 제출</button>
          <p className="draft-note">화면 초안입니다 — 제출 기능은 2단계에서 연결됩니다.</p>
        </form>
      </section>
    </main>
  );
}
