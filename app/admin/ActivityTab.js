"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { refreshSite } from "./shared";
import { fileSize } from "@/lib/posts";

const BUCKET = "activity";
const MAX_FILE = 20 * 1024 * 1024; // 자료 한 개 20MB
const empty = () => ({ id: null, title: "", event_date: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), body: "", photos: [], files: [], published: true });

// 사진은 올리기 전에 긴 변 1800px JPEG로 줄인다 (휴대폰 원본 10MB → 0.5MB 안팎)
async function shrink(file) {
  if (!/^image\/(jpe?g|png|webp|heic|heif)$/i.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch { return file; }
}

async function upload(file, kind) {
  const sb = supabaseBrowser();
  const ext = (file.name.match(/\.([a-z0-9]{1,6})$/i)?.[1] || "bin").toLowerCase();
  const path = `${kind}/${new Date().toISOString().slice(0, 7)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) throw error;
  return { url: sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, path };
}

// 관리자: 활동 게시판 — 글 쓰기·고치기·지우기, 사진 여러 장(슬라이드 순서), 자료 파일
export default function ActivityTab() {
  const sb = supabaseBrowser();
  const [list, setList] = useState(null);
  const [post, setPost] = useState(null); // 고치는 중인 글
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    const { data, error } = await sb.from("posts").select("*").order("event_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    if (error) return setMsg(["42P01", "PGRST205"].includes(error.code) ? "게시판 저장 칸이 아직 없습니다. 사이트 담당자에게 '활동 게시판 SQL' 실행을 부탁하세요." : `불러오지 못했습니다: ${error.message}`);
    setList(data);
  };
  useEffect(() => { load(); }, []);

  const set = (k) => (v) => setPost({ ...post, [k]: v });

  async function addPhotos(fileList) {
    const files = [...fileList];
    const out = [];
    for (let i = 0; i < files.length; i++) {
      setBusy(`사진 올리는 중… (${i + 1}/${files.length})`);
      try { const f = await shrink(files[i]); const u = await upload(f, "photos"); out.push({ ...u, caption: "" }); }
      catch (e) { setMsg(`사진을 올리지 못했습니다: ${e.message}`); }
    }
    setBusy("");
    setPost((p) => ({ ...p, photos: [...p.photos, ...out] }));
  }

  async function addFiles(fileList) {
    const files = [...fileList];
    const out = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_FILE) { setMsg(`${files[i].name}: 20MB가 넘어 올릴 수 없습니다.`); continue; }
      setBusy(`자료 올리는 중… (${i + 1}/${files.length})`);
      try { const u = await upload(files[i], "files"); out.push({ ...u, name: files[i].name, size: files[i].size }); }
      catch (e) { setMsg(`자료를 올리지 못했습니다: ${e.message}`); }
    }
    setBusy("");
    setPost((p) => ({ ...p, files: [...p.files, ...out] }));
  }

  const movePhoto = (i, d) => {
    const j = i + d; if (j < 0 || j >= post.photos.length) return;
    const a = [...post.photos]; [a[i], a[j]] = [a[j], a[i]]; set("photos")(a);
  };

  async function save() {
    if (!post.title.trim()) return setMsg("제목을 넣어 주세요.");
    setMsg("저장 중…");
    const row = { title: post.title.trim(), event_date: post.event_date || null, body: post.body, photos: post.photos, files: post.files, published: post.published };
    const { error } = post.id ? await sb.from("posts").update(row).eq("id", post.id) : await sb.from("posts").insert(row);
    if (error) return setMsg(`저장하지 못했습니다: ${error.message}`);
    await refreshSite();
    setMsg(post.published ? "저장했습니다. 사이트 '활동' 메뉴에 1분 안에 보입니다." : "저장했습니다. (숨김 상태라 사이트에는 안 보여요)");
    setPost(null);
    load();
  }

  async function remove() {
    if (!post.id || !confirm(`'${post.title}' 글을 지울까요? 사진과 자료도 함께 지워지고 되돌릴 수 없습니다.`)) return;
    const paths = [...post.photos, ...post.files].map((x) => x.path).filter(Boolean);
    if (paths.length) await sb.storage.from(BUCKET).remove(paths);
    const { error } = await sb.from("posts").delete().eq("id", post.id);
    if (error) return setMsg(`지우지 못했습니다: ${error.message}`);
    await refreshSite();
    setMsg("지웠습니다.");
    setPost(null);
    load();
  }

  if (post) return (
    <section className="adm-panel">
      <div className="adm-row"><h2>{post.id ? "글 고치기" : "새 활동 글"}</h2><button className="adm-btn" onClick={() => { setPost(null); setMsg(""); }}>← 목록</button></div>
      <div className="adm-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <label className="adm-field"><span>제목</span><input value={post.title} maxLength={100} onChange={(e) => set("title")(e.target.value)} placeholder="예: 11월 MEGA BCD" /></label>
        <label className="adm-field"><span>활동 날짜</span><input type="date" value={post.event_date ?? ""} onChange={(e) => set("event_date")(e.target.value)} /></label>
      </div>
      <label className="adm-field"><span>내용 (빈 줄 = 문단 나누기)</span><textarea rows={8} maxLength={5000} value={post.body} onChange={(e) => set("body")(e.target.value)} /></label>

      <h3 className="adm-sub">사진 {post.photos.length}장 <small className="muted">· 첫 사진이 대표, 순서대로 슬라이드로 넘어갑니다</small></h3>
      <div className="act-photos">
        {post.photos.map((ph, i) => (
          <div className="act-photo" key={ph.url}>
            <img src={ph.url} alt="" />
            <input value={ph.caption ?? ""} placeholder="사진 설명 (선택)" onChange={(e) => set("photos")(post.photos.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} />
            <div>
              <button className="adm-btn" type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} aria-label="앞으로">←</button>
              <button className="adm-btn" type="button" onClick={() => movePhoto(i, 1)} disabled={i === post.photos.length - 1} aria-label="뒤로">→</button>
              <button className="adm-btn adm-danger" type="button" onClick={() => set("photos")(post.photos.filter((_, j) => j !== i))}>빼기</button>
            </div>
          </div>
        ))}
        <label className="act-add">
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          <b>+ 사진 올리기</b><small>여러 장 한 번에 골라도 돼요</small>
        </label>
      </div>

      <h3 className="adm-sub">자료 {post.files.length}개 <small className="muted">· PDF·한글·엑셀·PPT 등, 한 개 20MB까지</small></h3>
      <ul className="act-files">
        {post.files.map((f, i) => (
          <li key={f.url}><span>{f.name}</span><small>{fileSize(f.size)}</small>
            <button className="adm-btn adm-danger" type="button" onClick={() => set("files")(post.files.filter((_, j) => j !== i))}>빼기</button></li>
        ))}
        <li><label className="adm-btn act-file-btn">
          <input type="file" multiple hidden accept=".pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,image/*" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          + 자료 올리기</label></li>
      </ul>

      <label className="adm-check" style={{ marginTop: 14 }}><input type="checkbox" checked={post.published} onChange={(e) => set("published")(e.target.checked)} /> 사이트에 공개</label>
      {busy && <p className="adm-msg">{busy}</p>}
      <div className="adm-save">
        <button className="btn btn-main" onClick={save} disabled={!!busy}>저장</button>
        {post.id && <button className="adm-btn adm-danger" onClick={remove} disabled={!!busy}>글 지우기</button>}
        {msg && <span className="adm-msg">{msg}</span>}
      </div>
    </section>
  );

  return (
    <section className="adm-panel">
      <div className="adm-row"><h2>활동 게시판</h2><button className="btn btn-main" onClick={() => { setPost(empty()); setMsg(""); }} disabled={!list}>+ 새 글 쓰기</button></div>
      <p className="muted">정기모임·BCD·교육·친목 사진과 자료를 올리면 사이트 '활동' 메뉴와 첫 화면에 사진이 슬라이드로 넘어가며 보입니다.</p>
      {msg && <p className="adm-msg">{msg}</p>}
      {list && (list.length ? (
        <table className="adm-table">
          <thead><tr><th></th><th>날짜</th><th>제목</th><th>사진·자료</th><th>공개</th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} onClick={() => { setPost({ ...empty(), ...p, photos: p.photos ?? [], files: p.files ?? [] }); setMsg(""); }} className={p.published ? "" : "adm-off"}>
                <td>{p.photos?.[0] ? <img src={p.photos[0].url} alt="" style={{ width: 64, height: 48 }} /> : null}</td>
                <td>{p.event_date}</td><td>{p.title}</td>
                <td>{p.photos?.length ?? 0}장 · {p.files?.length ?? 0}개</td><td>{p.published ? "공개" : "숨김"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="muted">아직 글이 없습니다. '+ 새 글 쓰기'로 첫 활동을 올려 보세요.</p>)}
    </section>
  );
}
