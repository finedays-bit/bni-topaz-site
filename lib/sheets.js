// 구글 시트(CSV) 읽기 — 10분마다 새로 읽는다
export async function fetchCsv(url) {
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`시트를 읽지 못했습니다 (${res.status})`);
  return parseCsv(await res.text());
}

// 따옴표 안의 쉼표·줄바꿈까지 처리하는 CSV 해석
export function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// 챕터 RPI: 시트와 같은 계산 — 리퍼럴 파트너 지수 = 멤버별 '총 R파트너 수'(수익 단계 파트너) 합 ÷ 멤버 수
// 참여 = 전문분야·나의 핵심 고객층을 모두 입력한 멤버 (오렌지 챕터 기준)
// names(사이트 멤버 명단)를 주면 그 명단 기준으로 센다 — 시트에 없는 멤버는 파트너 0·미참여, 명단에 없는 사람은 제외
export async function fetchRpi(url, names) {
  const rows = await fetchCsv(url);
  const head = rows[0].map((h) => h.trim());
  const col = (name) => head.indexOf(name);
  const [cName, cField, cCore, cTotal] = [col("멤버명"), col("전문분야"), col("나의 핵심 고객층"), col("총 R파트너 수")];
  const byName = new Map(
    rows.filter((r) => r[cName]?.trim() && r[cName].trim() !== "멤버명").map((r) => [r[cName].trim(), r])
  );
  const list = names || [...byName.keys()];
  let total = 0, joined = 0;
  for (const name of list) {
    const r = byName.get(name);
    if (!r) continue;
    total += Number(r[cTotal]) || 0;
    if (r[cField]?.trim() && r[cCore]?.trim()) joined++;
  }
  return {
    rpi: list.length ? total / list.length : 0,
    joined,
    count: list.length,
  };
}
