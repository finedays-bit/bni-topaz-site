-- 관리자별 편집 권한 — 마스터가 '관리자 계정' 탭에서 관리자마다 고칠 수 있는 탭을 고른다.
-- admin-logins.sql 을 먼저 실행한 뒤, SQL Editor 에 붙여 넣고 Run. 여러 번 실행해도 안전.
-- perms 가 비어 있는(null) 관리자는 지금처럼 전체 권한. 마스터는 항상 전체 권한.
-- 권한 이름: visitors, members, leadership, wanted, invite, about, chapter, education, links

alter table public.admins add column if not exists perms text[];

-- 지금 로그인한 관리자가 그 권한을 가졌는지
create or replace function public.has_perm(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and (master or perms is null or p = any(perms)));
$$;

-- 내 권한 (화면에서 탭 고르기용): { master, perms }  perms 가 null 이면 전체
create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('master', a.master, 'perms', case when a.master then null else to_jsonb(a.perms) end)
  from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')) limit 1;
$$;

-- 설정 항목 → 필요한 권한
create or replace function public.setting_perm(k text)
returns text language sql immutable as $$
  select case k
    when 'invite' then 'invite' when 'chapter' then 'chapter' when 'about' then 'about'
    when 'education' then 'education' when 'links' then 'links' when 'rps_sheet' then 'links'
    when 'leadership' then 'leadership' when 'wanted' then 'wanted' when 'power_teams' then 'members'
    else 'master' end;
$$;

-- 설정: 항목별 권한이 있어야 고치기 (보기는 지금처럼 누구나)
drop policy if exists "관리자만 설정 고치기" on public.settings;
drop policy if exists "권한 있는 관리자만 설정 추가" on public.settings;
drop policy if exists "권한 있는 관리자만 설정 고치기" on public.settings;
drop policy if exists "권한 있는 관리자만 설정 지우기" on public.settings;
create policy "권한 있는 관리자만 설정 추가" on public.settings for insert with check (public.has_perm(public.setting_perm(key)));
create policy "권한 있는 관리자만 설정 고치기" on public.settings for update using (public.has_perm(public.setting_perm(key))) with check (public.has_perm(public.setting_perm(key)));
create policy "권한 있는 관리자만 설정 지우기" on public.settings for delete using (public.has_perm(public.setting_perm(key)));

-- 멤버: members 권한
drop policy if exists "관리자만 멤버 고치기" on public.members;
drop policy if exists "멤버 권한 관리자만 추가" on public.members;
drop policy if exists "멤버 권한 관리자만 고치기" on public.members;
drop policy if exists "멤버 권한 관리자만 지우기" on public.members;
create policy "멤버 권한 관리자만 추가" on public.members for insert with check (public.has_perm('members'));
create policy "멤버 권한 관리자만 고치기" on public.members for update using (public.has_perm('members')) with check (public.has_perm('members'));
create policy "멤버 권한 관리자만 지우기" on public.members for delete using (public.has_perm('members'));

-- 사진 보관함(명함·얼굴): members 권한
drop policy if exists "관리자만 사진 올리기" on storage.objects;
drop policy if exists "관리자만 사진 바꾸기" on storage.objects;
drop policy if exists "관리자만 사진 지우기" on storage.objects;
create policy "관리자만 사진 올리기" on storage.objects for insert with check (bucket_id in ('cards', 'faces') and public.has_perm('members'));
create policy "관리자만 사진 바꾸기" on storage.objects for update using (bucket_id in ('cards', 'faces') and public.has_perm('members'));
create policy "관리자만 사진 지우기" on storage.objects for delete using (bucket_id in ('cards', 'faces') and public.has_perm('members'));

-- 참관 신청: visitors 권한 (신청하기는 지금처럼 누구나)
drop policy if exists "관리자만 신청 보기" on public.visitors;
drop policy if exists "관리자만 신청 고치기" on public.visitors;
drop policy if exists "관리자만 신청 지우기" on public.visitors;
create policy "관리자만 신청 보기" on public.visitors for select using (public.has_perm('visitors'));
create policy "관리자만 신청 고치기" on public.visitors for update using (public.has_perm('visitors')) with check (public.has_perm('visitors'));
create policy "관리자만 신청 지우기" on public.visitors for delete using (public.has_perm('visitors'));

-- 멤버가 만든 초대장 지우기: invite 권한 (invitations.sql 을 실행한 경우만)
do $$ begin
  if to_regclass('public.invitations') is not null then
    drop policy if exists "관리자만 초대장 지우기" on public.invitations;
    create policy "관리자만 초대장 지우기" on public.invitations for delete using (public.has_perm('invite'));
  end if;
end $$;

-- 관리자 명단에 권한도 함께 (마스터만)
drop function if exists public.admin_list();
create function public.admin_list()
returns table (email text, master boolean, has_password boolean, perms text[], created_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_master() then raise exception '마스터 관리자만 볼 수 있습니다'; end if;
  return query
    select a.email, a.master, coalesce(u.encrypted_password, '') <> '', a.perms, a.created_at
    from public.admins a left join auth.users u on lower(u.email) = lower(a.email)
    order by a.master desc, a.created_at;
end $$;

-- 권한만 바꾸기 (마스터만)
create or replace function public.admin_set_perms(p_email text, p_perms text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_master() then raise exception '마스터 관리자만 할 수 있습니다'; end if;
  update public.admins set perms = p_perms where lower(email) = lower(p_email);
end $$;

revoke all on function public.admin_list() from public, anon;
revoke all on function public.admin_set_perms(text, text[]) from public, anon;
revoke all on function public.my_access() from public, anon;
grant execute on function public.admin_list() to authenticated;
grant execute on function public.admin_set_perms(text, text[]) to authenticated;
grant execute on function public.my_access() to authenticated;
