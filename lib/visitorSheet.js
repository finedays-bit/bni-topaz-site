// 참관 신청 목록 → 표(머리줄 + 줄들). 관리자 CSV 내려받기와 구글 시트가 같은 칸 순서를 쓴다
import { formatKoreanDate } from "./data";

export const VISITOR_HEADER = ["신청일시", "이름", "휴대폰", "회사명", "사업 분야", "참관 예정일", "초대한 멤버", "진행 상태", "메모", "알림 메일"];

export function visitorRows(rows) {
  return rows.map((r) => [
    new Date(r.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" }),
    r.name, r.phone, r.company, r.field,
    r.visit_date ? formatKoreanDate(r.visit_date) : "",
    r.inviter ?? "", r.status ?? "", r.memo ?? "", r.notified ? "보냄" : "못 보냄",
  ]);
}

// 엑셀에서 한글이 깨지지 않게 맨 앞에 BOM(﻿)을 붙인다
export function toCsv(table) {
  const cell = (v) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + table.map((row) => row.map(cell).join(",")).join("\r\n");
}
