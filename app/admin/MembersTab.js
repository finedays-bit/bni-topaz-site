"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { cardSrc } from "@/lib/media";
import { Field, refreshSite, uploadImage } from "./shared";
import { cropFace, loadBitmap } from "@/lib/faceCrop";

const EMPTY = { name: "", company: "", specialty: "", team: "", phone: "", phone2: "", email: "", card: "", face: "", sort: 0, active: true, leader_only: false };
const COLS = Object.keys(EMPTY);

// 멤버·명함: 목록 → 누르면 수정, 명함/얼굴 사진 올리기, 추가·삭제
export default function MembersTab() {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);
  const [status, setStatus] = useState("");
  // 명함에서 자동으로 만든 얼굴 (저장할 때 올린다)
  const [face, setFace] = useState(null); // { blob, url, adj, src }

  async function makeFace(src, adj = { dx: 0, dy: 0, zoom: 1 }) {
    try {
      const blob = await cropFace(await loadBitmap(src), adj);
      setFace((old) => {
        if (old?.url) URL.revokeObjectURL(old.url);
        return { blob, url: URL.createObjectURL(blob), adj, src };
      });
    } catch (err) {
      setStatus(`얼굴 만들기 실패: ${err.message}`);
    }
  }
  const nudge = (k, v) => face && makeFace(face.src, { ...face.adj, [k]: +(face.adj[k] + v).toFixed(3) });
  const close = () => { setEdit(null); setFace(null); };

  async function load() {
    const { data, error } = await sb.from("members").select("*").order("sort").order("id");
    if (error) return setStatus(`불러오지 못했습니다: ${error.message}`);
    setRows(data);
  }
  useEffect(() => { load(); }, []);

  const set = (k) => (v) => setEdit((e) => ({ ...e, [k]: v }));

  async function save() {
    if (!edit.name.trim()) return setStatus("이름을 넣어 주세요.");
    setStatus("저장 중…");
    if (face?.blob) {
      try { edit.face = await uploadImage("faces", face.blob, "face"); }
      catch (err) { return setStatus(`얼굴 사진 올리기 실패: ${err.message}`); }
    }
    const body = Object.fromEntries(COLS.map((k) => [k, edit[k] === "" ? null : edit[k]]));
    body.name = edit.name.trim();
    body.company = edit.company ?? "";
    body.specialty = edit.specialty ?? "";
    body.sort = Number(edit.sort) || 0;
    const q = edit.id ? sb.from("members").update(body).eq("id", edit.id) : sb.from("members").insert(body);
    const { error } = await q;
    if (error) return setStatus(`저장 실패: ${error.message}`);
    await refreshSite();
    setStatus(`${body.name} 저장했습니다.`);
    close();
    load();
  }

  async function remove() {
    if (!confirm(`${edit.name} 님을 삭제할까요? 되돌릴 수 없습니다. (잠시 숨기려면 '사이트에 표시'를 끄세요)`)) return;
    const { error } = await sb.from("members").delete().eq("id", edit.id);
    if (error) return setStatus(`삭제 실패: ${error.message}`);
    await refreshSite();
    setStatus(`${edit.name} 삭제했습니다.`);
    close();
    load();
  }

  async function upload(bucket, key, file) {
    if (!file) return;
    setStatus("사진 올리는 중…");
    try {
      const url = await uploadImage(bucket, file, bucket === "cards" ? "card" : "face");
      setEdit((e) => ({ ...e, [key]: url }));
      if (bucket === "cards") {
        await makeFace(file);
        setStatus("명함을 올리고 얼굴을 자동으로 만들었습니다. 확인 후 '저장'을 눌러 주세요.");
      } else {
        setFace(null);
        setStatus("얼굴 사진을 올렸습니다. '저장'을 눌러야 반영됩니다.");
      }
    } catch (err) {
      setStatus(`사진 올리기 실패: ${err.message}`);
    }
  }

  if (edit)
    return (
      <section className="adm-panel">
        <h2>{edit.id ? `${edit.name} 수정` : "새 멤버 추가"}</h2>
        <div className="adm-grid">
          <Field label="이름 *" value={edit.name} onChange={set("name")} />
          <Field label="회사명" value={edit.company} onChange={set("company")} />
          <Field label="전문분야" value={edit.specialty} onChange={set("specialty")} />
          <Field label="휴대폰" value={edit.phone} onChange={set("phone")} placeholder="010-0000-0000" />
          <Field label="휴대폰 2 (있으면)" value={edit.phone2} onChange={set("phone2")} />
          <Field label="이메일" value={edit.email} onChange={set("email")} type="email" />
          <Field label="파워팀 (pt1~pt5, 없으면 비움)" value={edit.team} onChange={set("team")} />
          <Field label="순서 (작을수록 앞)" value={edit.sort} onChange={set("sort")} type="number" />
        </div>
        <div className="adm-checks">
          <label><input type="checkbox" checked={edit.active} onChange={(e) => set("active")(e.target.checked)} /> 사이트에 표시</label>
          <label><input type="checkbox" checked={edit.leader_only} onChange={(e) => set("leader_only")(e.target.checked)} /> 멤버 아님 (디렉터·앰배서더 등, 리더십팀에만 표시)</label>
        </div>
        <div className="adm-photos">
          <div>
            <b>이미지 명함</b>
            {edit.card ? <img src={cardSrc(edit.card)} alt="" /> : <p className="muted">없음</p>}
            <input type="file" accept="image/*" onChange={(e) => upload("cards", "card", e.target.files[0])} />
          </div>
          <div>
            <b>리더십팀 얼굴 사진</b>
            {face ? <img className="adm-face" src={face.url} alt="" />
              : edit.face ? <img className="adm-face" src={edit.face} alt="" />
              : <p className="muted">없음</p>}
            {face && (
              <div className="adm-nudge">
                <small>자동으로 만든 얼굴입니다. 어긋나면 맞춰 주세요.</small>
                <div>
                  <button className="adm-btn" onClick={() => nudge("dx", -0.02)}>←</button>
                  <button className="adm-btn" onClick={() => nudge("dx", 0.02)}>→</button>
                  <button className="adm-btn" onClick={() => nudge("dy", -0.02)}>↑</button>
                  <button className="adm-btn" onClick={() => nudge("dy", 0.02)}>↓</button>
                  <button className="adm-btn" onClick={() => nudge("zoom", 0.1)}>확대</button>
                  <button className="adm-btn" onClick={() => nudge("zoom", -0.1)}>축소</button>
                </div>
              </div>
            )}
            {edit.card && !face && (
              <button className="adm-btn" onClick={() => makeFace(cardSrc(edit.card))}>명함에서 얼굴 자동으로 만들기</button>
            )}
            <small className="muted">또는 직접 올리기 (정사각형 사진)</small>
            <input type="file" accept="image/*" onChange={(e) => upload("faces", "face", e.target.files[0])} />
          </div>
        </div>
        <div className="adm-save">
          <button className="btn btn-main" onClick={save}>저장</button>
          <button className="adm-btn" onClick={() => { close(); setStatus(""); }}>취소</button>
          {edit.id && <button className="adm-btn adm-danger" onClick={remove}>삭제</button>}
          {status && <span className="adm-msg">{status}</span>}
        </div>
      </section>
    );

  return (
    <section className="adm-panel">
      <div className="adm-row">
        <h2>멤버 {rows.filter((r) => !r.leader_only).length}명 · 지역 서포트 팀 {rows.filter((r) => r.leader_only).length}명</h2>
        <button className="btn btn-main" onClick={() => setEdit({ ...EMPTY, sort: (rows.at(-1)?.sort ?? 0) + 10 })}>+ 멤버 추가</button>
      </div>
      {status && <p className="adm-msg">{status}</p>}
      <table className="adm-table">
        <thead><tr><th>명함</th><th>이름</th><th>회사 · 전문분야</th><th>연락처</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.active ? "" : "adm-off"} onClick={() => setEdit({ ...EMPTY, ...r })}>
              <td>{r.card ? <img src={cardSrc(r.card)} alt="" /> : <span className="muted">없음</span>}</td>
              <td><b>{r.name}</b>{r.leader_only && <small className="adm-tag">리더십만</small>}{!r.active && <small className="adm-tag">숨김</small>}</td>
              <td>{r.company}<br /><small className="muted">{r.specialty}</small></td>
              <td><small>{r.phone || "-"}<br />{r.email || "-"}</small></td>
              <td><span className="adm-link">수정</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
