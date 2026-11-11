import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, postDate, fileSize } from "@/lib/posts";
import PhotoSlider from "../PhotoSlider";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await getPost(id);
  if (!p) return { title: "활동 소식 · BNI 토파즈 챕터" };
  const description = (p.body || "").replace(/\s+/g, " ").slice(0, 100);
  return {
    title: `${p.title} · BNI 토파즈 챕터`,
    description,
    openGraph: { title: p.title, description, images: p.photos?.[0]?.url ? [p.photos[0].url] : ["/brand/topaz-main.png"] },
  };
}

export default async function PostPage({ params }) {
  const { id } = await params;
  const p = await getPost(id);
  if (!p) notFound();
  const files = p.files ?? [];
  return (
    <main className="wrap post-wrap">
      <Link href="/activity" className="post-back">← 활동 소식</Link>
      <article className="post">
        <time>{postDate(p)}</time>
        <h1>{p.title}</h1>
        {p.photos?.length > 0 && <PhotoSlider photos={p.photos} alt={p.title} />}
        {p.body && <div className="post-body">{p.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}</div>}
        {files.length > 0 && (
          <section className="post-files" aria-label="첨부 자료">
            <h2>자료 {files.length}개</h2>
            <ul>
              {files.map((f) => (
                <li key={f.url}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" download={f.name}>
                    <span className="post-file-ext">{(f.name.split(".").pop() || "파일").toUpperCase().slice(0, 4)}</span>
                    <span className="post-file-name">{f.name}</span>
                    <small>{fileSize(f.size)} · 받기</small>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
