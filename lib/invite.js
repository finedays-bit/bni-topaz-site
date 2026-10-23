// 초대장 모임 날짜: 기본은 '다가오는 화요일' 자동 (모임이 끝나는 화요일 9시가 지나면 다음 주로)
// 휴회일(skipDates)은 건너뛰고, 자동을 끄면 관리자가 넣은 날짜(date)를 그대로 쓴다
const KST = 9 * 60 * 60 * 1000;
const iso = (d) => d.toISOString().slice(0, 10);

export function meetingDate(invite, now = new Date()) {
  if (invite.auto === false && invite.date) return invite.date;
  const weekday = invite.weekday ?? 2;       // 0=일 … 2=화
  const endHour = invite.endHour ?? 9;       // 이 시각(한국 시간)이 지나면 다음 주
  const skip = new Set(invite.skipDates ?? []);
  const k = new Date(now.getTime() + KST);   // 한국 시간을 UTC 칸에 담아 계산
  let add = (weekday - k.getUTCDay() + 7) % 7;
  if (add === 0 && k.getUTCHours() >= endHour) add = 7;
  const d = new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() + add));
  for (let i = 0; i < 10 && skip.has(iso(d)); i++) d.setUTCDate(d.getUTCDate() + 7);
  return iso(d);
}

// 참관 신청서에 보여줄 다가오는 모임 날짜 (기본 2주)
export function upcomingDates(invite, count = 2, now = new Date()) {
  const first = meetingDate(invite, now);
  if (invite.auto === false) return [first];
  const out = [first];
  while (out.length < count) out.push(meetingDate(invite, new Date(`${out.at(-1)}T12:00:00+09:00`)));
  return out;
}
