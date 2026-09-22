-- Account suspension: an access restriction, not a content action.

-- Per docs/adr/0011, suspending a student closes their access and nothing else.
-- Their notes, ratings, rooms and shared roadmaps stay exactly as visible as
-- they were; removing content is a separate moderation decision with its own
-- audit trail. Nothing here touches public.notes.
--
-- Enforcement lives in the two eligibility helpers every student write path
-- already calls, rather than in each of the twenty-odd functions above them. A
-- suspended student who bypasses the UI entirely still cannot upload, rate,
-- generate a roadmap, create or join a room, because those all fail the same
-- check the UI uses.

alter table public.profiles
  add column suspended_at timestamptz,
  add column suspension_reason text;

alter table public.profiles
  add constraint profiles_suspension_reason_shape check (
    (suspended_at is null and suspension_reason is null)
    or (suspended_at is not null and char_length(suspension_reason) between 1 and 500)
  );

create index profiles_suspended_idx
  on public.profiles (suspended_at)
  where suspended_at is not null;

-- Append-only, mirroring note_moderation_actions: the profile carries the
-- current state so the hot-path helpers stay a single indexed lookup, and this
-- carries how it got there.
create table public.account_suspension_actions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('suspended', 'restored')),
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);

create index account_suspension_actions_user_idx
  on public.account_suspension_actions (user_id, created_at desc);

alter table public.account_suspension_actions enable row level security;
alter table public.account_suspension_actions force row level security;

revoke all on table public.account_suspension_actions from public, anon, authenticated;

/**
 * Whether the calling student is currently suspended.
 *
 * Kept separate from is_notes_eligible so the reason can be shown to the
 * student without implying they may act.
 */
create function public.is_account_suspended()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.suspended_at is not null
  );
$$;

-- The two gates. Both previously asked only whether onboarding was complete.
create or replace function public.is_notes_eligible()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.onboarding_completed_at is not null
      and profile.suspended_at is null
  );
$$;

create or replace function public.is_study_room_eligible()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.onboarding_completed_at is not null
      and profile.suspended_at is null
  );
$$;

/**
 * What a suspended student is allowed to see about their own suspension.
 *
 * Returns a row for every student, suspended or not, so the caller does not
 * have to distinguish "not suspended" from "no such account".
 */
create function public.get_own_account_status()
returns table (
  suspended boolean,
  suspended_at timestamptz,
  suspension_reason text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.suspended_at is not null,
    profile.suspended_at,
    profile.suspension_reason
  from public.profiles as profile
  where profile.id = (select auth.uid());
$$;

/**
 * Suspends a student, or lifts a suspension.
 *
 * Platform administrators only, for both directions. ADR 0011 names an
 * administrator as the one who lifts a suspension; requiring the same role to
 * apply one keeps a moderator from creating a state they cannot undo.
 *
 * Returns false rather than raising when the actor is unauthorized, the target
 * does not exist, or the account is already in the requested state, so a
 * repeated click is harmless and callers cannot tell "no such student" from
 * "not allowed".
 */
create function public.set_account_suspension(
  p_user_id uuid,
  p_suspended boolean,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  trimmed_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  already_suspended boolean;
begin
  if actor_id is null or not public.has_platform_notes_role(array['platform_admin']) then
    return false;
  end if;

  if trimmed_reason is null or char_length(trimmed_reason) > 500 then
    return false;
  end if;

  -- An administrator suspending themselves would lock the only role that can
  -- undo it.
  if p_user_id = actor_id then
    return false;
  end if;

  select profile.suspended_at is not null into already_suspended
  from public.profiles as profile
  where profile.id = p_user_id
  for update;

  if not found or already_suspended = coalesce(p_suspended, false) then
    return false;
  end if;

  if p_suspended then
    update public.profiles as profile
    set suspended_at = now(),
        suspension_reason = trimmed_reason
    where profile.id = p_user_id;
  else
    update public.profiles as profile
    set suspended_at = null,
        suspension_reason = null
    where profile.id = p_user_id;
  end if;

  insert into public.account_suspension_actions (user_id, actor_id, action, reason)
  values (
    p_user_id,
    actor_id,
    case when p_suspended then 'suspended' else 'restored' end,
    trimmed_reason
  );

  return true;
end;
$$;

revoke all on function public.is_account_suspended() from public, anon;
revoke all on function public.get_own_account_status() from public, anon;
revoke all on function public.set_account_suspension(uuid, boolean, text) from public, anon;

grant execute on function public.is_account_suspended() to authenticated;
grant execute on function public.get_own_account_status() to authenticated;
grant execute on function public.set_account_suspension(uuid, boolean, text) to authenticated;

comment on column public.profiles.suspended_at is
  'Set while the student''s access is suspended; content visibility is unaffected.';
comment on table public.account_suspension_actions is
  'Append-only audit of suspension and restoration decisions.';
comment on function public.set_account_suspension(uuid, boolean, text) is
  'Platform-admin-only suspension toggle; returns false instead of raising when refused.';
