"use client";

import { useState } from "react";
import { formatKoreanDate } from "@/lib/data";
import { KINDS, LIMITS } from "@/lib/invite";
import { toQuery } from "@/lib/invitations";
import InviteCard from "../InviteCard";

const OTHER = "__other__";
const SAVED_KEY = "topaz-my-name"; // 이 휴대폰에서 고른 내 이름 기억

export default function MakeInvite({ invite, meetings, texts, members }) {
  const first = meetings[0];
  const [date, setDate] = useState(first?.date ?? "");
  const [kind, setKind] = useState(first?.kind ?? "normal");
  const [text, setText] = useState(texts[first?.kind ?? "normal"]);
  const [to, setTo] = useState("");
  const [who, setWho] = useState(() => { try { return localStorage.getItem(SAVED_KEY) ?? ""; } catch { return ""; } });
  const [other, setOther] = useState("");
  const [link, setLink] = useState(null); // { url, long }
  const [msg, setMsg] = useState("");
  const [kindMsg, setKindMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const inviter = who === OTHER ? other.trim() : who;
  const changed = () => { setLink(null); setMsg(""); };
  const pickKind = (k, auto) => { setKind(k); setText(texts[k]); setKindMsg(auto && k !== "normal" ? `이 날은 ${KINDS[k]} 날이라 종류가 자동으로 바뀌었어요. 다른 종류로 바꿀 수도 있어요.` : ""); changed(); };
  const pickDate = (m) => { setDate(m.date); if (m.kind !== kind) pickKind(m.kind, true); else changed(); };
  const edit = (k) => (e) => { setText({ ...text, [k]: e.target.value.slice(0, LIMITS[k]) }); changed(); };
  const pickWho = (v) => { setWho(v); changed(); try { if (v && v !== OTHER) localStorage.setItem(SAVED_KEY, v); } catch {} };

  async function make() {
    if (!inviter) return setMsg("초대하는 멤버(내 이름)를 먼저 골라 주세요.");
    setBusy(true); setMsg("");
    const inv = { date, kind, inviter, to: to.trim(), ...text };
    try {
      const res = await fetch("/api/invitation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(inv) });
      const data = await res.json();
      if (res.ok && data.code) setLink({ url: `${location.origin}/invite/${data.code}` });
      else if (data.error === "save-failed") setLink({ url: `${location.origin}/invite?${toQuery(inv, texts[kind])}`, long: true });
      else setMsg(data.error || "링크를 만들지 못했습니다.");
    } catch {
      setLink({ url: `${location.origin}/invite?${toQuery(inv, texts[kind])}`, long: true });
    }
    setBusy(false);
  }

  const shareText = `${formatKoreanDate(date)} ${invite.time} BNI 토파즈 챕터 비즈니스 조찬모임에 초대합니다.`;
  async function copy() {
    try { await navigator.clipboard.writeText(link.url); setMsg("링크를 복사했어요. 카카오톡 대화창에 붙여 넣으세요."); }
    catch { setMsg("복사가 안 되면 위 주소를 길게 눌러 복사해 주세요."); }
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: "BNI 토파즈 챕터 초대장", text: shareText, url: link.url }); } catch {} }
    else copy();
  }

  return (
    <div className="make">
      <div className="make-form">
        <p className="eyebrow">For Members</p>
        <h1>내 초대장 만들기</h1>
        <p className="muted">날짜와 종류를 고르고 글자를 고치면 오른쪽 초대장이 바로 바뀝니다. 다 되면 링크를 만들어 보내세요. 받은 분은 그 날짜로 참관 신청을 하게 됩니다.</p>

        <div className="make-step">
          <h2><span>1</span> 초대하는 멤버</h2>
          <select value={who} onChange={(e) => pickWho(e.target.value)} aria-label="초대하는 멤버">
            <option value="">내 이름을 골라 주세요</option>
            {members.map((m) => { const v = `${m.name} (${m.company})`; return <option key={m.name} value={v}>{v}</option>; })}
            <option value={OTHER}>목록에 없음 (직접 입력)</option>
          </select>
          {who === OTHER && <input value={other} maxLength={LIMITS.inviter} onChange={(e) => { setOther(e.target.value); changed(); }} placeholder="예: 홍길동 (회사명)" aria-label="초대하는 멤버 이름" />}
        </div>

        <div className="make-step">
          <h2><span>2</span> 모임 날짜</h2>
          <div className="make-dates">
            {meetings.map((m) => (
              <button type="button" key={m.date} aria-pressed={m.date === date} onClick={() => pickDate(m)}>
                <small>{m.rel}</small>
                <b>{formatKoreanDate(m.date).replace(/^\d{4}년 /, "")}</b>
                {m.kind !== "normal" && <em>{KINDS[m.kind]}</em>}
              </button>
            ))}
          </div>
          <p className="make-hint">운영진이 정한 정모 날짜만 나옵니다. 휴회 주는 빠져 있어요.</p>
        </div>

        <div className="make-step">
          <h2><span>3</span> 초대장 종류</h2>
          <div className="make-kinds">
            {Object.entries(KINDS).map(([k, label]) => (
              <button type="button" key={k} aria-pressed={k === kind} onClick={() => pickKind(k, false)}>{label}</button>
            ))}
          </div>
          {kindMsg && <p className="make-hint make-msg">{kindMsg}</p>}
        </div>

        <div className="make-step">
          <h2><span>4</span> 글자 고치기</h2>
          <label>받는 분 (선택)<input value={to} maxLength={LIMITS.to} onChange={(e) => { setTo(e.target.value); changed(); }} placeholder="예: 홍길동 대표님" /></label>
          <label>큰 제목<input value={text.title} onChange={edit("title")} /></label>
          <label>인사 문구<input value={text.sub} onChange={edit("sub")} /></label>
          <label>본문 <small>빈 줄을 넣으면 문단이 나뉩니다</small><textarea rows={7} value={text.body} onChange={edit("body")} /></label>
          <button type="button" className="make-reset" onClick={() => { setText(texts[kind]); changed(); }}>기본 글자로 되돌리기</button>
        </div>
      </div>

      <div className="make-preview">
        <InviteCard invite={invite} withAccount={false} date={date} kind={kind} text={text} to={to.trim()} from={inviter} />
        <div className="make-actions">
          {!link ? (
            <button type="button" className="btn btn-main" onClick={make} disabled={busy || !date}>{busy ? "만드는 중…" : "초대장 링크 만들기"}</button>
          ) : (
            <div className="make-link">
              <b>링크가 만들어졌어요</b>
              <code>{link.url}</code>
              <div className="make-link-btns">
                <button type="button" className="btn btn-main" onClick={share}>카카오톡 등으로 공유</button>
                <button type="button" className="btn btn-line" onClick={copy}>링크 복사</button>
                <a className="btn btn-line" href={link.url} target="_blank" rel="noopener noreferrer">미리 열어 보기</a>
              </div>
              {link.long && <small>지금은 짧은 주소를 만들 수 없어 긴 주소로 만들었어요. 그대로 보내셔도 됩니다.</small>}
              {msg && <small>{msg}</small>}
            </div>
          )}
          {msg && !link && <p className="make-msg">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
