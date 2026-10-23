// 관리자 화면에서 쓰는 Supabase 연결 (로그인 정보는 브라우저 쿠키에 보관)
import { createBrowserClient } from "@supabase/ssr";

let client;
export function supabaseBrowser() {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  return client;
}
