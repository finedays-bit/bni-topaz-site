// 관리자 편집 권한 — 마스터가 관리자마다 고를 수 있다 (supabase/admin-perms.sql 과 같은 이름)
// perms 가 비어 있으면(null) 전체 권한. 마스터는 항상 전체 + '관리자 계정' 탭
export const PERMS = [
  ["visitors", "참관 신청"],
  ["members", "멤버·명함·사진 옮기기"],
  ["leadership", "리더십팀"],
  ["wanted", "찾는 분야"],
  ["invite", "초대장·정모 일정"],
  ["about", "챕터 소개글"],
  ["chapter", "구호·모임·숫자"],
  ["education", "교육 정보"],
  ["links", "RPS·링크"],
];
export const ALL_PERMS = PERMS.map(([k]) => k);

// 탭 → 필요한 권한 (도움말은 누구나)
export const TAB_PERM = { visitors: "visitors", members: "members", migrate: "members", leadership: "leadership", wanted: "wanted", invite: "invite", about: "about", chapter: "chapter", education: "education", links: "links" };

export const canUse = (access, tab) =>
  tab === "help" || (tab === "accounts" ? access.master : access.master || !access.perms || access.perms.includes(TAB_PERM[tab]));

export const permLabel = (perms) =>
  !perms || ALL_PERMS.every((k) => perms.includes(k)) ? "전체 권한" : perms.length ? PERMS.filter(([k]) => perms.includes(k)).map(([, l]) => l).join(", ") : "권한 없음";
