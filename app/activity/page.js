import { getPosts } from "@/lib/posts";
import PostCard from "./PostCard";

export const revalidate = 60;
export const metadata = { title: "활동 소식 · BNI 토파즈 챕터", description: "BNI 토파즈 챕터의 정기모임·BCD·교육·친목 활동 사진과 자료" };

export default async function ActivityPage() {
  const posts = await getPosts();
  return (
    <main className="wrap">
      <div className="page-head">
        <p className="eyebrow">Activity</p>
        <h1>토파즈 활동 소식</h1>
        <p className="muted">정기모임·BCD·교육·친목 — 토파즈의 아침을 사진과 자료로 나눕니다.</p>
      </div>
      {posts.length ? (
        <div className="post-grid">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
      ) : (
        <p className="post-empty">아직 올라온 활동 소식이 없습니다. 곧 첫 소식을 전해 드릴게요.</p>
      )}
    </main>
  );
}
