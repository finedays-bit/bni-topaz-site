import Link from "next/link";

// 찾는 전문분야 — 최우선 5개는 크게 내세우고, 나머지는 '이런 분야도 찾고 있어요'로 잇는다
// full: '찾는 분야' 페이지용 ('자세히 보기' 링크 없음)
export default function WantedFields({ wanted, full = false }) {
  const top = wanted?.top ?? [], also = wanted?.also ?? [];
  if (!top.length && !also.length) return null;
  return (
    <div className="wanted">
      {top.length > 0 && (
        <ol className="wanted-top">
          {top.map((f, i) => (
            <li key={f.name}>
              <span className="wanted-no">{String(i + 1).padStart(2, "0")}</span>
              <b>{f.name}</b>
              {f.desc && <small>{f.desc}</small>}
            </li>
          ))}
        </ol>
      )}
      {also.length > 0 && (
        <div className="wanted-also">
          <p>이런 분야의 대표님도 기다리고 있어요</p>
          <ul>{also.map((f) => <li key={f.name} title={f.desc || undefined}>{f.name}</li>)}</ul>
        </div>
      )}
      {!full && <Link href="/wanted" className="wanted-more">찾는 분야 자세히 보기 →</Link>}
    </div>
  );
}
