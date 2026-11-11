-- 활동 게시판 (사진 슬라이드 + 자료). admin-perms.sql 을 먼저 실행한 뒤 SQL Editor 에 붙여 넣고 Run. 여러 번 실행해도 안전.
-- 쓰기·고치기·지우기는 '활동 게시판(activity)' 권한이 있는 관리자(마스터·전체 권한 포함)만, 보기는 공개 글만 누구나.

create table if not exists public.posts (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  title       text not null check (char_length(title) between 1 and 100),
  event_date  date,
  body        text not null default '' check (char_length(body) <= 5000),
  photos      jsonb not null default '[]'::jsonb,   -- [{url, path, caption}] 순서대로 슬라이드
  files       jsonb not null default '[]'::jsonb,   -- [{url, path, name, size}]
  published   boolean not null default true
);

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

drop policy if exists "공개 글은 누구나 보기" on public.posts;
create policy "공개 글은 누구나 보기" on public.posts for select using (published or public.has_perm('activity'));
drop policy if exists "게시판 권한 관리자만 쓰기" on public.posts;
create policy "게시판 권한 관리자만 쓰기" on public.posts for insert with check (public.has_perm('activity'));
drop policy if exists "게시판 권한 관리자만 고치기" on public.posts;
create policy "게시판 권한 관리자만 고치기" on public.posts for update using (public.has_perm('activity')) with check (public.has_perm('activity'));
drop policy if exists "게시판 권한 관리자만 지우기" on public.posts;
create policy "게시판 권한 관리자만 지우기" on public.posts for delete using (public.has_perm('activity'));

-- 사진·자료 보관함 (누구나 보기, 한 파일 20MB까지)
insert into storage.buckets (id, name, public, file_size_limit)
values ('activity', 'activity', true, 20971520)
on conflict (id) do update set public = true, file_size_limit = 20971520;

drop policy if exists "게시판 권한 관리자만 파일 올리기" on storage.objects;
create policy "게시판 권한 관리자만 파일 올리기" on storage.objects for insert with check (bucket_id = 'activity' and public.has_perm('activity'));
drop policy if exists "게시판 권한 관리자만 파일 바꾸기" on storage.objects;
create policy "게시판 권한 관리자만 파일 바꾸기" on storage.objects for update using (bucket_id = 'activity' and public.has_perm('activity'));
drop policy if exists "게시판 권한 관리자만 파일 지우기" on storage.objects;
create policy "게시판 권한 관리자만 파일 지우기" on storage.objects for delete using (bucket_id = 'activity' and public.has_perm('activity'));
