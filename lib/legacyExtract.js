// 기존 완성 명함에서 인물·로고 꺼내기 (원본 사진·로고가 없을 때 쓰는 비상용)
// 인물: 오른쪽 부분을 잘라 배경 지우기(인공지능) → 누끼
// 로고: 왼쪽 칸에서 구분선 바로 위 덩어리를 찾아 자름 (흰 바탕 그대로 — 명함에 곱하기로 합성되어 경계가 안 보임)
import { removePersonBg } from "./bgRemove";

const W = 1240, H = 1754;

async function cardCanvas(src) {
  const blob = src instanceof Blob ? src : await (await fetch(src)).blob();
  const bmp = await createImageBitmap(blob);
  const c = new OffscreenCanvas(W, H);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, W, H);
  return { c, ctx, scale: bmp.width / W, bmp };
}

export async function extractPerson(src, onProgress) {
  const { bmp, scale } = await cardCanvas(src);
  // 위 띠(TOPAZ·BNI) 아래, 가운데보다 조금 왼쪽부터 오른쪽 끝까지
  const x0 = Math.round(W * 0.42 * scale), y0 = Math.round(135 * scale);
  const part = new OffscreenCanvas(bmp.width - x0, bmp.height - y0);
  part.getContext("2d").drawImage(bmp, -x0, -y0);
  return removePersonBg(await part.convertToBlob({ type: "image/png" }), onProgress);
}

export async function findLogoBox(src) {
  const { ctx } = await cardCanvas(src);
  const d = ctx.getImageData(0, 0, W, H).data;
  const at = (x, y) => (y * W + x) * 4;
  const X0 = 40, X1 = 545; // 파란 원이 들어오지 않는 왼쪽 칸

  // 구분선: 왼쪽 칸을 가장 길게 가로지르는 파란 선 (파란 로고와 헷갈리지 않게 '가장 긴 줄')
  let divider = -1, most = 300;
  for (let y = 1150; y < 1700; y++) {
    let n = 0;
    for (let x = 61; x < 518; x++) { const i = at(x, y); if (d[i + 2] - d[i] > 30 && d[i] < 160) n++; }
    if (n > most) { most = n; divider = y; }
  }
  if (divider < 0) return null;

  // 글자·로고 칸 (500 ~ 구분선 위). 오른쪽 끝에 닿는 덩어리(팔·파란 원)는 지운다
  const Y0 = 500, Y1 = divider - 6, w = X1 - X0, h = Y1 - Y0;
  const ink = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = at(X0 + x, Y0 + y);
    ink[y * w + x] = Math.min(d[i], d[i + 1], d[i + 2]) < 215 ? 1 : 0;
  }
  const stack = [];
  for (let y = 0; y < h; y++) if (ink[y * w + w - 1]) { ink[y * w + w - 1] = 0; stack.push(y * w + w - 1); }
  while (stack.length) {
    const k = stack.pop(), x = k % w, y = (k / w) | 0;
    for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) {
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const n = yy * w + xx;
      if (ink[n]) { ink[n] = 0; stack.push(n); }
    }
  }
  const rowHas = (y) => { for (let x = 0; x < w; x++) if (ink[y * w + x]) return true; return false; };

  // 구분선 위로 올라가며 첫 덩어리(로고)를 찾는다 — 빈 줄이 maxGap 을 넘으면 덩어리 끝
  let y = h - 1;
  while (y > 100 && !rowHas(y)) y--;
  const bottom = y;
  if (h - bottom > 150) return null; // 구분선 바로 위가 비어 있으면 로고 없는 명함 (잡힌 건 강점 글자)
  const blockTop = (maxGap) => {
    let gap = 0, t = bottom;
    for (let yy = bottom; yy > 0; yy--) {
      if (rowHas(yy)) { t = yy; gap = 0; } else if (++gap > maxGap) break;
    }
    // 줄이 4개 이상 쌓여 있으면 로고가 아니라 글자 묶음까지 딸려 온 것
    let runs = 0, blank = 99;
    for (let yy = t; yy <= bottom; yy++) {
      if (rowHas(yy)) { if (blank >= 8) runs++; blank = 0; } else blank++;
    }
    return runs >= 4 ? -1 : t;
  };
  // 넓게(별·글자가 떨어진 로고) 먼저, 강점 글자가 딸려 오면 좁게
  let top = blockTop(40);
  if (top < 0) top = blockTop(25);
  if (top < 0 || bottom - top < 25) return null;
  let left = w, right = 0;
  for (y = top; y <= bottom; y++) for (let x = 0; x < w; x++) if (ink[y * w + x]) { if (x < left) left = x; if (x > right) right = x; }
  // 낮은 한 줄이 파란 체크 표시로 시작하면 강점 글자 (로고 없는 명함)
  if (bottom - top < 50) {
    let n = 0, blue = 0;
    for (y = top; y <= bottom; y++) for (let x = left; x < left + 30; x++) {
      if (!ink[y * w + x]) continue;
      n++;
      const i = at(X0 + x, Y0 + y);
      if (d[i + 2] - d[i] > 80) blue++;
    }
    if (n && blue / n > 0.6) return null;
  }
  left += X0; right += X0;
  const pad = 10;
  return { x: Math.max(0, left - pad), y: Y0 + top - pad, w: right - left + pad * 2, h: bottom - top + pad * 2 };
}

export async function extractLogo(src) {
  const box = await findLogoBox(src);
  if (!box) return null;
  const { bmp, scale } = await cardCanvas(src);
  const out = new OffscreenCanvas(Math.round(box.w * scale), Math.round(box.h * scale));
  const o = out.getContext("2d");
  o.fillStyle = "#fff";
  o.fillRect(0, 0, out.width, out.height);
  o.drawImage(bmp, box.x * scale, box.y * scale, out.width, out.height, 0, 0, out.width, out.height);
  return new File([await out.convertToBlob({ type: "image/png" })], "logo.png", { type: "image/png" });
}
