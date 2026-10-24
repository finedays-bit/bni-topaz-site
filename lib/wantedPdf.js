// 성장코디 '전문분야 분석' PDF 읽기 (브라우저에서 실행 — 파일은 밖으로 나가지 않는다)
// 카드마다 "01 사업용 부동산 중개" 제목 줄과, 그 아래 "전략 제안 / 상가·사무실·공장 임대차" 설명 줄이 있다
// 카드가 두 칸으로 나란히 있어서, 같은 높이의 글자도 왼쪽·오른쪽 칸을 나눠서 읽는다
export async function readWantedPdf(file) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

  const segs = []; // { page, x, y, text }
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const width = page.getViewport({ scale: 1 }).width;
    const items = (await page.getTextContent()).items.filter((it) => it.str.trim());
    // 같은 줄(높이 차 3 이내) 끼리 모으고, 글자 사이가 크게 벌어지면 다른 칸으로 끊는다
    items.sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
    let cur = null;
    for (const it of items) {
      const x = it.transform[4], y = it.transform[5];
      if (cur && Math.abs(cur.y - y) < 3 && x - cur.end < 25) {
        cur.text += (x - cur.end > 1.5 ? " " : "") + it.str;
        cur.end = x + it.width;
      } else {
        cur = { page: p, x, y, end: x + it.width, text: it.str, col: x < width / 2 ? 0 : 1 };
        segs.push(cur);
      }
    }
  }
  const clean = (s) => s.replace(/\s+/g, " ").trim();

  const fields = [];
  segs.forEach((s, i) => {
    const m = clean(s.text).match(/^0?(\d{1,2})\s+(.{2,40})$/);
    if (!m) return;
    // 같은 쪽·같은 칸에서 바로 아래 줄이 설명
    const next = segs.slice(i + 1).find((t) => t.page === s.page && t.col === s.col && t.y < s.y);
    const sub = next ? clean(next.text) : "";
    let desc = sub.includes("/") ? sub.split("/").slice(1).join("/").trim() : "";
    if (/RPS|희망/.test(desc)) desc = ""; // "○○○ RPS 희망 분야"처럼 멤버 이름이 든 설명은 내부용이라 비운다
    fields.push({ no: Number(m[1]), name: m[2].trim(), desc });
  });
  fields.sort((a, b) => a.no - b.no);

  const all = clean(segs.map((s) => s.text).join(" "));
  const date = all.match(/작성일\s*(\d{4}[.\-]\d{1,2}[.\-]\d{1,2})/)?.[1] ?? "";
  const author = all.match(/작성\s+(성장코디\s*\S+)/)?.[1] ?? "";
  // 표 아래 '공석 후보로 유지'처럼 덧붙인 분야 (예: "두피·탈모관리와 운동지도·PT는 공석 후보로 유지")
  const extra = all.match(/([^.]{2,40}?)는 공석 후보/)?.[1]
    ?.split(/(?:와|과|,)\s+/).map((s) => s.trim()).filter((s) => s.length > 1) ?? [];

  return { fields: fields.map(({ name, desc }) => ({ name, desc })), extra, source: [author, date].filter(Boolean).join(" · ") };
}
