"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { cardSrc } from "@/lib/media";
import { Field, refreshSite, uploadImage } from "./shared";
import { cropFace, cropFaceFromCutout, loadBitmap } from "@/lib/faceCrop";
import { CONTACTS, EMPTY_CARD, hasTransparentBg } from "@/lib/cardMaker";
import CardForm from "./CardForm";

const EMPTY = { name: "", company: "", specialty: "", team: "", phone: "", phone2: "", email: "", card: "", face: "", sort: 0, active: true, leader_only: false, card_data: null };
const COLS = Object.keys(EMPTY);

// 멤버·명함: 목록 → 누르면 수정, 명함/얼굴 사진 올리기, 추가·삭제
export default function MembersTab() {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);
  const [status, setStatus] = useState("");
  // 리더십팀 얼굴 — 인물 사진(누끼) 또는 완성 명함에서 자동으로 자른다 (저장할 때 올린다)
  const [face, setFace] = useState(null); // { blob, url, adj, src, from }

  async function makeFace(src, adj = { dx: 0, dy: 0, zoom: 1 }, from = "card") {
    try {
      const bitmap = await loadBitmap(src);
      if (from === "photo" && !hasTransparentBg(bitmap)) return setFace(null); // 배경 지우기 전에는 자르지 않음
      const blob = await (from === "photo" ? cropFaceFromCutout(bitmap, adj) : cropFace(bitmap, adj));
      setFace((old) => {
        if (old?.url) URL.revokeObjectURL(old.url);
        return { blob, url: URL.createObjectURL(blob), adj, src, from };
      });
    } catch (err) {
      setStatus(`얼굴 만들기 실패: ${err.message}`);
    }
  }
  const nudge = (k, v) => face && makeFace(face.src, { ...face.adj, [k]: +(face.adj[k] + v).toFixed(3) }, face.from);
  const close = () => { setEdit(null); setFace(null); };

  // 명함: 프로필 사진이 있으면 입력한 정보로 새로 만들고, 없으면 지금 명함을 그대로 둔다
  const [card, setCard] = useState(EMPTY_CARD);
  const [photo, setPhoto] = useState(null); // { file } 또는 { url }
  const [logo, setLogo] = useState(null);
  const canvasRef = useRef();
  const drawRef = useRef();

  function open(r) {
    const d = r.card_data;
    setEdit({ ...EMPTY, ...r });
    setCard({ ...EMPTY_CARD, company: r.company ?? "", ...d?.fields });
    setPhoto(d?.photo ? { url: d.photo } : null);
    setLogo(d?.logo ? { url: d.logo } : null);
  }

  // 프로필 사진이 바뀔 때마다 리더십팀 얼굴도 새로 자른다
  useEffect(() => {
    if (edit && photo) makeFace(photo.file ?? photo.url, undefined, "photo");
  }, [photo, !!edit]);
  const setC = (k) => (v) => setCard((c) => ({ ...c, [k]: v }));

  // 입력값으로 그린 명함 + 원본 사진·로고를 보관함에 올리고, 저장할 값으로 돌려준다
  async function madeCard() {
    await drawRef.current();
    const blob = await new Promise((ok) => canvasRef.current.toBlob(ok, "image/jpeg", 0.92)); // 2배 크기라 PNG는 너무 무거움
    const keep = async (x, prefix) => (x?.file ? uploadImage("cards", x.file, prefix) : x?.url ?? null);
    const [photoUrl, logoUrl, cardUrl] = await Promise.all([
      keep(photo, "src-photo"), keep(logo, "src-logo"),
      uploadImage("cards", new File([blob], "card.jpg", { type: "image/jpeg" }), "card"),
    ]);
    return { card: cardUrl, company: edit.company || card.company, card_data: { fields: card, photo: photoUrl, logo: logoUrl } };
  }

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
    if (photo) {
      setStatus("명함 만드는 중…");
      try { Object.assign(edit, await madeCard()); }
      catch (err) { return setStatus(`명함 만들기 실패: ${err.message}`); }
    } else {
      edit.card_data = { ...edit.card_data, fields: card }; // 명함은 그대로, 입력한 전화·주소 등만 보관
    }
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
        setPhoto(null);
        setLogo(null);
        setEdit((e) => ({ ...e, card_data: e.card_data && { fields: e.card_data.fields } }));
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
        <h3 className="card-maker-h">멤버 정보</h3>
        <div className="adm-grid">
          <Field label="이름 *" value={edit.name} onChange={set("name")} />
          <Field label="회사명 (멤버 목록)" value={edit.company} onChange={set("company")} />
          <Field label="전문분야" value={edit.specialty} onChange={set("specialty")} />
          <Field label="휴대폰" value={edit.phone} onChange={set("phone")} placeholder="010-0000-0000" />
          <Field label="휴대폰 2 (있으면)" value={edit.phone2} onChange={set("phone2")} />
          <Field label="이메일" value={edit.email} onChange={set("email")} type="email" />
          {CONTACTS.filter(([k]) => !["M", "E", "A"].includes(k)).map(([k, label]) => (
            <Field key={k} label={label} value={card[k]} onChange={setC(k)} placeholder={k === "K" ? "카카오톡 아이디" : ""} />
          ))}
        </div>
        <Field label="주소" value={card.A} onChange={setC("A")} hint="명함에서 길면 자동으로 두 줄로 나뉩니다" />
        <div className="adm-grid">
          <Field label="파워팀 (pt1~pt5, 없으면 비움)" value={edit.team} onChange={set("team")} />
          <Field label="순서 (작을수록 앞)" value={edit.sort} onChange={set("sort")} type="number" />
        </div>
        <div className="adm-checks">
          <label><input type="checkbox" checked={edit.active} onChange={(e) => set("active")(e.target.checked)} /> 사이트에 표시</label>
          <label><input type="checkbox" checked={edit.leader_only} onChange={(e) => set("leader_only")(e.target.checked)} /> 멤버 아님 (디렉터·앰배서더 등, 리더십팀에만 표시)</label>
        </div>
        <CardForm member={edit} legacyCard={edit.card ? cardSrc(edit.card) : null} onUploadCard={(f) => upload("cards", "card", f)}
          {...{ card, setCard, photo, setPhoto, logo, setLogo, canvasRef, drawRef }} />
        <div className="adm-photos">
          <div>
            <b>리더십팀 얼굴 (자동)</b>
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
            {!photo && edit.card && !face && (
              <button className="adm-btn" onClick={() => makeFace(cardSrc(edit.card))}>명함에서 얼굴 다시 만들기</button>
            )}
            <small className="muted">프로필 사진에서 자동으로 잘라 씁니다</small>
          </div>
        </div>
        <div className="adm-save">
          <button className="btn btn-main" onClick={save}>등록</button>
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
        <button className="btn btn-main" onClick={() => open({ ...EMPTY, sort: (rows.at(-1)?.sort ?? 0) + 10 })}>+ 멤버 추가</button>
      </div>
      {status && <p className="adm-msg">{status}</p>}
      <table className="adm-table">
        <thead><tr><th>명함</th><th>이름</th><th>회사 · 전문분야</th><th>연락처</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.active ? "" : "adm-off"} onClick={() => open(r)}>
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
