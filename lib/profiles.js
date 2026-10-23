// 멤버 + 명함 파일 + 연락처를 합친 프로필 (서버에서만 사용)
// 연락처(휴대폰)는 공개 저장소에 올리지 않는 lib/contacts.local.json 에서 읽는다 — 없으면 번호 없이 동작
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { members } from "./data.js";
import cards from "./cards.json";
import leadership from "./leadership.json";

function loadContacts() {
  const file = join(process.cwd(), "lib", "contacts.local.json");
  if (!existsSync(file)) return {};
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return {}; }
}

export function getProfiles() {
  const contacts = loadContacts();
  return members.map((m) => {
    const c = contacts[m.name] ?? {};
    return {
      name: m.name,
      company: m.company,
      specialty: m.specialty,
      team: m.team,
      card: cards[m.name]?.file ?? null,
      phone: c.phone ?? null,
      phone2: c.phone2 ?? null,
      email: c.email ?? null,
    };
  });
}

// 멤버가 아닌 리더십팀(지역 서포트 팀: 디렉터·앰배서더) — 멤버 페이지엔 안 나오고 명함 보기·공유만
function getGuestProfiles() {
  const contacts = loadContacts();
  return leadership.groups
    .flatMap((g) => g.people.map((p) => ({ ...p })))
    .filter((p) => !members.some((m) => m.name === p.name))
    .map((p) => {
      const c = contacts[p.name] ?? {};
      return {
        name: p.name,
        company: p.company ?? "",
        specialty: p.specialty ?? p.role,
        team: null,
        card: cards[p.name]?.file ?? null,
        phone: c.phone ?? null,
        phone2: c.phone2 ?? null,
        email: c.email ?? null,
      };
    });
}

export function getAllProfiles() {
  return [...getProfiles(), ...getGuestProfiles()];
}

export function getProfile(name) {
  return getAllProfiles().find((p) => p.name === name) ?? null;
}

// 갤럭시·아이폰 주소록 모두 읽는 vCard 3.0
export function toVCard(p) {
  const esc = (s) => String(s ?? "").replace(/([\\,;])/g, "\\$1");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(p.name.slice(0, 1))};${esc(p.name.slice(1))};;;`,
    `FN:${esc(p.name)}`,
    `ORG:${esc(p.company)}`,
    `TITLE:${esc(p.specialty)}`,
    p.phone && `TEL;TYPE=CELL,VOICE:${p.phone}`,
    p.phone2 && `TEL;TYPE=CELL,VOICE:${p.phone2}`,
    p.email && `EMAIL;TYPE=INTERNET:${p.email}`,
    `NOTE:${esc(`BNI 토파즈 챕터 · ${p.specialty}`)}`,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n") + "\r\n";
}
