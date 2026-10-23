// 사이트 내용 읽기 — Supabase(관리자 화면에서 고친 내용)가 기준, 연결이 안 되면 파일(lib/*)로 대신한다
// 관리자가 고친 내용은 1분 안에 화면에 반영된다
import * as local from "./data.js";
import localLeadership from "./leadership.json";
import { getAllProfiles } from "./profiles.js";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const REVALIDATE = 60;

async function rest(path) {
  if (!URL_ || !KEY) throw new Error("Supabase 설정 없음");
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    next: { revalidate: REVALIDATE, tags: ["site"] },
  });
  if (!res.ok) throw new Error(`Supabase 읽기 실패 (${res.status})`);
  return res.json();
}

const toProfile = (r) => ({
  name: r.name,
  company: r.company,
  specialty: r.specialty,
  team: r.team,
  card: r.card,
  phone: r.phone,
  phone2: r.phone2,
  email: r.email,
  face: r.face,
  leaderOnly: r.leader_only,
});

// 멤버 + 지역 서포트 팀 전부 (명함 보기·연락처용)
export async function getPeople() {
  try {
    const rows = await rest("members?select=*&active=eq.true&order=sort.asc,id.asc");
    return rows.map(toProfile);
  } catch {
    const memberNames = new Set(local.members.map((m) => m.name));
    return getAllProfiles().map((p) => ({ ...p, leaderOnly: !memberNames.has(p.name) }));
  }
}

// 챕터 멤버만 (멤버 페이지·활동 멤버 수)
export async function getMembers() {
  return (await getPeople()).filter((p) => !p.leaderOnly);
}

export async function getPerson(name) {
  return (await getPeople()).find((p) => p.name === name) ?? null;
}

const fallback = {
  chapter: local.chapter,
  about: local.about,
  power_teams: local.powerTeams,
  invite: local.invite,
  links: local.links,
  education: local.education,
  rps_sheet: local.rpsSheet,
  leadership: localLeadership,
};

// 사이트 설정 전부 { chapter, invite, education, leadership, ... }
export async function getSettings() {
  try {
    const rows = await rest("settings?select=key,value");
    const db = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    // 링크는 항목별로 합친다 (나중에 추가된 링크가 저장 공간에 아직 없어도 보이게)
    return { ...fallback, ...db, links: { ...fallback.links, ...db.links } };
  } catch {
    return fallback;
  }
}
