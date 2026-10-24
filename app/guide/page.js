import Link from "next/link";

export const metadata = {
  title: "이용 안내 · BNI 토파즈 챕터",
  description: "토파즈 챕터 사이트 이용 안내 — 비지터 초대, 명함 보내기, 연락처 저장까지 쉽게 따라 하기",
};

// 멤버용 사이트 이용 안내 (연세 있는 분도 따라 하기 쉽게: 큰 글씨, 한 번에 한 가지, 버튼 글자 그대로)
// 같은 내용을 인쇄용 PDF로도 쓴다 (public/guide/토파즈_사이트_이용안내.pdf — 이 페이지를 인쇄해서 만든다)
const B = ({ children }) => <span className="g-btn">{children}</span>;
const M = ({ children }) => <span className="g-menu">{children}</span>;

const sections = [
  {
    id: "home",
    title: "휴대폰 첫 화면에 사이트 넣기",
    lead: "한 번만 해 두면 앱처럼 바로 열 수 있어요.",
    groups: [
      {
        name: "갤럭시 (삼성 인터넷)",
        steps: [<>아래쪽 <B>≡</B> (줄 세 개) 버튼을 누릅니다.</>, <><B>+ 현재 페이지 추가</B> → <B>홈 화면</B>을 누릅니다.</>],
      },
      {
        name: "갤럭시 (크롬)",
        steps: [<>오른쪽 위 <B>⋮</B> (점 세 개) 버튼을 누릅니다.</>, <><B>홈 화면에 추가</B> → <B>추가</B>를 누릅니다.</>],
      },
      {
        name: "아이폰 (사파리)",
        steps: [<>아래쪽 <B>공유</B> 버튼(네모에 화살표 ↑)을 누릅니다.</>, <><B>홈 화면에 추가</B> → <B>추가</B>를 누릅니다.</>],
      },
    ],
  },
  {
    id: "invite",
    title: "비지터 초대하기",
    lead: "가장 많이 쓰는 기능이에요. 초대장은 매주 날짜가 저절로 바뀌니, 같은 링크를 계속 보내시면 됩니다.",
    steps: [
      <>사이트 첫 화면에서 아래로 조금 내리면 <b>초대장</b>이 보입니다.</>,
      <>초대장 아래 <B>카카오톡 등으로 공유</B>를 누릅니다.</>,
      <>카카오톡을 고르고, 초대할 분을 골라 보냅니다.</>,
    ],
    tip: <>공유 버튼이 잘 안 되면 <B>초대장 링크 복사</B>를 누른 뒤, 카카오톡 대화창을 <b>길게 눌러 [붙여넣기]</b> 하세요.</>,
    note: <>보낼 때 <b>“신청서의 ‘초대한 멤버’에서 제 이름을 골라 주세요”</b>라고 한마디 덧붙여 주세요. 누가 초대했는지 운영진이 알 수 있어요.</>,
  },
  {
    id: "visitor",
    title: "비지터는 이렇게 신청해요",
    lead: "초대받은 분이 물어보시면 이렇게 알려 드리세요.",
    steps: [
      <>받은 링크를 누르면 초대장이 열립니다.</>,
      <>아래로 내려 <b>참관 신청</b> 칸에 이름·휴대폰·회사명·사업 분야를 적습니다.</>,
      <>참관 날짜와 <b>초대한 멤버</b>를 고르고, 동의에 체크한 뒤 <B>참관 신청하기</B>를 누릅니다.</>,
    ],
    tip: <>참가비 계좌는 <B>계좌번호 복사</B>를 누르면 숫자만 복사되어 은행 앱에 바로 붙여 넣을 수 있어요. 모임 장소는 주소 옆 <B>네이버 지도 ↗</B>를 누르면 길찾기가 열려요.</>,
    note: <>신청이 들어오면 비지터 호스트 리더와 의장단에게 알림 메일이 자동으로 갑니다.</>,
  },
  {
    id: "mycard",
    title: "내 명함 보내기",
    steps: [
      <>위쪽 메뉴에서 <M>멤버</M>를 누릅니다.</>,
      <>내 명함을 찾아 누르면 크게 열립니다.</>,
      <><B>링크 복사</B>를 누르고, 카카오톡 대화창에 붙여 넣어 보냅니다.</>,
    ],
    tip: <>명함을 사진으로 보내고 싶으면 <B>명함 다운로드</B>를 누르세요. 휴대폰 사진첩(갤러리)에 저장됩니다.</>,
  },
  {
    id: "contact",
    title: "다른 멤버에게 연락하기",
    steps: [
      <><M>멤버</M>에서 연락할 분의 명함을 누릅니다.</>,
      <><B>전화하기</B>를 누르면 바로 전화가 걸립니다.</>,
      <><B>연락처 저장</B>을 누르면 휴대폰 연락처에 이름·회사·번호가 한 번에 저장됩니다.</>,
    ],
    tip: <>멤버 화면 위쪽의 <b>파워팀 버튼</b>을 누르면 같은 팀 멤버만 모아 볼 수 있어요.</>,
  },
  {
    id: "wanted",
    title: "우리 챕터가 찾는 분야 보기",
    steps: [
      <>위쪽 메뉴에서 <M>찾는 분야</M>를 누릅니다.</>,
      <>지금 가장 필요한 다섯 분야와, 그 밖에 찾는 분야가 나옵니다.</>,
      <>주변에 그 일을 하시는 대표님이 떠오르면 초대장을 보내 주세요.</>,
    ],
  },
  {
    id: "links",
    title: "자주 쓰는 바로가기",
    list: [
      <><M>교육 정보</M> — 교육 점수 기준과 LT 포럼 등 교육 안내</>,
      <><M>RPS</M> — RPS 사이트로 바로 가기</>,
      <><M>리더십팀</M> — 의장단과 코디네이터 얼굴·직책</>,
      <>오른쪽 위 빨간 <B>BNI Connect</B> — BNI Connect 로그인</>,
    ],
  },
  {
    id: "help",
    title: "내 정보가 틀렸을 때",
    lead: "명함·전화번호·회사 이름 등이 잘못 나오면 아래 분께 말씀해 주세요. 사이트 관리는 관리자만 할 수 있어요.",
    list: [<><b>ST 황미영</b></>, <><b>PR 코디네이터 박진우</b></>],
    tip: <>바뀐 내용이 안 보이면 화면을 아래로 당겨 <b>새로고침</b> 해 보세요.</>,
  },
];

function Steps({ steps }) {
  return <ol className="g-steps">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>;
}

export default function GuidePage() {
  return (
    <main className="guide">
      <div className="page-head wrap">
        <p className="eyebrow">Guide</p>
        <h1>사이트 이용 안내</h1>
        <p className="muted">토파즈 멤버라면 누구나 — 천천히 따라 해 보세요.</p>
      </div>

      <div className="wrap g-wrap">
        <div className="g-address">
          <small>우리 챕터 사이트 주소</small>
          <b>bni-topazchapter.vercel.app</b>
          <span>카카오톡 단톡방 공지에 걸어 두면 편해요.</span>
        </div>

        <nav className="g-toc" aria-label="목차">
          {sections.map((s, i) => <a key={s.id} href={`#${s.id}`}><b>{i + 1}</b>{s.title}</a>)}
        </nav>

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="g-sec">
            <h2><span className="g-no">{i + 1}</span>{s.title}</h2>
            {s.lead && <p className="g-lead">{s.lead}</p>}
            {s.groups?.map((g) => (
              <div key={g.name} className="g-group">
                <h3>{g.name}</h3>
                <Steps steps={g.steps} />
              </div>
            ))}
            {s.steps && <Steps steps={s.steps} />}
            {s.list && <ul className="g-list">{s.list.map((x, j) => <li key={j}>{x}</li>)}</ul>}
            {s.tip && <p className="g-tip"><b>도움말</b>{s.tip}</p>}
            {s.note && <p className="g-note">{s.note}</p>}
          </section>
        ))}

        <div className="g-end no-print">
          <a className="btn btn-line" href="/guide/토파즈_사이트_이용안내.pdf" download>인쇄용 PDF 받기</a>
          <Link href="/" className="btn btn-main">첫 화면으로</Link>
        </div>
      </div>
    </main>
  );
}
