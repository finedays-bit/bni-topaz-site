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

// ── 초대장 종류 (일반 / MEGA BCD / MINI BCD) ────────────────────────
// 틀(디자인)은 하나, 종류마다 글자만 다르다. 관리자가 '이번 주 초대장' 탭에서 기본 글자를 고치고,
// 멤버는 '내 초대장 만들기'에서 자기 글로 다시 고칠 수 있다.
export const KINDS = { normal: "일반", mega: "MEGA BCD", mini: "MINI BCD" };

export const DEFAULT_TEXTS = {
  normal: {
    title: "INVITATION",
    sub: "귀하를 정중히 초대합니다",
    body: "BNI는 기업 경영자와 전문가들이\n비즈니스 소개를 주고받으며\n상호 간의 사업 성장을 지원하는\n세계 최대의 비즈니스 네트워크입니다.\n\n대표님의 업종에 정기적으로 고객을 소개해 드릴 수 있는 제가 신뢰하는 사업가들의 협업 모임에 초대합니다.",
  },
  mega: {
    title: "MEGA BCD",
    sub: "토파즈 MEGA BCD에 초대합니다",
    body: "평소보다 훨씬 많은 사업가들이\n한자리에 모이는 특별한 정기모임입니다.\n\n여러 업종의 대표님들을 하루에 만나고 대표님의 사업을 소개할 수 있는 자리에 제가 직접 모시고 싶습니다.",
  },
  mini: {
    title: "MINI BCD",
    sub: "토파즈 MINI BCD에 초대합니다",
    body: "편안한 분위기에서 토파즈 멤버들을\n가까이 만나 보실 수 있는 자리입니다.\n\n대표님의 업종에 꼭 맞는 분들을 소개해 드리고 싶어 초대합니다.",
  },
};

// 그 날짜 모임의 종류 (관리자가 정모 일정표에서 정함, 없으면 일반)
export const kindOf = (invite, date) => (KINDS[invite.kinds?.[date]] ? invite.kinds[date] : "normal");

// 종류별 기본 글자 (관리자가 고친 글자가 있으면 그것)
export const textsFor = (invite, kind) => ({ ...DEFAULT_TEXTS[kind] ?? DEFAULT_TEXTS.normal, ...invite.texts?.[kind] });

// 정모 일정표에 보여 줄 날짜: 휴회도 포함한 앞으로의 모임 요일 (관리자용)
export function scheduleDates(invite, count = 8, now = new Date()) {
  const first = meetingDate({ ...invite, auto: true, skipDates: [] }, now);
  const out = [first];
  while (out.length < count) {
    const d = new Date(`${out.at(-1)}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 7);
    out.push(iso(d));
  }
  return out;
}

// 오늘(한국 시간)부터 그 날짜까지 — "다음주", "2주 후", "3주 후"
export function weeksLabel(date, now = new Date()) {
  const today = iso(new Date(now.getTime() + KST));
  const days = Math.round((Date.parse(date) - Date.parse(today)) / 864e5);
  if (days <= 0) return "오늘";
  const w = Math.ceil(days / 7);
  return w <= 1 ? "다음주" : `${w}주 후`;
}

// 멤버가 만든 초대장 글자 길이 제한 (저장·주소 공통)
export const LIMITS = { inviter: 80, to: 40, title: 30, sub: 60, body: 600 };
