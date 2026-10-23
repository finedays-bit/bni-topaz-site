import { links, members, rpsSheet } from "@/lib/data";
import { fetchRpi } from "@/lib/sheets";
import Icon from "../Icon";

export const metadata = { title: "RPS · BNI 토파즈 챕터" };
export const revalidate = 600;

const steps = [
  { icon: "eye", en: "Visibility", ko: "아는 단계" },
  { icon: "handshake", en: "Credibility", ko: "신뢰 단계" },
  { icon: "trend", en: "Profit", ko: "수익 단계" },
];

function RpsButton() {
  return (
    <a className="btn btn-main rps-go" href={links.rps} target="_blank" rel="noopener noreferrer">
      RPS 바로가기 <Icon name="arrow" size={16} />
    </a>
  );
}

export default async function RpsPage() {
  let rpi = null;
  try { rpi = await fetchRpi(rpsSheet.csv, members.map((m) => m.name)); } catch { rpi = null; }
  const rate = rpi && rpi.count ? Math.round((rpi.joined / rpi.count) * 100) : 0;

  return (
    <main>
      <div className="page-head wrap">
        <p className="eyebrow">RPS</p>
        <h1>리퍼럴 파트너 스코어보드</h1>
        <p className="muted">파트너별 성과를 추적하고 지속적인 관계를 개선합니다.</p>
      </div>

      <section className="wrap rps">
        <div className="panel">
          <h3 className="panel-h"><Icon name="gauge" /> 토파즈 챕터 RPI</h3>
          {rpi ? (
            <>
              <div className="rpi">
                <div>
                  <small>리퍼럴 파트너 지수</small>
                  <p><b>{rpi.rpi.toFixed(2)}</b><span>/ 4</span></p>
                  <div className="bar"><i style={{ width: `${Math.min(rpi.rpi / 4, 1) * 100}%` }} /></div>
                </div>
                <div>
                  <small>참여율</small>
                  <p><b>{rate}%</b><span>{rpi.joined}/{rpi.count}명</span></p>
                  <div className="bar"><i style={{ width: `${rate}%` }} /></div>
                </div>
              </div>
              <p className="panel-note">참여 = 전문분야·나의 핵심 고객층 입력 완료 멤버 · BNI코리아 RPS 챕터 RPI 시트 기준(현재 토파즈 멤버만), 10분마다 갱신</p>
            </>
          ) : (
            <p className="panel-note">지금은 RPI 시트를 읽지 못했습니다. 잠시 후 다시 확인해 주세요.</p>
          )}
        </div>

        <div className="panel">
          <p className="rps-intro">
            <b>나의 파워팀_리퍼럴 파트너 스코어보드(RPS)</b>는 BNI코리아 대표님들의 비즈니스 확장 경험을 측정하고 기록하는 데 도움을 주는 기록 툴로,
            성취 경험을 향상시킴은 물론, 비즈니스 인사이트를 도출할 수 있는 의미 있는 성장 데이터를 제공하기 위해 기획되었습니다.
          </p>
          <RpsButton />
        </div>

        <h2 className="sub-h">관계 단계</h2>
        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={s.en}>
              <span className="edu-icon"><Icon name={s.icon} /></span>
              <div><small>STEP {i + 1}</small><b>{s.en}</b><span>{s.ko}</span></div>
            </div>
          ))}
        </div>
        <p className="step-note">수익 단계는 <em>T2 상호거래 2회 이상</em> 달성 시 입력합니다.</p>

        <div className="duo">
          <div className="panel row">
            <span className="edu-icon"><Icon name="target" /></span>
            <div><b>나의 파워팀 미션</b><p>진짜 비즈니스 파트너 <em>4명</em> 만들기</p></div>
          </div>
          <div className="panel row">
            <span className="edu-icon"><Icon name="user" /></span>
            <div><b>리퍼럴 파트너가 없다면?</b><p>전문분야, 나의 핵심 고객층만 입력해도 참여됩니다.</p></div>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-h"><Icon name="key" /> RPS 로그인 안내</h3>
          <dl className="login">
            <dt>ID</dt><dd>BNI 가입한 Email</dd>
            <dt>Password</dt><dd>BNI 가입한 휴대폰 번호 뒤 4자리</dd>
          </dl>
          <RpsButton />
        </div>
      </section>
    </main>
  );
}
