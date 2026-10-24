"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import MembersTab from "./MembersTab";
import { AboutTab, ChapterTab, InviteTab, EducationTab, LeadershipTab, LinksTab } from "./SettingsTabs";
import MigrateTab from "./MigrateTab";
import VisitorsTab from "./VisitorsTab";
import WantedTab from "./WantedTab";

const TABS = [
  ["visitors", "참관 신청"],
  ["members", "멤버·명함"],
  ["leadership", "리더십팀"],
  ["wanted", "찾는 분야"],
  ["invite", "이번 주 초대장"],
  ["about", "챕터 소개글"],
  ["chapter", "구호·모임·숫자"],
  ["education", "교육 정보"],
  ["links", "RPS·링크"],
  ["migrate", "사진 옮기기"],
];

// 관리자 화면: 로그인 → 관리자 확인 → 탭별 수정
export default function AdminApp() {
  const sb = supabaseBrowser();
  const [state, setState] = useState("loading"); // loading | login | denied | ready
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState("visitors");

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user) return setState("login");
      setEmail(data.user.email);
      const { data: ok } = await sb.rpc("is_admin");
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
        <span className="muted">{email}</span>
        <button className="adm-btn" onClick={logout}>로그아웃</button>
      </div>
      <nav className="admin-tabs">
        {TABS.map(([k, label]) => (
          <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>{label}</button>
        ))}
      </nav>
      {tab === "visitors" && <VisitorsTab />}
      {tab === "members" && <MembersTab />}
      {tab === "leadership" && <LeadershipTab />}
      {tab === "wanted" && <WantedTab />}
      {tab === "invite" && <InviteTab />}
      {tab === "about" && <AboutTab />}
      {tab === "chapter" && <ChapterTab />}
      {tab === "education" && <EducationTab />}
      {tab === "links" && <LinksTab />}
      {tab === "migrate" && <MigrateTab />}
    </main>
  );
}

function LoginBox() {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const failed = typeof window !== "undefined" && new URLSearchParams(location.search).get("error");

  async function send(e) {
    e.preventDefault();
    setMsg("보내는 중…");
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/admin/callback`, shouldCreateUser: false },
    });
    setMsg(error ? `보내지 못했습니다: ${error.message}` : "메일을 보냈습니다. 메일함에서 '로그인' 링크를 눌러 주세요. (이 창은 닫아도 됩니다)");
  }

  return (
    <main className="admin admin-narrow">
      <h1>관리자 로그인</h1>
      <p className="muted">챕터 공용 관리자 메일을 넣으면 로그인 링크를 보내 드립니다.</p>
      {failed && <p className="adm-err">로그인 링크가 만료되었거나 이미 사용되었습니다. 다시 받아 주세요.</p>}
      <form onSubmit={send} className="adm-form">
        <label>관리자 메일<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <button className="btn btn-main" type="submit">로그인 링크 받기</button>
      </form>
      {msg && <p className="adm-msg">{msg}</p>}
    </main>
  );
}
