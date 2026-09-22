-- Let an owner read their own roadmap's share state.

-- `list_owned_roadmaps` reports `sharing_enabled`, but never the token, and
-- `get_roadmap_snapshot` carries no share state at all. The token was
-- deliberately unreadable: `roadmap_share_links` is revoked from anon and
-- authenticated, and the only way to obtain a token was `set_roadmap_sharing`,
-- which is a mutation.
--
-- That left the detail page with no way to show an owner the link they had
-- already enabled without calling a writing function during a page render. This
-- adds the missing read: owner only, one roadmap, no side effects.
--
-- A viewer holding a share token still learns nothing from this function — it
-- answers for the caller's own roadmaps and returns nothing otherwise, so it
-- cannot be used to test whether some other roadmap is shared.

create function public.get_roadmap_share_state(p_roadmap_id uuid)
returns table (
  sharing_enabled boolean,
  share_token uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    share.roadmap_id is not null and share.revoked_at is null,
    case when share.revoked_at is null then share.share_token end
  from public.study_roadmaps as roadmap
  left join public.roadmap_share_links as share
    on share.roadmap_id = roadmap.id
  where roadmap.id = p_roadmap_id
    and roadmap.owner_id = (select auth.uid())
    and roadmap.status = 'ready';
$$;

revoke all on function public.get_roadmap_share_state(uuid) from public, anon;
grant execute on function public.get_roadmap_share_state(uuid) to authenticated;

comment on function public.get_roadmap_share_state(uuid) is
  'Owner-only read of a ready roadmap''s current share token; returns no row for anyone else.';
