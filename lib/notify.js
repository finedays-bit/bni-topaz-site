// 참관 신청 알림 메일 — 공용 Gmail 에서 운영진에게 보낸다 (서버에서만 사용)
// 받는 사람: 리더십팀 설정에서 아래 직책을 맡은 사람의 이메일(멤버 정보) + 공용 관리자 메일
import nodemailer from "nodemailer";

export const NOTIFY_ROLES = ["비지터 호스트 리더", "의장", "부의장", "ST"];

export function recipients(leadership, people, roles = NOTIFY_ROLES) {
  const holders = (leadership?.groups ?? []).flatMap((g) => g.people).filter((p) => roles.includes(p.role));
  const list = holders
    .map((p) => ({ role: p.role, name: p.name, email: people.find((m) => m.name === p.name)?.email }))
    .filter((r) => r.email);
  const admin = process.env.ADMIN_EMAIL;
  // 시험 중(NOTIFY_TEST=1)에는 운영진에게 보내지 않고 공용 메일로만
  if (process.env.NOTIFY_TEST === "1") return { list, emails: admin ? [admin] : [] };
  const emails = [...new Set([...list.map((r) => r.email), ...(admin ? [admin] : [])])];
  return { list, emails };
}

export function mailReady() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendVisitMail(to, v, whenText) {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, "") },
  });
  const rows = [
    ["이름", v.name],
    ["휴대폰", v.phone],
    ["회사명", v.company],
    ["사업 분야", v.field],
    ["참관 예정일", whenText],
    ["초대한 멤버", v.inviter || "-"],
  ];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  await transport.sendMail({
    from: `"BNI 토파즈 챕터" <${process.env.GMAIL_USER}>`,
    to: to.join(", "),
    subject: `[토파즈 참관 신청] ${v.name} · ${v.company || v.field || ""} (${whenText})`,
    text: rows.map(([k, x]) => `${k}: ${x}`).join("\n") + "\n\n관리자 화면 '참관 신청' 탭에서도 볼 수 있습니다.",
    html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.7">
      <h2 style="color:#173c86;margin:0 0 12px">새 참관 신청이 들어왔습니다</h2>
      <table style="border-collapse:collapse">${rows
        .map(([k, x]) => `<tr><th style="text-align:left;padding:6px 14px 6px 0;color:#4a5874;font-weight:500">${k}</th><td style="padding:6px 0"><b>${esc(x)}</b></td></tr>`)
        .join("")}</table>
      <p style="color:#4a5874;font-size:13px;margin-top:16px">비지터 호스트 리더·의장단에게 자동으로 보낸 메일입니다. 관리자 화면 '참관 신청' 탭에서도 볼 수 있습니다.</p>
    </div>`,
  });
}
