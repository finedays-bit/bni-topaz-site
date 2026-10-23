import Link from "next/link";
import { notFound } from "next/navigation";
import { getPeople, getPerson } from "@/lib/store";
import CardActions from "../../CardActions";
import { cardSrc } from "@/lib/media";

// 명함 공유 링크: /card/이름 — 카카오톡 등에 붙이면 명함 이미지가 미리보기로 뜬다
export const revalidate = 60;

export async function generateStaticParams() {
  return (await getPeople()).map((p) => ({ name: p.name }));
}

export async function generateMetadata({ params }) {
  const p = await getPerson(decodeURIComponent((await params).name));
  if (!p) return {};
  const title = `${p.company} ${p.name} · BNI 토파즈 챕터`;
  return {
    title,
    description: `${p.specialty} — BNI 토파즈 챕터 멤버 명함`,
    openGraph: { title, description: p.specialty, images: p.card ? [cardSrc(p.card)] : [] },
  };
}

export default async function CardPage({ params }) {
  const p = await getPerson(decodeURIComponent((await params).name));
  if (!p) notFound();
  return (
    <main className="wrap card-page">
      <p className="eyebrow">BNI Topaz Member</p>
      <h1><small>{p.company}</small>{p.name}</h1>
      <p className="muted">{p.specialty}</p>
      {p.card
        ? <img className="card-page-img" src={cardSrc(p.card)} alt={`${p.company} ${p.name} 명함`} />
        : <p className="placeholder card-page-img"><span className="ph-tag">명함 준비 중</span></p>}
      <CardActions p={p} />
      <Link href="/members" className="btn btn-line card-page-more">토파즈 멤버 전체 보기</Link>
    </main>
  );
}
