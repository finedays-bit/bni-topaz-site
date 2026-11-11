// 활동 게시판 글 읽기 — Supabase posts 표 (공개된 글만). 표가 없으면 빈 목록
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function rest(path) {
  if (!URL_ || !KEY) return [];
  try {
    const res = await fetch(`${URL_}/rest/v1/${path}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      next: { revalidate: 60, tags: ["site"] },
    });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

const ORDER = "order=event_date.desc.nullslast,created_at.desc";
export const getPosts = (limit = 60) => rest(`posts?select=*&published=eq.true&${ORDER}&limit=${limit}`);
export async function getPost(id) {
  if (!/^\d+$/.test(String(id))) return null;
  const [p] = await rest(`posts?select=*&published=eq.true&id=eq.${id}`);
  return p ?? null;
}

// 2026-11-17 → 2026.11.17 (화)
const WD = "일월화수목금토";
export function postDate(p) {
  const d = p.event_date ?? p.created_at?.slice(0, 10);
  if (!d) return "";
  const [y, m, dd] = d.split("-").map(Number);
  return `${y}.${String(m).padStart(2, "0")}.${String(dd).padStart(2, "0")} (${WD[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]})`;
}

// 파일 크기 글자로
export const fileSize = (n) => (!n ? "" : n > 1048576 ? `${(n / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`);
