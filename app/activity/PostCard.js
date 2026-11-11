import Link from "next/link";
import { postDate } from "@/lib/posts";
import PhotoSlider from "./PhotoSlider";

// 목록용 카드: 사진 슬라이드(작게) + 날짜·제목·본문 앞부분
export default function PostCard({ post }) {
  const photos = post.photos ?? [];
  const files = post.files ?? [];
  return (
    <article className="post-card">
      <Link href={`/activity/${post.id}`} className="post-card-link" aria-label={post.title}>
        {photos.length ? <PhotoSlider photos={photos} alt={post.title} compact interval={3000} />
          : <div className="post-noimg">TOPAZ</div>}
        <div className="post-card-body">
          <time>{postDate(post)}</time>
          <h3>{post.title}</h3>
          {post.body && <p>{post.body.replace(/\s+/g, " ").slice(0, 90)}{post.body.length > 90 ? "…" : ""}</p>}
          <small>{photos.length ? `사진 ${photos.length}장` : ""}{photos.length && files.length ? " · " : ""}{files.length ? `자료 ${files.length}개` : ""}</small>
        </div>
      </Link>
    </article>
  );
}
