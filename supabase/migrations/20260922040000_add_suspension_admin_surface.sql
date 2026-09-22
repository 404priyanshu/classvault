-- Give administrators a way to apply and lift suspensions.

-- The moderation queue deliberately shows `owner_label`, a pseudonymous string,
-- and never `owner_id`: moderators review content, not people. Suspension is
-- platform-admin-only, so adding an owner id to that queue would hand every
-- moderator an identifier they have no use for.
--
-- Instead an administrator suspends *by note* — the thing they are already
-- looking at — and the function resolves the owner itself. Lifting works from
-- the administrator's own list of suspended accounts, which is the only place
-- ids are exposed, and only to the role that can act on them.

/**
 * Suspends the owner of a note, without the caller handling their id.
 *
 * Returns false on refusal for the same reasons set_account_suspension does,
 * plus an unknown note, so a moderator calling it learns nothing about whether
 * the note exists.
 */
create function public.suspend_note_owner(
  p_note_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_owner uuid;
begin
  if not public.has_platform_notes_role(array['platform_admin']) then
    return false;
  end if;

  select note.owner_id into target_owner
  from public.notes as note
  where note.id = p_note_id;

  if not found then
    return false;
  end if;

  return public.set_account_suspension(target_owner, true, p_reason);
end;
$$;

/**
 * The administrator's list of currently suspended accounts.
 *
 * Exposes user ids, which is what makes lifting possible, and is therefore
 * restricted to the one role that can lift. The display name is already
 * visible to moderators through owner_label elsewhere.
 */
create function public.list_suspended_accounts(p_limit integer default 100)
returns table (
  user_id uuid,
  display_name text,
  suspended_at timestamptz,
  suspension_reason text,
  decided_by_label text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.id,
    profile.display_name,
    profile.suspended_at,
    profile.suspension_reason,
    (
      select actor.display_name
      from public.account_suspension_actions as action
      left join public.profiles as actor on actor.id = action.actor_id
      where action.user_id = profile.id
        and action.action = 'suspended'
      order by action.id desc
      limit 1
    )
  from public.profiles as profile
  where profile.suspended_at is not null
    and public.has_platform_notes_role(array['platform_admin'])
  order by profile.suspended_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

revoke all on function public.suspend_note_owner(uuid, text) from public, anon;
revoke all on function public.list_suspended_accounts(integer) from public, anon;

grant execute on function public.suspend_note_owner(uuid, text) to authenticated;
grant execute on function public.list_suspended_accounts(integer) to authenticated;

comment on function public.suspend_note_owner(uuid, text) is
  'Platform-admin-only suspension of a note owner, keeping owner ids out of the moderation queue.';
comment on function public.list_suspended_accounts(integer) is
  'Platform-admin-only list of suspended accounts, the surface a suspension is lifted from.';
