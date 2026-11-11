-- 멤버가 만든 초대장 (짧은 주소 /invite/코드). SQL Editor 에 붙여 넣고 Run — 여러 번 실행해도 안전
-- 이 표가 없어도 사이트는 동작한다 (그때는 글자를 주소에 담은 긴 링크로 만들어짐)
create table if not exists public.invitations (
  code          text primary key check (code ~ '^[a-z0-9]{6,12}$'),
  created_at    timestamptz not null default now(),
  meeting_date  date not null,
  kind          text not null default 'normal' check (kind in ('normal', 'mega', 'mini')),
  inviter       text check (char_length(inviter) <= 80),
  to_name       text check (char_length(to_name) <= 40),
  title         text not null default '' check (char_length(title) <= 30),
  sub           text not null default '' check (char_length(sub) <= 60),
  body          text not null default '' check (char_length(body) <= 600)
);

alter table public.invitations enable row level security;

-- 누구나 만들기·보기(링크를 아는 사람), 지우기는 관리자만
drop policy if exists "누구나 초대장 만들기" on public.invitations;
create policy "누구나 초대장 만들기" on public.invitations for insert with check (true);
drop policy if exists "누구나 초대장 보기" on public.invitations;
create policy "누구나 초대장 보기" on public.invitations for select using (true);
drop policy if exists "관리자만 초대장 지우기" on public.invitations;
create policy "관리자만 초대장 지우기" on public.invitations for delete using (public.is_admin());
