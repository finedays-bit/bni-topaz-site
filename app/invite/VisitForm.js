"use client";

import { useState } from "react";
import InviterField from "./InviterField";

// 참관 신청서 — 제출하면 운영진(비지터 호스트 리더·의장단)에게 메일이 가고 관리자 화면에 저장된다
export default function VisitForm({ members, dates }) {
  const [state, setState] = useState({ status: "idle", msg: "" }); // idle | sending | done | error

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const inviter = f.get("inviter") === "__other__" ? f.get("inviterOther") : f.get("inviter");
    setState({ status: "sending", msg: "" });
    try {
      const res = await fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          phone: f.get("phone"),
          company: f.get("company"),
          field: f.get("field"),
          visitDate: f.get("visitDate"),
          inviter,
          consent: f.get("consent") === "on",
          website: f.get("website"),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "신청하지 못했습니다.");
      setState({ status: "done", msg: "" });
    } catch (err) {
      setState({ status: "error", msg: err.message });
    }
  }

  if (state.status === "done")
    return (
      <div className="apply-done">
        <b>참관 신청이 접수되었습니다.</b>
        <p>운영진이 확인 후 연락드리겠습니다. 감사합니다!</p>
      </div>
    );

  return (
    <form onSubmit={submit}>
      <label>이름 *<input name="name" required maxLength={40} autoComplete="name" /></label>
      <label>휴대폰 번호 *<input name="phone" type="tel" inputMode="tel" required placeholder="010-0000-0000" maxLength={20} autoComplete="tel" /></label>
      <label>회사명 *<input name="company" required maxLength={80} autoComplete="organization" /></label>
      <label>사업 분야 *<input name="field" required maxLength={80} placeholder="예: 세무 기장, 인테리어" /></label>
      <label>
        참관 예정일 *
        <select name="visitDate" required defaultValue={dates[0]?.value}>
          {dates.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </label>
      <InviterField members={members} />
      {/* 사람에게는 안 보이는 칸: 자동 등록 프로그램 막기 */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      <label className="agree">
        <input type="checkbox" name="consent" required />
        <span>참석 확인과 모임 안내를 위해 이름·연락처·회사 정보를 수집하며, 신청 내용은 챕터 운영진(비지터 호스트 리더·의장단)에게 전달됩니다. (필수)</span>
      </label>
      <button type="submit" className="btn btn-main" disabled={state.status === "sending"}>
        {state.status === "sending" ? "보내는 중…" : "참관 신청하기"}
      </button>
      {state.status === "error" && <p className="draft-note">{state.msg}</p>}
      <p className="muted form-note">* 표시는 필수 입력 항목입니다.</p>
    </form>
  );
}
