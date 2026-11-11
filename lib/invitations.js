// 멤버가 만든 초대장 — 짧은 주소(/invite/abc123)는 Supabase invitations 표에 저장,
// 저장이 안 될 때는 글자를 주소에 담은 긴 주소(/invite?d=…)로 대신한다
import { KINDS, LIMITS, meetingDate } from "./invite.js";

const clip = (s, max) => String(s ?? "").replace(/\r/g, "").trim().slice(0, max);

// 들어온 값 정리 (날짜·종류 확인, 길이 자르기). 날짜가 이상하면 null
export function cleanInvitation(x) {
  if (!x || !/^\d{4}-\d{2}-\d{2}$/.test(x.date ?? "")) return null;
  return {
    date: x.date,
    kind: KINDS[x.kind] ? x.kind : "normal",
    inviter: clip(x.inviter, LIMITS.inviter),
    to: clip(x.to, LIMITS.to),
    title: clip(x.title, LIMITS.title),
    sub: clip(x.sub, LIMITS.sub),
    body: clip(x.body, LIMITS.body),
  };
}

// 주소에 담기 (짧은 주소 저장이 안 될 때만). 기본 글자와 같은 칸은 빼서 주소를 줄인다
export function toQuery(inv, defaults) {
  const q = new URLSearchParams({ d: inv.date, k: inv.kind });
  if (inv.inviter) q.set("by", inv.inviter);
  if (inv.to) q.set("to", inv.to);
  if (inv.title !== defaults.title) q.set("t", inv.title);
  if (inv.sub !== defaults.sub) q.set("s", inv.sub);
  if (inv.body !== defaults.body) q.set("b", inv.body);
  return q.toString();
}

export function fromQuery(sp) {
  if (!sp?.d) return null;
  return cleanInvitation({ date: sp.d, kind: sp.k, inviter: sp.by, to: sp.to, title: sp.t, sub: sp.s, body: sp.b });
}

// 이미 지난 모임인지 (그 날 모임이 끝나는 시각까지는 유효)
export const isPast = (invite, date) => date < meetingDate({ ...invite, auto: true, skipDates: [] });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const headers = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}` });

export async function getInvitation(code) {
  if (!URL_ || !KEY || !/^[a-z0-9]{6,12}$/.test(code)) return null;
  try {
    const res = await fetch(`${URL_}/rest/v1/invitations?code=eq.${code}&select=*`, { headers: headers(), cache: "no-store" });
    if (!res.ok) return null;
    const [r] = await res.json();
    return r ? cleanInvitation({ date: r.meeting_date, kind: r.kind, inviter: r.inviter, to: r.to_name, title: r.title, sub: r.sub, body: r.body }) : null;
  } catch {
    return null;
  }
}

export async function saveInvitation(inv) {
  if (!URL_ || !KEY) throw new Error("저장 공간 설정 없음");
  const code = [...crypto.getRandomValues(new Uint8Array(8))].map((b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
  const res = await fetch(`${URL_}/rest/v1/invitations`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      code, meeting_date: inv.date, kind: inv.kind, inviter: inv.inviter || null, to_name: inv.to || null,
      title: inv.title, sub: inv.sub, body: inv.body,
    }),
  });
  if (!res.ok) throw new Error(`저장 실패 (${res.status}) ${await res.text()}`);
  return code;
}
