"use client";

import { useState } from "react";
import { Field, SaveBar, useSetting } from "./shared";
import { wanted as wantedDefaults } from "@/lib/data";
import { readWantedPdf } from "@/lib/wantedPdf";

// 한 칸 고치기 · 순서 바꾸기
const patch = (arr, i, v) => arr.map((x, j) => (j === i ? { ...x, ...v } : x));
const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const a = [...arr];
  [a[i], a[j]] = [a[j], a[i]];
  return a;
};
const same = (a, b) => a.name.replace(/\s/g, "") === b.name.replace(/\s/g, "");

// ── 찾는 분야 ──────────────────────────────────────────────
// 성장코디 PDF를 올리면 01~06 분야를 읽어 앞 5개는 '최우선', 나머지는 '추가로 찾는 분야'로 채운다
// 비지터가 오시면 그 분야를 '추가로 찾는 분야'에 넣고 저장
export default function WantedTab() {
  const { value: v, setValue, save, status } = useSetting("wanted", wantedDefaults);
  const [pdfMsg, setPdfMsg] = useState("");
  if (!v) return <section className="adm-panel"><p className="muted">{status || "불러오는 중…"}</p></section>;
  const top = v.top ?? [], also = v.also ?? [];
  const set = (k, arr) => setValue({ ...v, [k]: arr });

  async function pickPdf(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setPdfMsg("PDF 읽는 중…");
    try {
      const r = await readWantedPdf(file);
      if (!r.fields.length) return setPdfMsg("PDF에서 '01 분야명' 형태의 제목을 찾지 못했습니다. 직접 입력해 주세요.");
      const nextTop = r.fields.slice(0, 5);
      const fromPdf = [...r.fields.slice(5), ...r.extra.map((name) => ({ name, desc: "" }))];
      // 전에 넣어 둔 '추가로 찾는 분야'(비지터 분야 등)는 남기고, 겹치는 것은 뺀다
      const kept = also.filter((a) => ![...nextTop, ...fromPdf].some((b) => same(a, b)));
      setValue({ ...v, top: nextTop, also: [...fromPdf, ...kept], source: r.source || v.source });
      setPdfMsg(`PDF에서 ${r.fields.length}개 분야를 읽었습니다${r.extra.length ? ` (+ 공석 후보 ${r.extra.length}개)` : ""}. 확인 후 '저장'을 눌러 주세요.`);
    } catch (err) {
      setPdfMsg(`PDF 읽기 실패: ${err.message}`);
    }
  }

  // 입력칸이 매번 새로 만들어지지 않게 컴포넌트가 아닌 함수로 그린다
  const row = (k, arr, i, item) => (
    <div key={`${k}${i}`} className="adm-person adm-wanted">
      <input value={item.name} placeholder="분야 이름" onChange={(e) => set(k, patch(arr, i, { name: e.target.value }))} />
      <input value={item.desc} placeholder="한 줄 설명 (없어도 됨)" onChange={(e) => set(k, patch(arr, i, { desc: e.target.value }))} />
      <button className="adm-btn" onClick={() => set(k, move(arr, i, -1))}>↑</button>
      <button className="adm-btn" onClick={() => set(k, move(arr, i, 1))}>↓</button>
      {k === "top"
        ? <button className="adm-btn" onClick={() => setValue({ ...v, top: top.filter((_, j) => j !== i), also: [item, ...also] })}>아래로</button>
        : <button className="adm-btn" disabled={top.length >= 5} onClick={() => setValue({ ...v, top: [...top, item], also: also.filter((_, j) => j !== i) })}>최우선으로</button>}
      <button className="adm-btn adm-danger" onClick={() => set(k, arr.filter((_, j) => j !== i))}>삭제</button>
    </div>
  );

  return (
    <section className="adm-panel">
      <h2>찾는 전문분야</h2>
      <p className="muted">첫 페이지와 '찾는 분야' 페이지에 나옵니다. 사이트에는 분야 이름과 한 줄 설명만 보이고, PDF의 연결 멤버·리퍼럴 예시는 싣지 않습니다.</p>

      <div className="adm-card">
        <b>성장코디 PDF로 채우기</b>
        <input type="file" accept="application/pdf" onChange={pickPdf} />
        <small className="muted">{pdfMsg || "PDF는 이 컴퓨터에서 읽기만 하고 어디에도 올리지 않습니다."}</small>
      </div>
      <Field label="출처 (관리자 기록용 · 사이트에는 안 보임)" value={v.source} onChange={(x) => setValue({ ...v, source: x })} placeholder="성장코디 신현준 · 2026.10.16" />

      <h3>최우선으로 찾는 5개 분야 <small className="muted">({top.length}/5)</small></h3>
      {top.map((item, i) => row("top", top, i, item))}
      {top.length < 5 && <button className="adm-btn" onClick={() => set("top", [...top, { name: "", desc: "" }])}>+ 최우선 분야 추가</button>}

      <h3>추가로 찾는 분야</h3>
      <p className="muted">비지터가 오시면 그 분이 속한 공석 분야를 여기에 넣어 주세요 (대본: "특히 비지터가 속한 공석 분야는 꼭 포함").</p>
      {also.map((item, i) => row("also", also, i, item))}
      <button className="adm-btn" onClick={() => set("also", [...also, { name: "", desc: "" }])}>+ 분야 추가</button>

      <SaveBar onSave={() => save({ ...v, top: top.filter((x) => x.name.trim()), also: also.filter((x) => x.name.trim()) })} status={status} />
    </section>
  );
}
