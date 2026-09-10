-- Let a student close their own account and decide what happens to their notes.

-- Erasure was an operator-only act: someone with dashboard access deleted the
-- auth user by hand. India's DPDP Act gives the student that right directly,
-- and `notes.owner_id` was `not null ... on delete restrict`, so the database
-- physically refused to remove anyone who had ever uploaded.
--
-- Ownership now detaches instead of blocking. A published note can outlive the
-- student who wrote it, credited to nobody, because the library it belongs to
-- is shared -- and a student who would rather take their uploads with them can
-- say so instead.

alter table public.notes
  alter column owner_id drop not null;

alter table public.notes
  drop constraint notes_owner_id_fkey;

alter table public.notes
  add constraint notes_owner_id_fkey
    foreign key (owner_id) references public.profiles (id) on delete set null;

comment on column public.notes.owner_id is
  'The student who uploaded the note, or null once they have closed their account and chosen to leave it behind.';

-- Ownership is still immutable; it can only be given up.
--
-- `on delete set null` reaches this trigger as an ordinary update, so the old
-- rule -- any change at all is an error -- would have made the detach fail and
-- taken the account deletion down with it. Detaching to null is allowed
-- exactly once and in one direction: a note can lose its author, but it can
-- never be handed to a different one, and an orphaned note can never be
-- claimed.
create or replace function public.enforce_note_immutable_fields()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.owner_id is distinct from old.owner_id
    and not (old.owner_id is not null and new.owner_id is null) then
    raise exception 'Note ownership is immutable'
      using errcode = '23514';
  end if;

  if old.publication_status = 'published'
    and (
      new.publication_status <> 'published'
      or new.published_at is distinct from old.published_at
      or new.visibility is distinct from old.visibility
      or new.university_id is distinct from old.university_id
    ) then
    raise exception 'Published note publication state and scope are immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

/**
 * Why a moderator cannot close their own account here.
 *
 * `note_moderation_actions.actor_id` is `not null ... on delete restrict` on
 * purpose: a moderation record that cannot say who acted is not a record. So
 * rather than weaken the audit trail to fit this feature, an account carrying
 * moderation history is refused and handled by a human. That set is a handful
 * of people who are reachable, not students.
 */
create function public.can_close_own_account()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select not exists (
    select 1 from public.platform_roles
    where user_id = (select auth.uid()) or granted_by = (select auth.uid())
  ) and not exists (
    select 1 from public.note_moderation_actions
    where actor_id = (select auth.uid())
  );
$$;

/**
 * The storage keys that closing this account will strand.
 *
 * Read-only and deliberately separate from the delete: the caller has to be
 * able to ask what will be removed before anything is removed, and the files
 * live in object storage where SQL cannot reach them.
 *
 * `p_keep_published` mirrors the choice on the confirmation screen. Keeping
 * published work still takes the drafts and the trash, which nobody else can
 * see and which the student never offered to anyone.
 */
create function public.list_account_deletion_object_keys(
  p_keep_published boolean
)
returns table (object_key text, preview_object_key text)
language sql
stable
security definer
set search_path to ''
as $$
  select asset.object_key, asset.preview_object_key
  from public.notes as note
  join public.note_assets as asset on asset.note_id = note.id
  where note.owner_id = (select auth.uid())
    and (
      not p_keep_published
      or note.publication_status <> 'published'
      or note.deleted_at is not null
    );
$$;

/**
 * Closes the caller's account, as far as SQL can.
 *
 * The auth user itself is removed afterwards through the admin API, which is
 * what cascades the profile, the membership, ratings, reports, roadmaps and
 * room memberships. This function's whole job is the one decision that cascade
 * cannot express: which notes leave with the student and which stay behind.
 *
 * Returns what it did so the caller can report it rather than guess.
 */
create function public.close_own_account(p_keep_published boolean)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  actor_id uuid;
  removed_count integer;
  kept_count integer;
begin
  actor_id := (select auth.uid());

  if actor_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not (select public.can_close_own_account()) then
    raise exception 'Accounts holding moderation history are closed by support'
      using errcode = '42501';
  end if;

  with removed as (
    delete from public.notes
    where owner_id = actor_id
      and (
        not p_keep_published
        or publication_status <> 'published'
        or deleted_at is not null
      )
    returning 1
  )
  select count(*) into removed_count from removed;

  -- Whatever survived is published work the student chose to leave. Detaching
  -- it here rather than letting the foreign key do it on profile deletion keeps
  -- the count honest and the outcome visible in one place.
  update public.notes
  set owner_id = null
  where owner_id = actor_id;

  get diagnostics kept_count = row_count;

  return jsonb_build_object(
    'keptNotes', kept_count,
    'removedNotes', removed_count
  );
end;
$$;

revoke execute on function public.can_close_own_account() from anon;
revoke execute on function public.list_account_deletion_object_keys(boolean) from anon;
revoke execute on function public.close_own_account(boolean) from anon;

comment on function public.close_own_account(boolean) is
  'Removes the caller''s notes, or detaches the published ones, before the auth user is deleted.';
