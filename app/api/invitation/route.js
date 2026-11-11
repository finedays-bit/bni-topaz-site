import { NextResponse } from "next/server";
import { getSettings } from "@/lib/store";
import { upcomingDates } from "@/lib/invite";
import { cleanInvitation, saveInvitation } from "@/lib/invitations";

// 멤버가 만든 초대장 저장 → 짧은 주소 코드 돌려주기
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 }); }
  if (body.website) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 }); // 자동 등록 프로그램 막기

  const inv = cleanInvitation(body);
  if (!inv) return NextResponse.json({ error: "모임 날짜를 골라 주세요." }, { status: 400 });
  if (!inv.inviter) return NextResponse.json({ error: "초대하는 멤버를 골라 주세요." }, { status: 400 });
  const { invite } = await getSettings();
  if (!upcomingDates(invite, 8).includes(inv.date))
    return NextResponse.json({ error: "정모 일정에 없는 날짜입니다. 새로고침 후 다시 골라 주세요." }, { status: 400 });

  try {
    const code = await saveInvitation(inv);
    return NextResponse.json({ code });
  } catch (e) {
    console.error("초대장 저장 실패:", e.message);
    return NextResponse.json({ error: "save-failed" }, { status: 503 }); // 화면에서 긴 주소로 대신 만든다
  }
}
