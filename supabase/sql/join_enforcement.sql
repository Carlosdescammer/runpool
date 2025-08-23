-- supabase/sql/join_enforcement.sql
-- Recommended DB-side enforcement for email-locked joins
-- Apply this in your Supabase SQL editor or via migrations.

-- 0) Ensure optional invited_email column exists on invites
alter table if exists public.invites
  add column if not exists invited_email text;

-- 1) RPC that enforces invited_email match (if present), expiry, and single-use
create or replace function join_group_with_token_email(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invites%rowtype;
  v_email text;
  v_group uuid;
begin
  -- Email from JWT
  v_email := coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'email'), '');

  -- Lock invite row to avoid race conditions
  select * into v_inv from invites where token = p_token for update;
  if not found then
    raise exception 'invalid_invite';
  end if;

  -- Expiry check
  if v_inv.expires_at is not null and now() > v_inv.expires_at then
    raise exception 'invite_expired';
  end if;

  -- Enforce email match when invited_email is set
  if v_inv.invited_email is not null and lower(v_inv.invited_email) <> lower(v_email) then
    raise exception 'invite_email_mismatch';
  end if;

  v_group := v_inv.group_id;

  -- No-op if already a member
  if exists(select 1 from memberships m where m.group_id = v_group and m.user_id = auth.uid()) then
    return v_group;
  end if;

  -- Insert membership as member
  insert into memberships(group_id, user_id, role)
  values (v_group, auth.uid(), 'member');

  -- Consume invite (delete). Alternatively set a used_at timestamp if you track it.
  delete from invites where token = p_token;

  return v_group;
end;
$$;

grant execute on function join_group_with_token_email(text) to authenticated;

-- 2) RLS: prevent direct inserts into memberships; require RPC above
alter table memberships enable row level security;

drop policy if exists "Block direct insert to memberships" on memberships;
create policy "Block direct insert to memberships"
  on memberships for insert
  to authenticated
  with check (false);

-- 3) RLS: admins/owners manage invites; regular users cannot alter invites
alter table invites enable row level security;

drop policy if exists "Admins manage invites" on invites;
create policy "Admins manage invites"
  on invites for all
  to authenticated
  using (
    exists (
      select 1 from memberships m
       where m.group_id = invites.group_id
         and m.user_id = auth.uid()
         and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1 from memberships m
       where m.group_id = invites.group_id
         and m.user_id = auth.uid()
         and m.role in ('owner','admin')
    )
  );

-- Optional: If you want to allow non-admins to view invites by token (for the Join page UI),
-- do NOT add a restrictive select policy here. The RPC above handles enforcement at join-time.
-- If you prefer to hide invite details unless email matches, you can add a select policy
-- that compares invited_email to the JWT email, but note it will require sign-in before joining.

-- 4) Public-safe invite fetch via security definer RPC (limited fields)
create or replace function get_invite_public(p_token text)
returns table (
  token text,
  group_id uuid,
  created_by uuid,
  expires_at timestamptz,
  invited_email text
)
language sql
security definer
set search_path = public
as $$
  select i.token, i.group_id, i.created_by, i.expires_at, i.invited_email
  from invites i
  where i.token = p_token
$$;

grant execute on function get_invite_public(text) to anon, authenticated;
