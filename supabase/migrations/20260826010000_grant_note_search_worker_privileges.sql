-- Allow only the hosted worker role to claim and complete search extraction.

revoke all on function public.claim_pending_note_extractions(integer)
  from public, anon, authenticated;
revoke all on function public.complete_note_extraction(text, text, text, uuid)
  from public, anon, authenticated;

grant execute on function public.claim_pending_note_extractions(integer)
  to service_role;
grant execute on function public.complete_note_extraction(text, text, text, uuid)
  to service_role;

comment on function public.claim_pending_note_extractions(integer) is
  'Service-role-only atomic claim boundary for private PDF search extraction.';
comment on function public.complete_note_extraction(text, text, text, uuid) is
  'Service-role-only completion boundary for derived note search text.';
