// 지금 파일에 있는 내용 → Supabase 에 옮겨 담는 명령문(supabase/seed.local.sql) 만들기
// 전화번호·이메일·계좌가 들어가므로 결과 파일은 공개 저장소에 올리지 않는다(.gitignore)
// 사용: npm run seed  →  만들어진 파일 내용을 Supabase SQL Editor 에 붙여 넣고 Run
// 주의: 다시 실행하면 관리자 화면에서 고친 멤버·설정을 이 파일 내용으로 덮어쓴다 (처음 한 번용)
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";

// .env.local 읽기 (data.js 가 계좌를 환경변수에서 읽으므로 import 전에)
const env = {};
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
}
Object.assign(process.env, env);

const { chapter, about, powerTeams, members, invite, links, education, rpsSheet } = await import("../lib/data.js");
const readJson = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {});
const cards = readJson("lib/cards.json");
const contacts = readJson("lib/contacts.local.json");
const { _source, ...leadership } = readJson("lib/leadership.json");

const q = (v) => (v == null || v === "" ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => `$json$${JSON.stringify(v)}$json$::jsonb`;

const guests = leadership.groups
  .flatMap((g) => g.people)
  .filter((p) => !members.some((m) => m.name === p.name))
  .map((p) => ({ name: p.name, company: p.company, specialty: p.specialty ?? p.role, team: null, leaderOnly: true }));

const rows = [...members, ...guests].map((m, i) => {
  const c = contacts[m.name] ?? {};
  return `  (${[q(m.name), q(m.company), q(m.specialty), q(m.team), q(c.phone), q(c.phone2), q(c.email), q(cards[m.name]?.file), (i + 1) * 10, m.leaderOnly ? "true" : "false"].join(", ")})`;
});

const settings = {
  chapter,
  about,
  power_teams: powerTeams,
  invite,
  links,
  education,
  rps_sheet: rpsSheet,
  leadership,
};

const sql = `-- BNI 토파즈 첫 데이터 (scripts/make-seed.mjs 가 ${new Date().toISOString().slice(0, 10)} 에 만듦)
-- schema.sql 을 먼저 실행한 뒤, 이 내용을 SQL Editor 에 붙여 넣고 Run

-- 첫 관리자
insert into public.admins (email) values (${q(env.ADMIN_EMAIL || "topazchapter0826@gmail.com")})
on conflict (email) do nothing;

-- 표 칸 추가 (지역 서포트 팀용)
alter table public.members add column if not exists leader_only boolean not null default false;
alter table public.members add column if not exists face text;

-- 멤버 ${members.length}명 + 지역 서포트 팀 ${guests.length}명
insert into public.members (name, company, specialty, team, phone, phone2, email, card, sort, leader_only) values
${rows.join(",\n")}
on conflict (name) do update set
  company = excluded.company, specialty = excluded.specialty, team = excluded.team,
  phone = excluded.phone, phone2 = excluded.phone2, email = excluded.email,
  card = excluded.card, sort = excluded.sort, leader_only = excluded.leader_only;

-- 사이트 설정
insert into public.settings (key, value) values
${Object.entries(settings).map(([k, v]) => `  (${q(k)}, ${j(v)})`).join(",\n")}
on conflict (key) do update set value = excluded.value;

-- 확인용: 아래 결과에 멤버 수·설정 수가 나오면 성공
select (select count(*) from public.members where not leader_only) as 멤버, (select count(*) from public.members where leader_only) as 지역서포트팀, (select count(*) from public.settings) as 설정, (select count(*) from public.admins) as 관리자;
`;

mkdirSync("supabase", { recursive: true });
writeFileSync("supabase/seed.local.sql", sql);
console.log(`supabase/seed.local.sql 만듦 — 멤버 ${members.length}명, 설정 ${Object.keys(settings).length}개, 연락처 ${Object.keys(contacts).filter((k) => k !== "_source").length}명`);
