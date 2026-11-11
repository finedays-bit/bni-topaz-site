"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import MembersTab from "./MembersTab";
import { AboutTab, ChapterTab, InviteTab, EducationTab, LeadershipTab, LinksTab } from "./SettingsTabs";
import MigrateTab from "./MigrateTab";
import VisitorsTab from "./VisitorsTab";
import WantedTab from "./WantedTab";
import HelpTab from "./HelpTab";
import AccountsTab, { loginEmail } from "./AccountsTab";
import { canUse } from "@/lib/adminPerms";

const TABS = [
  ["visitors", "참관 신청"],
  ["members", "멤버·명함"],
  ["leadership", "리더십팀"],
  ["wanted", "찾는 분야"],
  ["invite", "초대장·정모 일정"],
  ["about", "챕터 소개글"],
  ["chapter", "구호·모임·숫자"],
  ["education", "교육 정보"],
  ["links", "RPS·링크"],
  ["migrate", "사진 옮기기"],
  ["help", "도움말"],
];

// 관리자 화면: 로그인 → 관리자 확인 → 탭별 수정
export default function AdminApp() {
  const sb = supabaseBrowser();
  const [state, setState] = useState("loading"); // loading | login | denied | ready
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState("visitors");
  const [pwOpen, setPwOpen] = useState(false);
  const [access, setAccess] = useState({ master: false, perms: null }); // perms null = 전체
  const master = access.master;
  // 권한 없는 탭이 열려 있으면 볼 수 있는 첫 탭으로
  useEffect(() => {
    if (!canUse(access, tab)) setTab(([...TABS].find(([k]) => canUse(access, k)) ?? ["help"])[0]);
  }, [access]);

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user) return setState("login");
      setEmail(data.user.email);
      const { data: ok } = await sb.rpc("is_admin");
      if (ok) {
        // 내 권한 (admin-perms.sql 실행 전이면 전체 권한 + 마스터 여부만)
        const { data: a, error } = await sb.rpc("my_access");
        if (!error && a) setAccess({ master: !!a.master, perms: a.perms ?? null });
        else { const { data: m } = await sb.rpc("is_master"); setAccess({ master: !!m, perms: null }); }
      }
      setState(ok ? "ready" : "denied");
    })();
  }, [sb]);

  if (state === "loading") return <main className="admin"><p className="muted">불러오는 중…</p></main>;
  if (state === "login") return <LoginBox />;

  const logout = async () => { await sb.auth.signOut(); location.reload(); };

  if (state === "denied")
    return (
      <main className="admin admin-narrow">
        <h1>관리자가 아닙니다</h1>
        <p className="muted">{email} 계정은 관리자 명단에 없습니다.</p>
        <button className="btn btn-line" onClick={logout}>로그아웃</button>
      </main>
    );

  return (
    <main className="admin">
      <div className="admin-head">
        <h1>관리자</h1>
        <span className="muted">{email.replace(/@admin\.bnitopaz\.invalid$/, "")}{master && " · 마스터"}</span>
        <button className="adm-btn" onClick={() => setPwOpen(!pwOpen)}>내 비밀번호 바꾸기</button>
        <button className="adm-btn" onClick={logout}>로그아웃</button>
      </div>
      {pwOpen && <PasswordBox onClose={() => setPwOpen(false)} />}
      <nav className="admin-tabs">
        {[...TABS, ["accounts", "관리자 계정"]].filter(([k]) => canUse(access, k)).map(([k, label]) => (
          <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>{label}</button>
        ))}
      </nav>
      {tab === "visitors" && canUse(access, "visitors") && <VisitorsTab />}
      {tab === "members" && canUse(access, "members") && <MembersTab />}
      {tab === "leadership" && canUse(access, "leadership") && <LeadershipTab />}
      {tab === "wanted" && canUse(access, "wanted") && <WantedTab />}
      {tab === "help" && canUse(access, "help") && <HelpTab />}
      {tab === "accounts" && master && <AccountsTab me={email} />}
      {tab === "invite" && canUse(access, "invite") && <InviteTab />}
      {tab === "about" && canUse(access, "about") && <AboutTab />}
      {tab === "chapter" && canUse(access, "chapter") && <ChapterTab />}
      {tab === "education" && canUse(access, "education") && <EducationTab />}
      {tab === "links" && canUse(access, "links") && <LinksTab />}
      {tab === "migrate" && canUse(access, "migrate") && <MigrateTab />}
    </main>
  );
}

// 로그인: 아이디(관리자 메일) + 비밀번호. 비밀번호를 아직 안 정했거나 잊었으면 메일 로그인 링크로
function LoginBox() {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const failed = typeof window !== "undefined" && new URLSearchParams(location.search).get("error");

  async function login(e) {
    e.preventDefault();
    setBusy(true); setErr(""); setMsg("");
    const { error } = await sb.auth.signInWithPassword({ email: loginEmail(email), password: pw });
    setBusy(false);
    if (error) return setErr("아이디 또는 비밀번호가 맞지 않습니다. 비밀번호를 모르면 마스터 관리자에게 새로 정해 달라고 부탁하세요.");
    location.reload();
  }

  async function sendLink() {
    if (!email.includes("@")) return setErr("메일 로그인 링크는 메일 주소로 등록된 관리자만 받을 수 있어요. 위 칸에 관리자 메일을 넣어 주세요.");
    setErr(""); setMsg("보내는 중…");
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/admin/callback`, shouldCreateUser: false },
    });
    setMsg(error ? `보내지 못했습니다: ${error.message}` : "메일을 보냈습니다. 메일함에서 '로그인' 링크를 눌러 주세요. 들어간 뒤 오른쪽 위 '내 비밀번호 바꾸기'에서 비밀번호를 만들면 다음부터는 바로 로그인됩니다.");
  }

  return (
    <main className="admin admin-narrow">
      <h1>관리자 로그인</h1>
      <p className="muted">마스터 관리자에게 받은 아이디와 비밀번호를 넣어 주세요.</p>
      {failed && <p className="adm-err">로그인 링크가 만료되었거나 이미 사용되었습니다. 다시 받아 주세요.</p>}
      <form onSubmit={login} className="adm-form">
        <label>아이디 (또는 관리자 메일)<input type="text" required autoComplete="username" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>비밀번호<input type="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <button className="btn btn-main" type="submit" disabled={busy}>{busy ? "확인 중…" : "로그인"}</button>
      </form>
      {err && <p className="adm-err">{err}</p>}
      <div className="adm-alt">
        <span className="muted">메일로 등록된 관리자라면</span>
        <button type="button" className="adm-btn" onClick={sendLink}>메일로 로그인 링크 받기</button>
      </div>
      {msg && <p className="adm-msg">{msg}</p>}
    </main>
  );
}

// 로그인한 관리자가 자기 비밀번호를 정하거나 바꾼다
function PasswordBox({ onClose }) {
  const sb = supabaseBrowser();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  async function save(e) {
    e.preventDefault();
    if (pw.length < 8) return setMsg("비밀번호는 8자 이상으로 정해 주세요.");
    if (pw !== pw2) return setMsg("두 칸의 비밀번호가 다릅니다.");
    setMsg("저장 중…");
    const { error } = await sb.auth.updateUser({ password: pw });
    setMsg(error ? `저장하지 못했습니다: ${error.message}` : "비밀번호를 정했습니다. 다음부터 메일과 이 비밀번호로 로그인하세요.");
    if (!error) { setPw(""); setPw2(""); }
  }
  return (
    <form className="adm-card adm-form adm-pw" onSubmit={save}>
      <b>내 비밀번호 바꾸기</b>
      <label>새 비밀번호 (8자 이상)<input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      <label>한 번 더<input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
      <div className="adm-save">
        <button className="btn btn-main" type="submit">저장</button>
        <button className="adm-btn" type="button" onClick={onClose}>닫기</button>
        {msg && <span className="adm-msg">{msg}</span>}
      </div>
    </form>
  );
}
