import { NextResponse } from "next/server";
import { formatKoreanDate } from "@/lib/data";
import { getPeople, getSettings } from "@/lib/store";
import { mailReady, recipients, sendVisitMail } from "@/lib/notify";
import { VISITOR_HEADER, visitorRows } from "@/lib/visitorSheet";

// 참관 신청 받기 → 운영진 메일 → Supabase 저장
const clean = (s, max) => String(s ?? "").trim().slice(0, max);

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true }); // 자동 등록 프로그램이 채우는 숨은 칸

  const v = {
    name: clean(body.name, 40),
    phone: clean(body.phone, 20).replace(/[^\d-]/g, ""),
    company: clean(body.company, 80),
    field: clean(body.field, 80),
    visit_date: /^\d{4}-\d{2}-\d{2}$/.test(body.visitDate) ? body.visitDate : null,
    inviter: clean(body.inviter, 80) || null,
    consent: body.consent === true,
  };
  if (!v.name || v.phone.replace(/-/g, "").length < 9 || !v.company || !v.field || !v.visit_date)
    return NextResponse.json({ error: "필수 항목(이름·휴대폰·회사명·사업 분야·참관 예정일)을 확인해 주세요." }, { status: 400 });
  if (!v.consent) return NextResponse.json({ error: "개인정보 수집·전달에 동의해 주세요." }, { status: 400 });

  // 운영진 메일 (실패해도 신청은 저장한다)
  const [{ leadership, invite }, people] = await Promise.all([getSettings(), getPeople()]);
  const { emails } = recipients(leadership, people);
  const whenText = `${formatKoreanDate(v.visit_date)} ${invite.time ?? ""}`.trim();
  let notified = false;
  if (mailReady() && emails.length) {
    try { await sendVisitMail(emails, v, whenText); notified = true; }
    catch (e) { console.error("참관 신청 메일 실패:", e.message); }
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/visitors`, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ ...v, notified }),
  });
  if (!res.ok) {
    console.error("참관 신청 저장 실패:", res.status, await res.text());
    return NextResponse.json({ error: notified ? "신청이 운영진에게 전달되었지만 저장 중 문제가 생겼습니다." : "신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: notified ? 200 : 500 });
  }
  await appendToSheet({ ...v, created_at: new Date().toISOString(), status: "신규", notified });
  return NextResponse.json({ ok: true, notified });
}

// 관리자 구글 시트 맨 위에 한 줄 추가 (scripts/visitors-sheet.gs) — 실패해도 신청은 이미 저장됐으니 넘어간다
async function appendToSheet(row) {
  const hook = process.env.VISITOR_SHEET_WEBHOOK;
  if (!hook) return;
  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "append", header: VISITOR_HEADER, row: visitorRows([row])[0] }),
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error);
  } catch (e) {
    console.error("참관 신청 시트 기록 실패:", e.message);
  }
}
