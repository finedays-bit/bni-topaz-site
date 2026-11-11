"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { PERMS, ALL_PERMS, permLabel } from "@/lib/adminPerms";

// 아이디만 쓰는 계정은 내부적으로 이 메일로 저장된다 (supabase/admin-logins.sql 과 같은 규칙)
const ID_DOMAIN = "@admin.bnitopaz.invalid";
export const loginEmail = (id) => { const v = id.trim().toLowerCase(); return v.includes("@") ? v : v + ID_DOMAIN; };
const showId = (email) => email.replace(ID_DOMAIN, "");

// 마스터 관리자 전용: 관리자 아이디 만들기·비밀번호 정해 주기·빼기
export default function AccountsTab({ me }) {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ id: "", pw: "", perms: [] });
  const [editPerms, setEditPerms] = useState({}); // 이메일별 고치는 중인 권한
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
    if (!form.perms.length) return setMsg("편집 권한을 하나 이상 골라 주세요.");
    setMsg("저장 중…");
    const { data: email, error } = await sb.rpc("admin_save", { p_id: form.id, p_password: form.pw, p_master: false });
    if (error) return setMsg(`저장하지 못했습니다: ${error.message}`);
    const r = await sb.rpc("admin_set_perms", { p_email: email, p_perms: form.perms });
    setMsg(r.error ? `계정은 만들었지만 권한을 저장하지 못했습니다: ${r.error.message}` : "추가했습니다. 아이디와 비밀번호를 그분께 직접 알려 주세요.");
    setForm({ id: "", pw: "", perms: [] });
    load();
  }
  async function savePerms(email) {
    const perms = editPerms[email];
    if (!perms?.length) return setMsg("편집 권한을 하나 이상 골라 주세요.");
    const { error } = await sb.rpc("admin_set_perms", { p_email: email, p_perms: perms });
    setMsg(error ? `권한을 저장하지 못했습니다: ${error.message}` : "권한을 바꿨습니다. 그분이 관리자 화면을 새로고침 하면 반영됩니다.");
    if (!error) { const { [email]: _, ...rest } = editPerms; setEditPerms(rest); load(); }
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
      <p className="muted">마스터 관리자만 보이는 탭입니다. 아이디·비밀번호를 정하고, 그 관리자가 고칠 수 있는 탭(편집 권한)을 골라 주세요.</p>

      <form className="adm-card adm-acc-add" onSubmit={add}>
        <b>관리자 추가</b>
        <div className="adm-acc-row">
          <label className="adm-field"><span>아이디</span><input value={form.id} autoCapitalize="none" autoComplete="off" onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="예: visitor" /></label>
          <label className="adm-field"><span>비밀번호 (8자 이상)</span><input value={form.pw} autoComplete="new-password" onChange={(e) => setForm({ ...form, pw: e.target.value })} /></label>
          <button className="btn btn-main" type="submit">추가</button>
        </div>
        <PermPicker value={form.perms} onChange={(perms) => setForm({ ...form, perms })} />
        <small className="muted">만든 아이디와 비밀번호를 그분께 직접 알려 주세요.</small>
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
                  <small>편집 권한: {r.master ? "전체 (마스터)" : permLabel(r.perms)}</small>
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
                  {!self && !r.master && <button className="adm-btn" type="button"
                    onClick={() => setEditPerms({ ...editPerms, [r.email]: editPerms[r.email] ? undefined : (r.perms ?? ALL_PERMS) })}>권한 바꾸기</button>}
                  {!self && <button className="adm-btn adm-danger" type="button" onClick={() => remove(r.email)}>빼기</button>}
                </div>
                {editPerms[r.email] && (
                  <div className="adm-acc-perms">
                    <PermPicker value={editPerms[r.email]} onChange={(perms) => setEditPerms({ ...editPerms, [r.email]: perms })} />
                    <button className="btn btn-main" type="button" onClick={() => savePerms(r.email)}>권한 저장</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// 편집 권한 고르기 (탭 이름 그대로)
function PermPicker({ value, onChange }) {
  const all = ALL_PERMS.every((k) => value.includes(k));
  const toggle = (k) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <fieldset className="adm-perms">
      <legend>편집 권한 (고칠 수 있는 탭)</legend>
      <label className="adm-check adm-perm-all"><input type="checkbox" checked={all} onChange={() => onChange(all ? [] : ALL_PERMS)} /> 전체</label>
      {PERMS.map(([k, label]) => (
        <label className="adm-check" key={k}><input type="checkbox" checked={value.includes(k)} onChange={() => toggle(k)} /> {label}</label>
      ))}
    </fieldset>
  );
}
