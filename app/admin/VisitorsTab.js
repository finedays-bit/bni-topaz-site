"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { formatKoreanDate } from "@/lib/data";
import { VISITOR_HEADER, toCsv, visitorRows } from "@/lib/visitorSheet";

const STATUSES = ["신규", "연락함", "참석", "가입", "취소"];

// 참관 신청 목록 — 최신순, 진행 상태·메모 기록
export default function VisitorsTab() {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data, error } = await sb.from("visitors").select("*").order("created_at", { ascending: false });
    if (error) return setMsg(`불러오지 못했습니다: ${error.message}`);
    setRows(data);
  }
  useEffect(() => { load(); }, []);

  async function update(id, patch) {
    const { error } = await sb.from("visitors").update(patch).eq("id", id);
    if (error) return setMsg(`저장 실패: ${error.message}`);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setMsg("저장했습니다.");
  }

  async function remove(r) {
    if (!confirm(`${r.name} 님의 신청을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const { error } = await sb.from("visitors").delete().eq("id", r.id);
    if (error) return setMsg(`삭제 실패: ${error.message}`);
    setRows((rs) => rs.filter((x) => x.id !== r.id));
  }

  // 엑셀(CSV)로 내려받기 — 이 컴퓨터에서 바로 만든다
  function download() {
    const blob = new Blob([toCsv([VISITOR_HEADER, ...visitorRows(rows)])], { type: "text/csv;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `토파즈_참관신청_${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // 관리자 구글 시트에 지금 목록을 새로 써 넣고 연다 (창은 먼저 열어 둬야 막히지 않는다)
  async function openSheet() {
    const win = window.open("about:blank", "_blank");
    setMsg("구글 시트에 옮기는 중…");
    try {
      const res = await fetch("/api/visitors-sheet", { method: "POST" });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error);
      if (win) win.location.href = out.url; else window.open(out.url, "_blank");
      setMsg(`구글 시트에 ${out.count}건을 옮겼습니다. (관리자 Gmail로 로그인돼 있어야 열립니다)`);
    } catch (err) {
      win?.close();
      setMsg(err.message);
    }
  }

  if (!rows) return <section className="adm-panel"><p className="muted">{msg || "불러오는 중…"}</p></section>;

  return (
    <section className="adm-panel">
      <div className="adm-row">
        <h2>참관 신청 {rows.length}건 · 신규 {rows.filter((r) => r.status === "신규").length}건</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button className="adm-btn" onClick={load}>새로고침</button>
          <button className="adm-btn" onClick={download} disabled={!rows.length}>엑셀(CSV) 내려받기</button>
          <button className="adm-btn" onClick={openSheet}>구글 시트로 열기</button>
        </div>
      </div>
      <p className="muted">신청이 들어오면 비지터 호스트 리더, 신청서에서 고른 '초대한 멤버', 공용 메일로 알림이 갑니다. 비지터 호스트 리더는 '리더십팀' 탭의 직책으로, 메일 주소는 각자의 멤버 정보에서 자동으로 찾습니다.</p>
      {msg && <p className="adm-msg">{msg}</p>}
      {rows.length === 0 && <p className="muted">아직 신청이 없습니다.</p>}
      <div className="visit-list">
        {rows.map((r) => (
          <div className={`visit-item visit-${r.status}`} key={r.id}>
            <div className="visit-main">
              <b>{r.name}</b> <span>{r.company} · {r.field}</span>
              <div className="visit-sub">
                <a href={`tel:${r.phone.replace(/-/g, "")}`}>{r.phone}</a>
                <span>참관 {r.visit_date ? formatKoreanDate(r.visit_date) : "-"}</span>
                <span>초대 {r.inviter || "-"}</span>
                <span className="muted">신청 {new Date(r.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" })}</span>
                <span className={r.notified ? "ok" : "warn"}>{r.notified ? "메일 보냄" : "메일 못 보냄"}</span>
              </div>
            </div>
            <div className="visit-ctl">
              <select value={r.status} onChange={(e) => update(r.id, { status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input defaultValue={r.memo ?? ""} placeholder="메모 (칸 밖을 누르면 저장)"
                onBlur={(e) => e.target.value !== (r.memo ?? "") && update(r.id, { memo: e.target.value || null })} />
              <button className="adm-btn adm-danger" onClick={() => remove(r)}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
