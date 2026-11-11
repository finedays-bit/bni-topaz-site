"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

// 아이디만 쓰는 계정은 내부적으로 이 메일로 저장된다 (supabase/admin-logins.sql 과 같은 규칙)
const ID_DOMAIN = "@admin.bnitopaz.invalid";
export const loginEmail = (id) => { const v = id.trim().toLowerCase(); return v.includes("@") ? v : v + ID_DOMAIN; };
const showId = (email) => email.replace(ID_DOMAIN, "");

// 마스터 관리자 전용: 관리자 아이디 만들기·비밀번호 정해 주기·빼기
export default function AccountsTab({ me }) {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ id: "", pw: "", master: false });
  const [reset, setReset] = useState({}); // 이메일별 새 비밀번호 입력칸

  const load = async () => {
    const { data, error } = await sb.rpc("admin_list");
    if (error) return setMsg(`불러오지 못했습니다: ${error.message}`);
    setRows(data);
  };
  useEffect(() => { load(); }, []);

  async function save(id, pw, master) {
    setMsg("저장 중…");
    const { error } = await sb.rpc("admin_save", { p_id: id, p_password: pw, p_master: master });
    if (error) return setMsg(`저장하지 못했습니다: ${error.message}`), false;
    setMsg("저장했습니다. 아이디와 비밀번호를 그분께 직접 전해 주세요.");
    await load();
    return true;
  }
  async function add(e) {
    e.preventDefault();
    if (!form.id.trim() || form.pw.length < 8) return setMsg("아이디와 8자 이상 비밀번호를 넣어 주세요.");
    if (await save(form.id, form.pw, form.master)) setForm({ id: "", pw: "", master: false });
  }
  async function remove(email) {
    if (!confirm(`${showId(email)} 관리자를 뺄까요? 더는 로그인할 수 없게 됩니다.`)) return;
    const { error } = await sb.rpc("admin_remove", { p_email: email });
    setMsg(error ? `빼지 못했습니다: ${error.message}` : "뺐습니다.");
    load();
  }

  return (
    <section className="adm-panel">
      <h2>관리자 계정</h2>
      <p className="muted">마스터 관리자만 보이는 탭입니다. 관리자 아이디를 만들고 비밀번호를 정해 주세요. 아이디 대신 메일 주소를 넣어도 됩니다.</p>

      <form className="adm-card adm-acc-form" onSubmit={add}>
        <b>새 관리자 추가</b>
        <label className="adm-field"><span>아이디 (영문·숫자, 또는 메일)</span><input value={form.id} autoCapitalize="none" onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="예: visitor2026" /></label>
        <label className="adm-field"><span>비밀번호 (8자 이상)</span><input value={form.pw} onChange={(e) => setForm({ ...form, pw: e.target.value })} autoComplete="new-password" /></label>
        <label className="adm-check"><input type="checkbox" checked={form.master} onChange={(e) => setForm({ ...form, master: e.target.checked })} /> 마스터 관리자 (다른 관리자 계정까지 관리)</label>
        <button className="btn btn-main" type="submit">추가</button>
      </form>
      {msg && <p className="adm-msg">{msg}</p>}

      {!rows ? <p className="muted">불러오는 중…</p> : (
        <div className="adm-acc-list">
          {rows.map((r) => {
            const self = r.email.toLowerCase() === (me ?? "").toLowerCase();
            return (
              <div className="adm-acc" key={r.email}>
                <div>
                  <b>{showId(r.email)}</b>
                  {r.master && <span className="adm-tag">마스터</span>}
                  {self && <span className="adm-tag">나</span>}
                  <small>{r.has_password ? "비밀번호 있음" : "비밀번호 없음 (메일 링크로만 로그인)"}</small>
                </div>
                <div className="adm-acc-actions">
                  <input type="text" placeholder="새 비밀번호" value={reset[r.email] ?? ""} autoComplete="new-password"
                    onChange={(e) => setReset({ ...reset, [r.email]: e.target.value })} aria-label={`${showId(r.email)} 새 비밀번호`} />
                  <button className="adm-btn" type="button" onClick={async () => {
                    const pw = reset[r.email] ?? "";
                    if (pw.length < 8) return setMsg("새 비밀번호를 8자 이상 넣어 주세요.");
                    if (await save(r.email, pw, r.master)) setReset({ ...reset, [r.email]: "" });
                  }}>비밀번호 정하기</button>
                  {!self && <button className="adm-btn" type="button" onClick={() => save(r.email, "", !r.master)}>{r.master ? "마스터 해제" : "마스터로"}</button>}
                  {!self && <button className="adm-btn adm-danger" type="button" onClick={() => remove(r.email)}>빼기</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
