// 참관 신청 알림 메일 — 공용 Gmail 에서 운영진에게 보낸다 (서버에서만 사용)
// 받는 사람: 비지터 호스트 리더 + 신청서에서 고른 '초대한 멤버' + 공용 관리자 메일(기록용)
import nodemailer from "nodemailer";

export const NOTIFY_ROLES = ["비지터 호스트 리더"];

// inviter: 신청서 값 "홍길동 (회사명)" — 괄호 앞 이름으로 멤버 이메일을 찾는다 (직접 입력한 타 챕터 멤버는 못 찾으면 빠짐)
export function recipients(leadership, people, inviter, roles = NOTIFY_ROLES) {
  const holders = (leadership?.groups ?? []).flatMap((g) => g.people).filter((p) => roles.includes(p.role));
  const inviterName = inviter?.replace(/\s*\(.*$/, "").trim();
  const list = [
    ...holders.map((p) => ({ role: p.role, name: p.name })),
    ...(inviterName ? [{ role: "초대한 멤버", name: inviterName }] : []),
  ]
    .map((r) => ({ ...r, email: people.find((m) => m.name === r.name)?.email }))
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
      <p style="color:#4a5874;font-size:13px;margin-top:16px">비지터 호스트 리더와 초대한 멤버에게 자동으로 보낸 메일입니다. 관리자 화면 '참관 신청' 탭에서도 볼 수 있습니다.</p>
    </div>`,
  });
}
