revoke all on function public.are_note_tags_valid(text[])
  from public, anon, authenticated;
revoke all on function public.validate_note_subject_scope()
  from public, anon, authenticated;
revoke all on function public.enforce_note_immutable_fields()
  from public, anon, authenticated;
revoke all on function public.enforce_published_note_asset_immutability()
  from public, anon, authenticated;
revoke all on function public.is_notes_eligible()
  from public, anon, authenticated;
revoke all on function public.has_verified_university_membership(bigint)
  from public, anon, authenticated;
revoke all on function public.has_platform_notes_role(text[])
  from public, anon, authenticated;
revoke all on function public.can_moderate_note(uuid)
  from public, anon, authenticated;
revoke all on function public.can_view_note_metadata(uuid)
  from public, anon, authenticated;
revoke all on function public.can_consume_note(uuid)
  from public, anon, authenticated;

grant execute on function public.is_notes_eligible() to authenticated;
grant execute on function public.has_verified_university_membership(bigint)
  to authenticated;
grant execute on function public.has_platform_notes_role(text[])
  to authenticated;
grant execute on function public.can_moderate_note(uuid) to authenticated;
grant execute on function public.can_view_note_metadata(uuid) to authenticated;
grant execute on function public.can_consume_note(uuid) to authenticated;

comment on function public.can_view_note_metadata(uuid) is
  'RLS helper restricted to authenticated callers; hosted default function grants are explicitly removed.';
