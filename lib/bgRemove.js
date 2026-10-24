// 배경 지우기 (브라우저에서 실행 — 사진은 밖으로 나가지 않는다)
// 인물: 인공지능(@imgly/background-removal)으로 사람만 남김. 처음 한 번 판별 프로그램(약 40MB)을 받는다
// 로고: 테두리 색과 비슷한 색을 바깥쪽부터 지움 (단색 배경용, 프로그램 받을 필요 없음)

const toBlob = async (src) => (src instanceof Blob ? src : (await fetch(src)).blob());

export async function removePersonBg(src, onProgress) {
  const { removeBackground } = await import("@imgly/background-removal");
  const blob = await removeBackground(await toBlob(src), {
    output: { format: "image/png" },
    progress: (key, current, total) => onProgress?.(key.startsWith("fetch") ? `처음 한 번 준비 중… ${Math.round((current / total) * 100)}%` : "배경 지우는 중…"),
  });
  return new File([blob], "cutout.png", { type: "image/png" });
}

export async function removeLogoBg(src) {
  const bmp = await createImageBitmap(await toBlob(src));
  const W = bmp.width, H = bmp.height;
  const c = new OffscreenCanvas(W, H);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0);
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;

  // 배경색 = 테두리 픽셀 색의 가운데값
  const border = [];
  for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
  const mid = (k) => border.map((i) => d[i * 4 + k]).sort((a, b) => a - b)[border.length >> 1];
  const bg = [mid(0), mid(1), mid(2)];
  const dist = (i) => Math.hypot(d[i * 4] - bg[0], d[i * 4 + 1] - bg[1], d[i * 4 + 2] - bg[2]);

  // 테두리에서 이어진 비슷한 색만 지운다 (로고 안쪽의 같은 색은 남김). 경계는 부드럽게
  const NEAR = 40, FAR = 90;
  const seen = new Uint8Array(W * H);
  const stack = border.filter((i) => dist(i) < FAR);
  stack.forEach((i) => (seen[i] = 1));
  while (stack.length) {
    const i = stack.pop(), x = i % W, y = (i / W) | 0;
    const t = dist(i);
    d[i * 4 + 3] = Math.round(d[i * 4 + 3] * Math.min(1, Math.max(0, (t - NEAR) / (FAR - NEAR))));
    if (t >= NEAR) continue; // 경계 픽셀에서는 더 퍼지지 않는다
    for (const n of [x > 0 && i - 1, x < W - 1 && i + 1, y > 0 && i - W, y < H - 1 && i + W]) {
      if (n === false || seen[n]) continue;
      seen[n] = 1;
      if (dist(n) < FAR) stack.push(n);
    }
  }
  ctx.putImageData(img, 0, 0);
  return new File([await c.convertToBlob({ type: "image/png" })], "logo.png", { type: "image/png" });
}
