import { fetchCsv } from "@/lib/sheets";
import { getSettings } from "@/lib/store";
import Icon from "../Icon";

export const metadata = { title: "교육 정보 · BNI 토파즈 챕터" };
export const revalidate = 60;

// 점수 기준: 관리자가 구글 시트를 연결하면 그 표(첫 줄=제목), 아니면 기본 표
async function scoreRows(education) {
  if (!education.scoreSheetCsv) return education.scoreTable;
  try {
    return (await fetchCsv(education.scoreSheetCsv)).slice(1).filter((r) => r[0]?.trim());
  } catch {
    return education.scoreTable;
  }
}

export default async function EducationPage() {
  const { education } = await getSettings();
  const rows = await scoreRows(education);
  return (
    <main>
      <div className="page-head wrap">
        <p className="eyebrow">Education</p>
        <h1>교육 정보</h1>
        <p className="muted">BNI 교육 자료와 일정 링크 모음입니다. 링크가 있는 항목을 누르면 새 탭에서 열립니다.</p>
      </div>

      <section className="wrap">
        <div className="edu-grid">
          {education.items.map((it) => {
            const body = (
              <>
                <span className="edu-icon"><Icon name={it.icon} /></span>
                <div className="edu-text">
                  <b>{it.title}</b>
                  <p>{it.desc}</p>
                  <div className="badges">
                    {it.badges.map((b) => <span key={b}>{b}</span>)}
                    {!it.url && it.pending && <span className="badge-wait">{it.pending}</span>}
                  </div>
                  {it.action && (
                    <a className="edu-action" href={it.action.url} target="_blank" rel="noopener noreferrer">
                      {it.action.label} <Icon name="external" size={15} />
                    </a>
                  )}
                </div>
                {it.url && <span className="edu-arrow"><Icon name="arrow" size={18} /></span>}
              </>
            );
            return it.url
              ? <a key={it.title} className="edu-card" href={it.url} target="_blank" rel="noopener noreferrer">{body}</a>
              : <div key={it.title} className="edu-card">{body}</div>;
          })}
        </div>

        <h2 className="sub-h">월간 교육점수 적용 기준</h2>
        <table className="score-table">
          <thead><tr><th>월간 교육점수</th><th>트래픽 점수</th></tr></thead>
          <tbody>
            {rows.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}
          </tbody>
        </table>
      </section>
    </main>
  );
}
