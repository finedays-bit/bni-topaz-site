import { formatKoreanDate } from "@/lib/data";
import { meetingDate, kindOf, textsFor } from "@/lib/invite";
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

export const inviteWhen = (invite, date = meetingDate(invite)) => `${formatKoreanDate(date)} ${invite.time}`;

// 글자 길이로 크기 정하기 — 멤버가 글자를 바꿔도 틀 안에 자연스럽게 들어가도록
// 한글은 영문 대문자보다 넓어서 1.4칸으로 센다
const width = (s = "") => [...s].reduce((n, c) => n + (/[\u3131-\uD7A3]/.test(c) ? 1.4 : c === " " ? 0.5 : 1), 0);
function titleSize(title) {
  const f = Math.min(1, 10 / Math.max(width(title), 1));       // 'INVITATION'(10칸) 기준
  return { fontSize: `clamp(${Math.max(22, 40 * f)}px, ${11 * f}vw, ${64 * f}px)` };
}
function subSize(sub) {
  const f = Math.min(1, 15 / Math.max(width(sub), 1));         // '귀하를 정중히 초대합니다' 기준
  return f < 1 ? { fontSize: `clamp(${Math.max(16, 20 * f)}px, ${5 * f}vw, ${26 * f}px)` } : undefined;
}
function bodySize(body) {
  const n = [...(body ?? "")].length;
  return n > 320 ? { fontSize: 13 } : n > 220 ? { fontSize: 14 } : undefined;
}

// 본문: 빈 줄 = 문단, 줄바꿈 = 줄바꿈
function Body({ text }) {
  const style = bodySize(text);
  return (text ?? "").split(/\n\s*\n/).map((para, i) => (
    <p className="inv-body" style={style} key={i}>
      {para.split("\n").map((line, j) => <span key={j}>{j > 0 && <br />}{line}</span>)}
    </p>
  ));
}

// date·kind·text·to·from 을 주면 멤버가 만든 초대장, 안 주면 이번 주 기본 초대장
export default function InviteCard({ invite, withAccount = true, date, kind, text, to, from }) {
  const when = date ?? meetingDate(invite);
  const k = kind ?? kindOf(invite, when);
  const t = { ...textsFor(invite, k), ...text };
  const rows = [
    ["일 시", <span className="inv-when">{inviteWhen(invite, when)}</span>],
    ["장 소", <VenueText venue={invite.venue} map />],
    ["드레스코드", invite.dressCode],
    ["준 비 물", invite.bring],
    ["참 가 비", withAccount ? <>{invite.fee}<br /><CopyAccount account={invite.account} /></> : invite.fee],
  ];
  return (
    <article className={`invitation inv-${k}`}>
      <div className="inv-logo">
        <img className="inv-logo-bni" src="/brand/bni-logo.png" alt="BNI" width="200" height="77" />
        <img className="inv-logo-topaz" src="/brand/topaz-main.png" alt="TOPAZ CHAPTER — DONGTAN · HWASEONG · GLOBAL" width="1200" height="424" />
      </div>
      {to && <p className="inv-to">{to}께</p>}
      <p className="inv-tag">A Brighter Tomorrow Together</p>
      <h1 className="inv-title" style={titleSize(t.title)}>{t.title}</h1>
      <p className="inv-sub" style={subSize(t.sub)}>{t.sub}</p>
      <Body text={t.body} />
      {from && <div className="inv-from"><small>초대하는 사람</small>{from}</div>}
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
