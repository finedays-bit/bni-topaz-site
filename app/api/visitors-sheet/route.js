import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { VISITOR_HEADER, visitorRows } from "@/lib/visitorSheet";

// 관리자 구글 시트에 참관 신청 전체를 새로 써 넣고, 시트 주소를 돌려준다 (관리자만)
// VISITOR_SHEET_WEBHOOK: 시트에 붙인 Apps Script 배포 주소 (scripts/visitors-sheet.gs) — 비밀번호처럼 .env.local 에만
export async function POST() {
  const sb = await supabaseServer();
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "관리자만 쓸 수 있습니다." }, { status: 403 });
  const hook = process.env.VISITOR_SHEET_WEBHOOK;
  if (!hook) return NextResponse.json({ error: "구글 시트가 아직 연결되지 않았습니다 (.env.local 의 VISITOR_SHEET_WEBHOOK)." }, { status: 503 });

  const { data, error } = await sb.from("visitors").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: `목록을 읽지 못했습니다: ${error.message}` }, { status: 500 });

  try {
    // Apps Script 는 한 번 다른 주소로 넘겨서 답하므로 redirect 를 따라간다
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "replace", header: VISITOR_HEADER, rows: visitorRows(data) }),
      redirect: "follow",
    });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error || "시트가 거절했습니다");
    return NextResponse.json({ ok: true, url: out.url, count: data.length });
  } catch (e) {
    return NextResponse.json({ error: `구글 시트에 쓰지 못했습니다: ${e.message}` }, { status: 502 });
  }
}
