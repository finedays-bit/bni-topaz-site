import { formatKoreanDate } from "@/lib/data";
import { meetingDate } from "@/lib/invite";
import CopyAccount from "./CopyAccount";

// 초대장 카드 — 초대장 페이지와 첫 페이지가 같이 쓴다
// withAccount: 참가비 계좌까지 보여 줄지 (첫 페이지는 검색에 잘 걸려서 계좌를 빼고 초대장 페이지에만 둔다)
// 3기 비전 (사이트 맨 아래와 같은 세 줄)
const VISION = [["멘토링은 깊게", "MENTOR"], ["연결은 넓게", "CONNECT"], ["성장은 높게", "GROW"]];

// 주소의 괄호 부분("(구 우정바이오신약클러스터)")은 어중간하게 끊기지 않게 다음 줄로
// map: 누르면 네이버 지도에서 도로명 주소(번지까지)를 찾는다 — 휴대폰은 지도 앱으로 열림
export function VenueText({ venue, map = false }) {
  const m = venue?.match(/^(.*?)\s*(\([^)]*\))\s*(.*)$/);
  const text = m ? <>{`${m[1]} ${m[3]}`.trim()}<br /><span className="venue-old">{m[2]}</span></> : venue ?? "";
  if (!map || !venue) return text;
  return (
    <a className="venue-map" href={naverMap(venue)} target="_blank" rel="noopener noreferrer">
      {text}<span className="venue-map-tag">네이버 지도 ↗</span>
    </a>
  );
}
export const naverMap = (venue) =>
  `https://map.naver.com/p/search/${encodeURIComponent(venue.match(/^.*?\d+(?:-\d+)?(?=\s|\(|$)/)?.[0] ?? venue)}`;

export const inviteWhen = (invite) => `${formatKoreanDate(meetingDate(invite))} ${invite.time}`;

export default function InviteCard({ invite, withAccount = true }) {
  const rows = [
    ["일 시", <span className="inv-when">{inviteWhen(invite)}</span>],
    ["장 소", <VenueText venue={invite.venue} map />],
    ["드레스코드", invite.dressCode],
    ["준 비 물", invite.bring],
    ["참 가 비", withAccount ? <>{invite.fee}<br /><CopyAccount account={invite.account} /></> : invite.fee],
  ];
  return (
    <article className="invitation">
      <div className="inv-logo">
        <img className="inv-logo-bni" src="/brand/bni-logo.png" alt="BNI" width="200" height="77" />
        <img className="inv-logo-topaz" src="/brand/topaz-main.png" alt="TOPAZ CHAPTER — DONGTAN · HWASEONG · GLOBAL" width="1200" height="424" />
      </div>
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
      <div className="inv-divider" aria-hidden="true"><span /></div>
      <table className="inv-table">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}><th>{k}</th><td>{v}</td></tr>
          ))}
        </tbody>
      </table>
      <ul className="inv-vision">
        {VISION.map(([ko, en]) => <li key={en}><small>{ko}</small><b>{en}</b></li>)}
      </ul>
    </article>
  );
}
