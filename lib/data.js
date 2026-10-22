// 1단계 샘플 데이터. 2단계에서 Supabase(관리자 페이지 입력)로 옮긴다.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const chapter = {
  name: "TOPAZ",
  region: "동탄",
  slogan: "A Brighter Tomorrow Together",
  meetingDay: "매주 화요일",
  meetingTime: "AM 6:30 ~ 9:00",
  venue: "경기 화성시 동탄기흥로 593-8 콜마바이오텍 3층",
  stats: [
    { label: "누적 리퍼럴", value: "2,591+", unit: "건" },
    { label: "누적 거래액", value: "28억+", unit: "원" },
  ],
};

export const powerTeams = [
  { id: "pt1", name: "법인 경영 지원", customer: "창업·성장하는 법인 대표" },
  { id: "pt2", name: "공간 오픈·사무실 세팅", customer: "사무실·매장을 새로 여는 법인" },
  { id: "pt3", name: "자동차", customer: "차를 사는 대표·법인 담당자" },
  { id: "pt4", name: "제조·산업", customer: "공장·물류센터" },
  { id: "pt5", name: "개인 라이프·웰니스", customer: "40~60대 개인" },
];

// card: public/cards/ 파일명 (저장소에는 올리지 않음). null이면 '명함 준비 중'
export const members = [
  { name: "김나래", company: "세무회계동행", specialty: "세무기장", team: "pt1", card: "kim-narae.jpg" },
  { name: "이호준", company: "법무법인 대진", specialty: "변호사", team: "pt1", card: "lee-hojun.jpg" },
  { name: "신현준", company: "엘엔경영파트너스", specialty: "정책자금·정부지원금", team: "pt1", card: null },
  { name: "박정애", company: "인카금융서비스", specialty: "생명보험", team: "pt1", card: "park-jeongae.jpg" },
  { name: "백소현", company: "에이플러스에셋", specialty: "손해보험", team: "pt1", card: null },

  { name: "박진우", company: "HSC", specialty: "상업 인테리어", team: "pt2", card: "park-jinwoo.jpg" },
  { name: "이도현", company: "커튼명장 용인점", specialty: "커튼·블라인드", team: "pt2", card: null },
  { name: "김현정", company: "서화", specialty: "꽃·실내식물", team: "pt2", card: null },
  { name: "김진훈", company: "에스비솔루션", specialty: "종합 청소", team: "pt2", card: null },
  { name: "김광호", company: "파인데이즈", specialty: "문구·사무용품", team: "pt2", card: "kim-gwangho.jpg" },
  { name: "임현식", company: "아이엠솔루션", specialty: "PC·복합기", team: "pt2", card: "lim-hyunsik.jpg" },
  { name: "최현호", company: "이페이솔루션", specialty: "통신제품", team: "pt2", card: null },
  { name: "김봉석", company: "대박폰", specialty: "휴대폰", team: "pt2", card: "kim-bongseok.jpg" },

  { name: "김영선", company: "좋은자동차", specialty: "중고자동차", team: "pt3", card: "kim-youngsun.jpg" },
  { name: "최웅식", company: "HS효성 더클래스", specialty: "수입차", team: "pt3", card: "choi-woongsik.jpg" },
  { name: "김영진", company: "동탄빵빵스팀", specialty: "스팀세차", team: "pt3", card: "kim-youngjin.png" },

  { name: "문종환", company: "베스티", specialty: "금형·부품 가공", team: "pt4", card: null },
  { name: "이지수", company: "스바이즈", specialty: "H빔 철강·용접", team: "pt4", card: "lee-jisu.jpg" },
  { name: "정찬우", company: "(주)일호피앤피", specialty: "박스 제조", team: "pt4", card: "jung-chanwoo.jpg" },

  { name: "김연진", company: "암웨이", specialty: "건강기능식품", team: "pt5", card: "kim-yeonjin.jpg" },
  { name: "황미영", company: "공간비유", specialty: "서점·북테라피", team: "pt5", card: null },
  { name: "김광섭", company: "우리동네 골프상회", specialty: "골프용품", team: "pt5", card: null },
  { name: "김성필", company: "(주)루인", specialty: "온라인 쇼핑몰", team: "pt5", card: null },
];

// 이번 주 초대장 (2단계부터 관리자 페이지에서 입력)
export const invite = {
  date: "2026-10-27",
  time: "AM 6:30 ~ 9:00",
  venue: "경기 화성시 동탄기흥로 593-8 콜마바이오텍 3층",
  dressCode: "비지니스정장",
  bring: "명함 50장",
  fee: "5만원",
  // 계좌는 공개 저장소에 남기지 않는다 (.env.local, 2단계부터 관리자 입력)
  account: process.env.INVITE_ACCOUNT || "계좌는 관리자 페이지에서 입력",
};

export function formatKoreanDate(iso) {
  const d = new Date(iso + "T00:00:00+09:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}
