import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// 관리자가 저장한 직후 사이트 화면을 바로 새로 만든다 (관리자만)
export async function POST() {
  const sb = await supabaseServer();
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ ok: false }, { status: 403 });
  revalidateTag("site");
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
