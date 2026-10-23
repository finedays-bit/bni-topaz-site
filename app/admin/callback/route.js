import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// 메일로 받은 로그인 링크가 돌아오는 곳 → 로그인 처리 후 관리자 화면으로
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/admin?error=login", url));
  }
  return NextResponse.redirect(new URL("/admin", url));
}
