// 이미지명함 폴더 → public/cards 복사 + lib/cards.json(이름 → 파일) 생성
// 파일명 규칙: "회사명 이름.jpg" — 마지막 띄어쓰기 뒤가 이름
//   지역 서포트 팀(멤버 아님)은 "이름 직책_토파즈.png" — 첫 단어가 이름 (토파즈 틀로 새로 만든 명함만 사용)
// 사용: npm run cards [-- "명함 폴더 경로"]
// 2단계부터는 관리자 페이지 업로드가 이 일을 대신한다.
import { readdirSync, mkdirSync, rmSync, copyFileSync, writeFileSync, readFileSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { members } from "../lib/data.js";

const SRC =
  process.argv[2] ||
  "C:/Users/kimgo/Documents/finedays-workspace/20-operations/2B-BNI-토파즈/이미지명함";
const OUT = "public/cards";
const leaders = JSON.parse(readFileSync("lib/leadership.json", "utf8")).groups.flatMap((g) => g.people);
const IMG = new Set([".jpg", ".jpeg", ".png", ".webp"]);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const cards = {};
const skipped = [];
for (const file of readdirSync(SRC)) {
  const ext = extname(file).toLowerCase();
  if (!IMG.has(ext)) continue;
  const stem = basename(file, extname(file)).trim();
  if (stem.endsWith("_토파즈")) {
    const name = stem.split(" ")[0];
    const leader = leaders.find((p) => p.name === name);
    if (!leader || members.some((m) => m.name === name)) { skipped.push(file); continue; }
    const out = `${name}${ext}`;
    copyFileSync(join(SRC, file), join(OUT, out));
    cards[name] = { file: out, company: leader.company ?? "" };
    continue;
  }
  const cut = stem.lastIndexOf(" ");
  if (cut < 0) { skipped.push(file); continue; }
  const name = stem.slice(cut + 1);
  const company = stem.slice(0, cut).trim();
  if (!members.some((m) => m.name === name)) { skipped.push(file); continue; }
  const out = `${name}${ext}`;
  copyFileSync(join(SRC, file), join(OUT, out));
  cards[name] = { file: out, company };
}

writeFileSync("lib/cards.json", JSON.stringify(cards, null, 2) + "\n");

const missing = members.filter((m) => !cards[m.name]).map((m) => m.name);
console.log(`연결됨 ${Object.keys(cards).length}명 / 멤버 ${members.length}명`);
if (missing.length) console.log(`명함 없음: ${missing.join(", ")}`);
if (skipped.length) console.log(`멤버 명단에 없어 건너뜀: ${skipped.join(", ")}`);
