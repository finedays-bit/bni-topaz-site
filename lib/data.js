// 1단계 샘플 데이터. 2단계에서 Supabase(관리자 페이지 입력)로 옮긴다.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const chapter = {
  name: "TOPAZ",
  region: "동탄",
  slogan: "A Brighter Tomorrow Together",
  cheer: ["토파즈!", "가자!"],
  meetingDay: "매주 화요일",
  meetingTime: "AM 6:30 ~ 9:00",
  venue: "경기 화성시 동탄기흥로 593-8 콜마바이오텍 3층",
  // 출처: 부의장 보고 261020_부의장보고_챕터현황.pptx (2026.10.20 주간회의) — 2단계부터 관리자 입력
  stats: [
    { label: "누적 리퍼럴", value: "2,813", unit: "건" },
    { label: "누적 계약 총액", value: "46억+", unit: "원" },
  ],
};

export const powerTeams = [
  { id: "pt1", name: "법인 경영 지원", customer: "창업·성장하는 법인 대표" },
  { id: "pt2", name: "공간 오픈·사무실 세팅", customer: "사무실·매장을 새로 여는 법인" },
  { id: "pt3", name: "자동차", customer: "차를 사는 대표·법인 담당자" },
  { id: "pt4", name: "제조·산업", customer: "공장·물류센터" },
  { id: "pt5", name: "개인 라이프·웰니스", customer: "40~60대 개인" },
];

// 명함은 npm run cards 가 파일명의 이름으로 연결한다 (lib/cards.json). 없으면 '명함 준비 중'
export const members = [
  { name: "김나래", company: "세무회계동행", specialty: "세무기장", team: "pt1" },
  { name: "이호준", company: "법무법인 대진", specialty: "변호사", team: "pt1" },
  { name: "신현준", company: "엘엔경영파트너스", specialty: "정책자금·정부지원금", team: "pt1" },
  { name: "박정애", company: "인카금융서비스", specialty: "생명보험", team: "pt1" },
  { name: "백소현", company: "에이플러스에셋", specialty: "손해보험", team: "pt1" },

  { name: "박진우", company: "HSC", specialty: "상업 인테리어", team: "pt2" },
  { name: "이도현", company: "커튼명장 용인점", specialty: "커튼·블라인드", team: "pt2" },
  { name: "김현정", company: "식물가게 서화", specialty: "꽃·실내식물", team: "pt2" },
  { name: "김진훈", company: "에스비솔루션", specialty: "종합 청소", team: "pt2" },
  { name: "김광호", company: "파인데이즈", specialty: "문구·사무용품", team: "pt2" },
  { name: "임현식", company: "아이엠솔루션", specialty: "PC·복합기", team: "pt2" },
  { name: "최현호", company: "이페이솔루션", specialty: "통신제품", team: "pt2" },
  { name: "김봉석", company: "대박폰", specialty: "휴대폰", team: "pt2" },

  { name: "김영선", company: "좋은자동차", specialty: "중고자동차", team: "pt3" },
  { name: "최웅식", company: "HS효성 더클래스", specialty: "수입차", team: "pt3" },
  { name: "김영진", company: "동탄빵빵스팀", specialty: "스팀세차", team: "pt3" },

  { name: "문종환", company: "베스텍(BESTEC)", specialty: "금형·부품 가공", team: "pt4" },
  { name: "이지수", company: "스바이즈", specialty: "H빔 철강·용접", team: "pt4" },
  { name: "정찬우", company: "(주)일호피앤피", specialty: "박스 제조", team: "pt4" },

  { name: "김연진", company: "암웨이", specialty: "건강기능식품", team: "pt5" },
  { name: "황미영", company: "공간비유", specialty: "서점·북테라피", team: "pt5" },
  { name: "김광섭", company: "우리동네 골프상회", specialty: "골프용품", team: "pt5" },
  { name: "김성필", company: "(주)루인", specialty: "온라인 쇼핑몰", team: "pt5" },

  // 신규 멤버 (2026-10-23 명함으로 확인) — 파워팀 미정이라 '전체'에만 표시
  { name: "이주호", company: "새빛축산유통", specialty: "축산물 도·소매", team: null },
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

export const links = {
  bniConnect: "https://www.bniconnectglobal.com/login/",
  rps: "https://www.rps-bnikorea.com/",
};

// 교육 정보 — 링크·도서목록·점수기준은 2단계 관리자 페이지에서 바꾼다
export const education = {
  items: [
    {
      icon: "calendar",
      title: "BNI 코리아 교육 일정표",
      desc: "BNI 코리아 공식 교육 일정 안내",
      url: "https://bnikorea.com/ko/training-bnikorea",
      badges: ["1시간당 교육점수 1점 획득"],
    },
    {
      icon: "play",
      title: "BNI 코리아 팟캐스트",
      desc: "BNI 코리아 공식 유튜브 팟캐스트 재생목록",
      url: "https://www.youtube.com/playlist?list=PLVM0CBTOzUHwA2TnyfW6GO9-XH8vdovWq",
      badges: ["5회 청취 교육점수 1점 획득", "6개월 최대 5점까지"],
    },
    {
      icon: "book",
      title: "토파즈 챕터 도서목록",
      desc: "챕터 추천 도서 목록",
      url: "", // 도서 선정 후 구글 시트 주소를 넣는다 (비어 있으면 '선정 중')
      pending: "도서 선정 중",
      badges: ["도서별 5점 또는 1점"],
    },
    {
      icon: "people",
      title: "포럼 참여",
      desc: "BNI 포럼 참여로 교육점수 획득",
      badges: ["MGF(멤버 그로스 포럼) 본방 시청 교육점수 1점", "LT포럼 참여 교육점수 1점 (월 1점 인정)"],
      action: { label: "LT포럼 입장 (Zoom)", url: "https://bnionline.zoom.us/j/97998882123" },
    },
  ],
  // 월간 교육점수 → 트래픽 점수. 구글 시트(웹에 게시한 CSV 주소)를 넣으면 그 표를 대신 보여준다
  scoreSheetCsv: "",
  scoreTable: [
    ["0 ~ 10점 미만", "트래픽 0점"],
    ["10 ~ 20점 미만", "트래픽 5점"],
    ["20점 이상", "트래픽 10점"],
  ],
};

// RPS 챕터 RPI 시트 (링크 보기 공개 → CSV로 10분마다 읽음)
export const rpsSheet = {
  csv: "https://docs.google.com/spreadsheets/d/1L-h0x1A802MSER23GQqlXJMmhRaeTDpVBjtmzniCjAo/export?format=csv&gid=564805641",
};

export function formatKoreanDate(iso) {
  const d = new Date(iso + "T00:00:00+09:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}
