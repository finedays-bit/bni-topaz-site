// 명함에서 얼굴 사진 만들기 (브라우저에서 실행) — scripts/make-faces.py 와 같은 방식
// 1) 명함의 밝은 파란 곡선을 흰색으로  2) 오른쪽 위에서 머리 꼭대기·가로 위치를 찾아 가운데로
// 3) 정사각형으로 자르고, 몸과 이어지지 않은 글자·로고는 지운다
// adjust: { dx, dy, zoom } — '다시 맞추기'용 (dx·dy 는 명함 폭 대비 비율, zoom 1 = 기본)
const SIZE = 400;
const SIDE = 0.4;

export async function loadBitmap(src) {
  const blob = src instanceof Blob ? src : await (await fetch(src)).blob();
  return createImageBitmap(blob);
}

export function cropFace(bitmap, adjust = {}) {
  const { dx = 0, dy = 0, zoom = 1 } = adjust;
  const W = bitmap.width, H = bitmap.height;
  const c = new OffscreenCanvas(W, H);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const clip = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  // 1) 파란 곡선 지우기 — 어두운 남색 정장은 그대로
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const blue = clip((b - r - 20) / 35) * clip((b - 120) / 40);
    if (blue > 0) {
      d[i] = r + (255 - r) * blue;
      d[i + 1] = g + (255 - g) * blue;
      d[i + 2] = b + (255 - b) * blue;
    }
  }
  ctx.putImageData(img, 0, 0);

  // 2) 머리 찾기 (맨 위 BNI 로고 줄, 빨간 글자 제외)
  const x0 = Math.floor(W * 0.45), y0 = Math.floor(H * 0.075), y1 = Math.floor(H * 0.55);
  const isPerson = (x, y) => {
    const i = (y * W + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
    return Math.min(r, g, b) < 215 && !(r - g > 60 && r - b > 60);
  };
  let top = -1;
  for (let y = y0; y < y1 && top < 0; y++) {
    let n = 0;
    for (let x = x0; x < W; x++) if (isPerson(x, y)) n++;
    if (n > W * 0.04) top = y;
  }
  if (top < 0) top = Math.floor(H * 0.12);
  const xs = [];
  const band = Math.floor(W * 0.14);
  for (let y = top; y < Math.min(top + band, H); y++)
    for (let x = x0; x < W; x++) if (isPerson(x, y)) xs.push(x);
  xs.sort((a, b) => a - b);
  const cx = (xs.length ? xs[Math.floor(xs.length / 2)] : W * 0.79) + dx * W;
  const side = W * SIDE / zoom;
  const cy = top + side * 0.4 + dy * W;

  // 3) 정사각형으로 자르기 (명함 밖은 흰색)
  const out = new OffscreenCanvas(SIZE, SIZE);
  const o = out.getContext("2d", { willReadFrequently: true });
  o.fillStyle = "#fff";
  o.fillRect(0, 0, SIZE, SIZE);
  o.drawImage(c, cx - side / 2, cy - side / 2, side, side, 0, 0, SIZE, SIZE);

  // 몸(아래 끝)과 이어진 덩어리만 남기고 나머지(글자·로고 조각)는 흰색으로
  const f = o.getImageData(0, 0, SIZE, SIZE);
  const p = f.data;
  const solid = new Uint8Array(SIZE * SIZE);
  for (let k = 0; k < SIZE * SIZE; k++) solid[k] = Math.min(p[k * 4], p[k * 4 + 1], p[k * 4 + 2]) < 235 ? 1 : 0;
  const grown = dilate(solid, SIZE, 3);
  const keep = new Uint8Array(SIZE * SIZE);
  const stack = [];
  for (let x = 0; x < SIZE; x++) {
    const k = (SIZE - 1) * SIZE + x;
    if (grown[k] && !keep[k]) { keep[k] = 1; stack.push(k); }
  }
  while (stack.length) {
    const k = stack.pop(), x = k % SIZE, y = (k / SIZE) | 0;
    for (let yy = y - 1; yy <= y + 1; yy++)
      for (let xx = x - 1; xx <= x + 1; xx++) {
        if (xx < 0 || yy < 0 || xx >= SIZE || yy >= SIZE) continue;
        const n = yy * SIZE + xx;
        if (grown[n] && !keep[n]) { keep[n] = 1; stack.push(n); }
      }
  }
  for (let k = 0; k < SIZE * SIZE; k++)
    if (!keep[k]) { p[k * 4] = p[k * 4 + 1] = p[k * 4 + 2] = 255; }
  o.putImageData(f, 0, 0);
  return out.convertToBlob({ type: "image/jpeg", quality: 0.88 });
}

// 누끼(배경 투명) 인물 사진에서 얼굴 자르기 — 명함보다 선명하다
// 머리 꼭대기부터 내려가며 가로 폭을 재고, 내려온 깊이가 폭의 1.1배가 되는 곳(턱 근처)의 폭을 머리 폭으로 본다
export function cropFaceFromCutout(bitmap, adjust = {}) {
  const { dx = 0, dy = 0, zoom = 1 } = adjust;
  const W = bitmap.width, H = bitmap.height;
  const c = new OffscreenCanvas(W, H);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  const a = ctx.getImageData(0, 0, W, H).data;
  const span = (y) => {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (a[(y * W + x) * 4 + 3] > 100) { if (l < 0) l = x; r = x; }
    return l < 0 ? null : [l, r];
  };
  let top = 0;
  while (top < H && !span(top)) top++;
  let headW = W * 0.3, cx = W / 2, widest = 0;
  for (let y = top; y < H; y++) {
    const s = span(y);
    if (!s) continue;
    if (s[1] - s[0] > widest) { widest = s[1] - s[0]; cx = (s[0] + s[1]) / 2; }
    if (y - top > 20 && y - top >= 1.1 * widest) { headW = widest; break; }
  }
  const side = headW * 2.1 / zoom;
  const x = cx - side / 2 + dx * side, y = top - side * 0.14 + dy * side;
  const out = new OffscreenCanvas(SIZE, SIZE);
  const o = out.getContext("2d");
  o.fillStyle = "#fff";
  o.fillRect(0, 0, SIZE, SIZE);
  o.drawImage(bitmap, x, y, side, side, 0, 0, SIZE, SIZE);
  return out.convertToBlob({ type: "image/jpeg", quality: 0.88 });
}

// 사각형 r 만큼 넓히기 (가로·세로 나눠서)
function dilate(m, n, r) {
  const a = new Uint8Array(m.length), b = new Uint8Array(m.length);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let v = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(n - 1, x + r) && !v; k++) v = m[y * n + k];
      a[y * n + x] = v;
    }
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++) {
      let v = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(n - 1, y + r) && !v; k++) v = a[k * n + x];
      b[y * n + x] = v;
    }
  return b;
}
