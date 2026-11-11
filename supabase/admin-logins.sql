-- 관리자 아이디·비밀번호 — 마스터 관리자가 관리자 화면 '관리자 계정' 탭에서 직접 만들고 비밀번호를 정해 준다.
-- SQL Editor 에 붙여 넣고 Run — 여러 번 실행해도 안전. (schema.sql 을 먼저 실행한 상태여야 함)
-- ★ 맨 아래 '첫 마스터 정하기'의 메일을 마스터가 될 분의 관리자 메일로 바꿔서 실행하세요.

alter table public.admins add column if not exists master boolean not null default false;

-- 아이디만 쓰는 계정은 내부적으로 '아이디@admin.bnitopaz.invalid' 메일로 저장한다 (메일은 실제로 보내지 않음)
create or replace function public.admin_login_email(p_id text)
returns text language sql immutable as $$
  select case when position('@' in p_id) > 0 then lower(trim(p_id)) else lower(trim(p_id)) || '@admin.bnitopaz.invalid' end;
$$;

-- 지금 로그인한 사람이 마스터 관리자인지
create or replace function public.is_master()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins
    where master and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- 관리자 명단은 관리자 누구나 보고, 추가·삭제·수정은 마스터만
drop policy if exists "관리자만 관리자 추가·삭제" on public.admins;
drop policy if exists "마스터만 관리자 추가·삭제" on public.admins;
create policy "마스터만 관리자 추가·삭제" on public.admins for all using (public.is_master()) with check (public.is_master());

-- 관리자 명단 + 비밀번호가 정해졌는지 (마스터만)
create or replace function public.admin_list()
returns table (email text, master boolean, has_password boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_master() then raise exception '마스터 관리자만 볼 수 있습니다'; end if;
  return query
    select a.email, a.master, coalesce(u.encrypted_password, '') <> '', a.created_at
    from public.admins a left join auth.users u on lower(u.email) = lower(a.email)
    order by a.master desc, a.created_at;
end $$;

-- 관리자 추가 또는 비밀번호 바꾸기 (마스터만). p_password 를 비우면 비밀번호는 그대로
create or replace function public.admin_save(p_id text, p_password text, p_master boolean default false)
returns text
language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  v_email text := public.admin_login_email(p_id);
  v_uid uuid;
begin
  if not public.is_master() then raise exception '마스터 관리자만 할 수 있습니다'; end if;
  if v_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]+$' then raise exception '아이디는 영문·숫자로 정해 주세요'; end if;
  if v_email = lower(coalesce(auth.jwt() ->> 'email', '')) and not coalesce(p_master, true) then raise exception '자기 자신의 마스터 권한은 뺄 수 없습니다'; end if;
  if coalesce(p_password, '') <> '' and char_length(p_password) < 8 then raise exception '비밀번호는 8자 이상으로 정해 주세요'; end if;

  insert into public.admins (email, master) values (v_email, coalesce(p_master, false))
    on conflict (email) do update set master = coalesce(p_master, public.admins.master);

  if coalesce(p_password, '') <> '' then
    select id into v_uid from auth.users where lower(email) = v_email limit 1;
    if v_uid is null then
      v_uid := gen_random_uuid();
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new)
      values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
        crypt(p_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), v_uid, v_uid::text,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true), 'email', now(), now(), now());
    else
      update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
      where id = v_uid;
    end if;
  end if;
  return v_email;
end $$;

-- 관리자 빼기 (마스터만, 자기 자신은 못 뺌). 비밀번호도 지워서 더는 로그인 못 하게
create or replace function public.admin_remove(p_email text)
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_master() then raise exception '마스터 관리자만 할 수 있습니다'; end if;
  if lower(p_email) = lower(coalesce(auth.jwt() ->> 'email', '')) then raise exception '자기 자신은 뺄 수 없습니다'; end if;
  delete from public.admins where lower(email) = lower(p_email);
  update auth.users set encrypted_password = '' where lower(email) = lower(p_email);
end $$;

revoke all on function public.admin_list() from public, anon;
revoke all on function public.admin_save(text, text, boolean) from public, anon;
revoke all on function public.admin_remove(text) from public, anon;
grant execute on function public.admin_list() to authenticated;
grant execute on function public.admin_save(text, text, boolean) to authenticated;
grant execute on function public.admin_remove(text) to authenticated;

-- ★ 첫 마스터 정하기: 아래 메일을 실제 관리자 메일로 바꿔서 실행 (이미 관리자 명단에 있는 메일이어야 함)
update public.admins set master = true where lower(email) = lower('여기에-마스터-관리자-메일@example.com');
