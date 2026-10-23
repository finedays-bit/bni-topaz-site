-- 참관 신청 저장 칸 (schema.sql 에도 같은 내용이 있다). SQL Editor 에 붙여 넣고 Run — 여러 번 실행해도 안전
create table if not exists public.visitors (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  name          text not null check (char_length(name) between 1 and 40),
  phone         text not null check (char_length(phone) between 8 and 20),
  company       text not null default '' check (char_length(company) <= 80),
  field         text not null default '' check (char_length(field) <= 80),
  visit_date    date,
  inviter       text check (char_length(inviter) <= 80),
  consent       boolean not null check (consent),
  notified      boolean not null default false,  -- 운영진 메일 발송 성공 여부
  status        text not null default '신규',     -- 신규 / 연락함 / 참석 / 가입 / 취소
  memo          text
);

alter table public.visitors enable row level security;

-- 누구나 신청(추가)만 가능, 보기·고치기·지우기는 관리자만
drop policy if exists "누구나 참관 신청" on public.visitors;
create policy "누구나 참관 신청" on public.visitors for insert with check (status = '신규' and memo is null);
drop policy if exists "관리자만 신청 보기" on public.visitors;
create policy "관리자만 신청 보기" on public.visitors for select using (public.is_admin());
drop policy if exists "관리자만 신청 고치기" on public.visitors;
create policy "관리자만 신청 고치기" on public.visitors for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "관리자만 신청 지우기" on public.visitors;
create policy "관리자만 신청 지우기" on public.visitors for delete using (public.is_admin());
