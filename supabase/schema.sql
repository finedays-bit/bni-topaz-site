-- BNI 토파즈 사이트 저장 공간 설계도
-- Supabase → SQL Editor 에 붙여 넣고 Run. 여러 번 실행해도 안전하다(이미 있으면 건너뜀).
-- 규칙: 누구나 읽기 가능 / 고치기는 admins 표에 있는 메일로 로그인한 사람만

-- 1. 관리자 명단 ------------------------------------------------------------
create table if not exists public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- 지금 로그인한 사람이 관리자인지 (보안 규칙에서 사용)
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 2. 멤버 -------------------------------------------------------------------
create table if not exists public.members (
  id         bigint generated always as identity primary key,
  name       text not null unique,
  company    text not null default '',
  specialty  text not null default '',
  team       text,                       -- 파워팀 id (없으면 '전체'에만)
  phone      text,                       -- 휴대폰
  phone2     text,                       -- 두 번째 휴대폰
  email      text,
  card       text,                       -- 명함 이미지 (보관함 주소, 또는 옛 파일 이름)
  face       text,                       -- 리더십팀 얼굴 사진 (보관함 주소)
  sort       int not null default 0,     -- 화면 순서
  active     boolean not null default true,
  leader_only boolean not null default false, -- 멤버가 아닌 리더십팀(디렉터·앰배서더): 멤버 목록엔 안 나옴
  updated_at timestamptz not null default now()
);
alter table public.members add column if not exists leader_only boolean not null default false;
alter table public.members add column if not exists face text;

-- 3. 사이트 설정 (리더십팀·교육·초대장·실적 숫자 등, 항목마다 한 줄) ------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- 고친 시각 자동 기록
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists members_touch on public.members;
create trigger members_touch before update on public.members
  for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- 4. 보안 규칙 ---------------------------------------------------------------
alter table public.admins   enable row level security;
alter table public.members  enable row level security;
alter table public.settings enable row level security;

drop policy if exists "관리자만 관리자 명단 보기" on public.admins;
create policy "관리자만 관리자 명단 보기" on public.admins for select using (public.is_admin());
drop policy if exists "관리자만 관리자 추가·삭제" on public.admins;
create policy "관리자만 관리자 추가·삭제" on public.admins for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "누구나 멤버 보기" on public.members;
create policy "누구나 멤버 보기" on public.members for select using (true);
drop policy if exists "관리자만 멤버 고치기" on public.members;
create policy "관리자만 멤버 고치기" on public.members for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "누구나 설정 보기" on public.settings;
create policy "누구나 설정 보기" on public.settings for select using (true);
drop policy if exists "관리자만 설정 고치기" on public.settings;
create policy "관리자만 설정 고치기" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- 5. 사진 보관함 (명함·얼굴) — 누구나 보기, 관리자만 올리기 -------------------
insert into storage.buckets (id, name, public)
values ('cards', 'cards', true), ('faces', 'faces', true)
on conflict (id) do nothing;

drop policy if exists "관리자만 사진 올리기" on storage.objects;
create policy "관리자만 사진 올리기" on storage.objects for insert
  with check (bucket_id in ('cards', 'faces') and public.is_admin());
drop policy if exists "관리자만 사진 바꾸기" on storage.objects;
create policy "관리자만 사진 바꾸기" on storage.objects for update
  using (bucket_id in ('cards', 'faces') and public.is_admin());
drop policy if exists "관리자만 사진 지우기" on storage.objects;
create policy "관리자만 사진 지우기" on storage.objects for delete
  using (bucket_id in ('cards', 'faces') and public.is_admin());

-- 6. 참관 신청 ------------------------------------------------------------
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
