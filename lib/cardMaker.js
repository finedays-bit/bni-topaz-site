// 입력값으로 토파즈 이미지 명함 그리기 (브라우저에서 실행) — scripts/director-cards/만들기.py 규칙을 옮김
// 틀: 1240×1754, 위 띠(TOPAZ Chapter·BNI)는 /brand/card-header.png
// 위쪽(업종 띠→회사명→이름→소개→강점)은 위에서부터, 아래쪽(연락처→구분선)은 바닥에서부터 쌓고
// 로고는 그 사이 가운데. 사진은 오른쪽·아래에 붙이되 글자와 22px 이상 떨어지는 가장 큰 크기로.
export const W = 1240, H = 1754;
const BLUE = "#2B65C9";      // 원형·띠·체크·소개 문구
const ORANGE = "#F47B20";    // 지역 서포트 팀 직함 배지
const INK = "#1B1B1B";
const SUB = "#4A4A4A";       // 강점 보충 줄
const DIVIDER = "#46628C";
const GAP = 22;              // 사진과 글자 사이 최소 간격

// 연락처 순서와 앞 글자
export const CONTACTS = [
  ["M", "휴대폰"], ["T", "전화"], ["F", "팩스"], ["K", "카카오톡"], ["E", "이메일"], ["W", "홈페이지"], ["S", "SNS"], ["A", "주소"],
];

export const EMPTY_CARD = {
  role: "", badge: "", company: "", companySub: "", title: "대표",
  intro: "", introStyle: "blue", bullets: "",
  T: "", F: "", K: "", W: "", S: "", A: "",
};

// 명함에 실제로 들어갈 줄로 정리 (M·E 는 멤버의 휴대폰·이메일 칸을 같이 쓴다)
// 강점: '-' '(' '1.' 로 시작하는 줄은 위 항목 아래 작은 보충 줄
export function cardLines(member, card) {
  const intro = String(card.intro ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const bullets = [];
  for (const raw of String(card.bullets ?? "").split("\n")) {
    const s = raw.trim();
    if (!s) continue;
    if (/^([-·(]|\d+\.)/.test(s) && bullets.length) bullets.at(-1).subs.push(s);
    else if (bullets.length < 8) bullets.push({ text: s, subs: [] });
  }
  const value = { E: member.email, ...card, M: member.phone };
  const contacts = CONTACTS.map(([k]) => [k, String(value[k] ?? "").trim()]).filter(([, v]) => v);
  // 두 번째 휴대폰은 M. 아래 줄에 글자 없이
  if (member.phone2?.trim()) contacts.splice(contacts.findIndex(([k]) => k === "M") + 1, 0, ["", member.phone2.trim()]);
  return { intro, bullets, contacts };
}

let FAMILY = null;
function family() {
  if (!FAMILY) FAMILY = getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim() || "'Noto Sans KR', sans-serif";
  return FAMILY;
}
const font = (size, weight) => `${weight} ${size}px ${family()}`;

// 쓸 글자에 필요한 한글 글꼴 조각을 미리 받아 둔다
async function loadFonts(text) {
  await Promise.all([400, 500, 700].map((w) => document.fonts.load(font(40, w), text || "가")));
}

// 기존 명함들처럼 자간을 글자 크기의 5% 좁힌다 (기본 자간은 글자가 퍼져 흐려 보임)
const TRACKING = -0.05;
function setFont(ctx, f) {
  ctx.font = f;
  ctx.letterSpacing = `${(parseFloat(f.split(" ")[1]) * TRACKING).toFixed(2)}px`;
}

// 잉크 윗선이 top 에 오도록 글자 배치 → 끝 x
function textAt(ctx, x, top, s, f, fill) {
  setFont(ctx, f);
  const m = ctx.measureText(s);
  ctx.fillStyle = fill;
  ctx.fillText(s, x + m.actualBoundingBoxLeft, top + m.actualBoundingBoxAscent);
  return x + m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
}
function widthOf(ctx, s, f) { setFont(ctx, f); return ctx.measureText(s).width; }
// 폭 안에 들어갈 때까지 글자 크기를 줄인다
function fitSize(ctx, lines, size, weight, maxW, min = 18) {
  while (size > min && Math.max(...lines.map((s) => widthOf(ctx, s, font(size, weight)))) > maxW) size--;
  return size;
}

function pill(ctx, x0, y0, x1, y1, color, r) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r);
  ctx.fill();
}

function checkIcon(ctx, cx, cy, r) {
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  const s = 2 * r, x = cx - r, y = cy - r;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = s * 0.13;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + s * 0.27, y + s * 0.52);
  ctx.lineTo(x + s * 0.44, y + s * 0.68);
  ctx.lineTo(x + s * 0.74, y + s * 0.36);
  ctx.stroke();
}

// 긴 주소는 띄어쓰기 기준으로 가운데쯤에서 두 줄로
function splitAddress(ctx, s, maxW) {
  if (widthOf(ctx, s, font(32, 400)) <= maxW) return [s];
  const words = s.split(" ");
  let best = [s], bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const diff = Math.abs(widthOf(ctx, a, font(32, 400)) - widthOf(ctx, b, font(32, 400)));
    if (diff < bestDiff) { bestDiff = diff; best = [a, b]; }
  }
  return best;
}

// 글자 레이어 그리기 → 로고 칸 위치
function drawText(ctx, member, card) {
  const { intro, bullets, contacts } = cardLines(member, card);

  // 직함 배지 (지역 서포트 팀) — TOPAZ Chapter 오른쪽
  if (card.role?.trim()) {
    const f = font(30, 700);
    const rw = widthOf(ctx, card.role, f);
    pill(ctx, 452, 54, 452 + rw + 44, 102, ORANGE, 24);
    textAt(ctx, 474, 65, card.role, f, "#fff");
  }

  // 업종 띠
  if (card.badge?.trim()) {
    const size = fitSize(ctx, [card.badge], 30, 500, 520);
    const bw = widthOf(ctx, card.badge, font(size, 500));
    pill(ctx, 80, 230, 80 + bw + 44, 288, BLUE, 10);
    textAt(ctx, 102, 244 + (30 - size) / 2, card.badge, font(size, 500), "#fff");
  }

  // 회사명
  if (card.company?.trim()) {
    const size = fitSize(ctx, [card.company], 86, 400, 450);
    textAt(ctx, 86, 307 + (86 - size) / 2, card.company, font(size, 400), INK);
  }
  if (card.companySub?.trim()) textAt(ctx, 92, 408, card.companySub, font(fitSize(ctx, [card.companySub], 32, 500, 450), 500), "#3A3A3A");

  // 이름 + 직함
  const nameSize = fitSize(ctx, [member.name || " "], 100, 700, 330);
  const end = textAt(ctx, 88, 472 + (100 - nameSize) * 0.7, member.name || "", font(nameSize, 700), INK);
  if (card.title?.trim()) textAt(ctx, end + 30, 525, card.title, font(40, 500), INK);

  // 아래쪽: 연락처를 바닥에서부터 쌓는다
  ctx.font = font(32, 400);
  const rows = contacts.flatMap(([k, v]) => (k === "A" ? splitAddress(ctx, v, 400) : [v]).map((line, i) => [i || !k ? "" : `${k}.`, line]));
  const step = rows.length > 5 ? 46 : 49;
  const cTop = Math.min(1490, 1740 - rows.length * step);
  rows.forEach(([label, val], i) => {
    const y = cTop + i * step;
    if (label) textAt(ctx, 118 - widthOf(ctx, label, font(32, 700)), y, label, font(32, 700), INK);
    const size = fitSize(ctx, [val], 32, 400, 400);
    textAt(ctx, 131, y + (32 - size) / 2, val, font(size, 400), INK);
  });
  const divider = cTop - 39;
  ctx.strokeStyle = DIVIDER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(61, divider);
  ctx.lineTo(518, divider);
  ctx.stroke();

  // 위쪽: 소개 문구
  let y = 657;
  if (intro.length) {
    const blue = card.introStyle !== "plain";
    const weight = blue ? 700 : 400;
    const size = fitSize(ctx, intro, blue ? 52 : 42, weight, 470);
    intro.forEach((s, i) => textAt(ctx, 86, y + i * size * 1.12, s, font(size, weight), blue ? BLUE : INK));
    y += intro.length * size * 1.12 + 50;
  } else {
    y = 640;
  }

  // 강점 — 로고 칸(최소 110px)이 남도록 줄 간격을 줄인다
  const subCount = bullets.reduce((n, b) => n + b.subs.length, 0);
  const room = divider - 150 - y;
  let line = 70.6, subLine = 44;
  const need = bullets.length * line + subCount * subLine;
  if (need > room && need > 0) { const k = Math.max(0.6, room / need); line *= k; subLine *= k; }
  const bSize = fitSize(ctx, bullets.map((b) => b.text), line < 60 ? 32 : 36, 700, 470);
  for (const b of bullets) {
    checkIcon(ctx, 99, y + bSize * 0.44, 15);
    textAt(ctx, 125, y, b.text, font(bSize, 700), INK);
    let sy = y + bSize + 12;
    for (const s of b.subs) {
      textAt(ctx, 125, sy, s, font(fitSize(ctx, [s], 28, 400, 440), 400), SUB);
      sy += subLine;
    }
    y += line + b.subs.length * subLine;
  }

  // 로고 칸: 강점 끝과 구분선 사이 가운데
  const top = y + 10, bottom = divider - 40;
  return { cx: 280, cy: (top + bottom) / 2, w: 400, h: Math.max(60, Math.min(240, bottom - top)) };
}

// 사진 자리 찾기 — 반 크기 격자에서 글자(+간격)와 겹치지 않는 가장 큰 배율
function placePhoto(photo, textCanvas) {
  const S = 2, w2 = W / S, h2 = H / S, r = Math.round(GAP / S);
  const t = document.createElement("canvas");
  t.width = w2; t.height = h2;
  const tc = t.getContext("2d", { willReadFrequently: true });
  tc.drawImage(textCanvas, 0, 0, w2, h2);
  const a = tc.getImageData(0, 0, w2, h2).data;
  // 글자 마스크를 r 만큼 넓힘 (가로→세로)
  let g = new Uint8Array(w2 * h2);
  for (let i = 0; i < g.length; i++) g[i] = a[i * 4 + 3] > 0 ? 1 : 0;
  const tmp = new Uint8Array(g.length);
  for (let yy = 0; yy < h2; yy++) for (let xx = 0; xx < w2; xx++) {
    let v = 0;
    for (let k = Math.max(0, xx - r); k <= Math.min(w2 - 1, xx + r) && !v; k++) v = g[yy * w2 + k];
    tmp[yy * w2 + xx] = v;
  }
  const guard = new Uint8Array(g.length);
  for (let xx = 0; xx < w2; xx++) for (let yy = 0; yy < h2; yy++) {
    let v = 0;
    for (let k = Math.max(0, yy - r); k <= Math.min(h2 - 1, yy + r) && !v; k++) v = tmp[k * w2 + xx];
    guard[yy * w2 + xx] = v;
  }

  // 사진의 투명하지 않은 부분만 남기기 (위쪽 빈 공간 잘라냄)
  const pc = document.createElement("canvas");
  pc.width = photo.width; pc.height = photo.height;
  const pctx = pc.getContext("2d", { willReadFrequently: true });
  pctx.drawImage(photo, 0, 0);
  const pa = pctx.getImageData(0, 0, pc.width, pc.height).data;
  let top = pc.height, bottom = 0;
  for (let yy = 0; yy < pc.height; yy++) for (let xx = 0; xx < pc.width; xx++)
    if (pa[(yy * pc.width + xx) * 4 + 3] > 30) { if (yy < top) top = yy; bottom = yy; }
  if (bottom < top) { top = 0; bottom = pc.height - 1; }
  const crop = { sx: 0, sy: top, sw: pc.width, sh: bottom - top + 1 };

  const probe = document.createElement("canvas");
  probe.width = w2; probe.height = h2;
  const prc = probe.getContext("2d", { willReadFrequently: true });
  const fits = (s) => {
    const w = crop.sw * s / S, h = crop.sh * s / S;
    prc.clearRect(0, 0, w2, h2);
    prc.drawImage(pc, crop.sx, crop.sy, crop.sw, crop.sh, w2 - w, h2 - h, w, h);
    const d = prc.getImageData(0, 0, w2, h2).data;
    for (let i = 0; i < guard.length; i++) if (guard[i] && d[i * 4 + 3] > 40) return false;
    return true;
  };
  let lo = 0.1, hi = 1584 / crop.sh, s; // hi = 머리 꼭대기 y≈170 (임현식 카드 기준)
  if (fits(hi)) s = hi;
  else {
    for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    s = lo;
  }
  const w = Math.round(crop.sw * s), h = Math.round(crop.sh * s);
  return { src: pc, crop, x: W - w, y: H - h, w, h, scale: s };
}

export async function loadImage(src) {
  if (!src) return null;
  const blob = src instanceof Blob ? src : await (await fetch(src)).blob();
  return createImageBitmap(blob);
}

// 사진 손보기 한도 — 명함 폭 1240px = A4 210mm 기준
export const PX_PER_MM = W / 210;
export const PHOTO_ADJ = { mm: 5, zoomMin: 0.7, zoomMax: 1.3 };
export const NO_ADJ = { dx: 0, dy: 0, zoom: 1 };

// 명함 그리기 → canvas. images: { photo, logo, header } (ImageBitmap)
// 좌표는 1240×1754 기준으로 쓰고, 실제로는 SCALE 배(2480×3508)로 그려 글자를 선명하게 한다
// card.photoAdj = { dx, dy (mm), zoom } — 자동 배치에서 사람이 손본 만큼 (아래·가운데 기준으로 확대·축소)
export const SCALE = 2;
export async function renderCard(canvas, member, card, images) {
  const { photo, logo, header } = images;
  await loadFonts([member.name, ...Object.values(card)].join(""));
  canvas.width = W * SCALE; canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingQuality = "high";

  // 글자는 따로 그려 두었다가 마지막에 올린다 (사진 자리 계산에도 씀)
  const text = document.createElement("canvas");
  text.width = W * SCALE; text.height = H * SCALE;
  const tctx = text.getContext("2d");
  tctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  const logoBox = drawText(tctx, member, card);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(1215, 1113, 658, 0, Math.PI * 2);
  ctx.fill();

  let placed = null;
  if (photo) {
    placed = placePhoto(photo, text);
    const { dx, dy, zoom } = { ...NO_ADJ, ...card.photoAdj };
    const w = placed.w * zoom, h = placed.h * zoom;
    const x = placed.x + (placed.w - w) / 2 + dx * PX_PER_MM;
    const y = placed.y + placed.h - h + dy * PX_PER_MM;
    ctx.drawImage(placed.src, placed.crop.sx, placed.crop.sy, placed.crop.sw, placed.crop.sh, x, y, w, h);
  }
  if (header) ctx.drawImage(header, 0, 0, W, 135);

  // 로고: 흰 바탕이어도 곱하기 합성이라 경계가 안 보인다
  if (logo) {
    const s = Math.min(logoBox.w / logo.width, logoBox.h / logo.height);
    const w = logo.width * s, h = logo.height * s;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(logo, logoBox.cx - w / 2, logoBox.cy - h / 2, w, h);
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.drawImage(text, 0, 0, W, H);
  return { scale: placed?.scale ?? null };
}

// 사진이 배경 없는(투명) 누끼인지 — 네 모서리가 투명하면 누끼로 본다
export function hasTransparentBg(bitmap) {
  const c = document.createElement("canvas");
  c.width = bitmap.width; c.height = bitmap.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  const pts = [[0, 0], [c.width - 1, 0], [0, Math.floor(c.height / 2)], [c.width - 1, Math.floor(c.height / 2)]];
  return pts.every(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3] < 20);
}
