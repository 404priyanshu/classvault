-- A student without a confirmed campus email can ask a campus reviewer to
-- check their enrolment against a trusted roster or a campus staff contact.
-- Student-supplied details are claims, never proof by themselves.

create table public.membership_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.university_memberships (user_id) on delete cascade,
  university_id bigint not null references public.universities (id) on delete restrict,
  enrolment_id text not null,
  student_context text not null default '',
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid,
  evidence_method text,
  decision_reason text,
  constraint membership_review_enrolment_length check (char_length(trim(enrolment_id)) between 4 and 60),
  constraint membership_review_context_length check (char_length(student_context) <= 1000),
  constraint membership_review_status check (status in ('pending', 'approved', 'rejected')),
  constraint membership_review_decision check (
    (status = 'pending' and reviewed_at is null and reviewer_id is null
      and evidence_method is null and decision_reason is null)
    or (status in ('approved', 'rejected') and reviewed_at is not null
      and reviewer_id is not null and evidence_method is not null
      and decision_reason is not null)
  )
);

create unique index membership_review_one_pending_per_student
  on public.membership_verification_requests (user_id) where status = 'pending';
create index membership_review_student_history_idx
  on public.membership_verification_requests (user_id, submitted_at desc, id desc);
create index membership_review_queue_idx
  on public.membership_verification_requests (university_id, submitted_at, id)
  where status = 'pending';

alter table public.membership_verification_requests enable row level security;
alter table public.membership_verification_requests force row level security;
revoke all on table public.membership_verification_requests from public, anon, authenticated;

-- Re-onboarding was callable directly as an RPC after setup and could reset a
-- reviewed membership to pending or switch campuses. Keep the original function
-- as a private implementation and gate its public entry point to first setup.
alter function public.complete_student_onboarding(text, text, smallint, bigint, text, text)
  rename to complete_student_onboarding_initial;
revoke all on function public.complete_student_onboarding_initial(text, text, smallint, bigint, text, text)
  from public, anon, authenticated;

create function public.complete_student_onboarding(
  p_display_name text,
  p_course text,
  p_graduation_year smallint,
  p_university_id bigint,
  p_primary_goal text,
  p_study_preference text
)
returns table (membership_status text, selected_university_name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.onboarding_completed_at is not null
  ) then
    raise exception 'Onboarding is already complete' using errcode = '42501';
  end if;

  return query select * from public.complete_student_onboarding_initial(
    p_display_name, p_course, p_graduation_year, p_university_id,
    p_primary_goal, p_study_preference
  );
end;
$$;
revoke all on function public.complete_student_onboarding(text, text, smallint, bigint, text, text)
  from public, anon;
grant execute on function public.complete_student_onboarding(text, text, smallint, bigint, text, text)
  to authenticated;

create function public.can_review_membership(target_university_id bigint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    public.has_platform_notes_role(array['platform_moderator', 'platform_admin']::text[])
    or exists (
      select 1 from public.university_memberships as membership
      where membership.user_id = (select auth.uid())
        and membership.university_id = target_university_id
        and membership.status = 'verified'
        and membership.role in ('moderator', 'admin')
    )
  );
$$;
revoke all on function public.can_review_membership(bigint) from public, anon;
grant execute on function public.can_review_membership(bigint) to authenticated;

create function public.submit_membership_verification_request(
  p_enrolment_id text,
  p_student_context text default ''
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  membership public.university_memberships%rowtype;
  created_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_enrolment_id is null or char_length(trim(p_enrolment_id)) not between 4 and 60
    or p_student_context is null or char_length(trim(p_student_context)) > 1000 then
    raise exception 'Invalid verification details' using errcode = '22023';
  end if;

  select * into membership
  from public.university_memberships as row
  where row.user_id = actor_id
  for update;

  if not found or membership.status = 'verified' or not exists (
    select 1 from public.profiles as profile
    where profile.id = actor_id and profile.onboarding_completed_at is not null
  ) then
    raise exception 'This membership cannot be submitted for review' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.membership_verification_requests as request
    where request.user_id = actor_id and request.status = 'pending'
  ) then
    raise exception 'A request is already pending' using errcode = '23505';
  end if;

  insert into public.membership_verification_requests (
    user_id, university_id, enrolment_id, student_context
  ) values (
    actor_id, membership.university_id, trim(p_enrolment_id), trim(p_student_context)
  ) returning id into created_id;

  update public.university_memberships as row
  set status = 'pending', verified_at = null
  where row.user_id = actor_id;

  return created_id;
end;
$$;
revoke all on function public.submit_membership_verification_request(text, text) from public, anon;
grant execute on function public.submit_membership_verification_request(text, text) to authenticated;

create function public.list_own_membership_verification_requests()
returns table (
  request_id uuid, status text, submitted_at timestamptz,
  reviewed_at timestamptz, decision_reason text
)
language sql stable security definer set search_path = ''
as $$
  select request.id, request.status, request.submitted_at,
    request.reviewed_at, request.decision_reason
  from public.membership_verification_requests as request
  where request.user_id = (select auth.uid())
  order by request.submitted_at desc, request.id desc
  limit 10;
$$;
revoke all on function public.list_own_membership_verification_requests() from public, anon;
grant execute on function public.list_own_membership_verification_requests() to authenticated;

create function public.list_membership_verification_queue(p_limit integer default 50)
returns table (
  request_id uuid, university_id bigint, university_name text,
  display_name text, course text, graduation_year smallint,
  account_email text, enrolment_id text, student_context text,
  submitted_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select request.id, request.university_id, university.name,
    coalesce(profile.display_name, 'ClassVault student'), profile.course,
    profile.graduation_year, auth_user.email,
    request.enrolment_id, request.student_context, request.submitted_at
  from public.membership_verification_requests as request
  join public.university_memberships as membership
    on membership.user_id = request.user_id
   and membership.university_id = request.university_id
  join public.universities as university on university.id = request.university_id
  join public.profiles as profile on profile.id = request.user_id
  join auth.users as auth_user on auth_user.id = request.user_id
  where request.status = 'pending'
    and request.user_id <> (select auth.uid())
    and public.can_review_membership(request.university_id)
  order by request.submitted_at, request.id
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;
revoke all on function public.list_membership_verification_queue(integer) from public, anon;
grant execute on function public.list_membership_verification_queue(integer) to authenticated;

create function public.review_membership_verification_request(
  p_request_id uuid,
  p_decision text,
  p_evidence_method text,
  p_reason text
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  request public.membership_verification_requests%rowtype;
  member public.university_memberships%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_decision is null or p_evidence_method is null
    or p_decision not in ('approved', 'rejected')
    or p_evidence_method not in ('roster_check', 'campus_staff_confirmation', 'insufficient_evidence')
    or (p_decision = 'approved' and p_evidence_method = 'insufficient_evidence')
    or (p_decision = 'rejected' and p_evidence_method <> 'insufficient_evidence')
    or p_reason is null or char_length(trim(p_reason)) not between 10 and 500 then
    raise exception 'Invalid review decision' using errcode = '22023';
  end if;

  select * into request from public.membership_verification_requests as row
  where row.id = p_request_id for update;
  if not found or request.status <> 'pending' then
    return false;
  end if;
  if request.user_id = actor_id or not public.can_review_membership(request.university_id) then
    raise exception 'Review is not permitted' using errcode = '42501';
  end if;

  select * into member from public.university_memberships as row
  where row.user_id = request.user_id for update;
  if not found or member.university_id <> request.university_id
    or member.status <> 'pending' then
    return false;
  end if;

  update public.university_memberships as row
  set status = case when p_decision = 'approved' then 'verified' else 'rejected' end,
      verified_at = case when p_decision = 'approved' then now() else null end
  where row.user_id = request.user_id;

  update public.membership_verification_requests as row
  set status = p_decision, reviewed_at = now(), reviewer_id = actor_id,
      evidence_method = p_evidence_method, decision_reason = trim(p_reason)
  where row.id = p_request_id;

  return true;
end;
$$;
revoke all on function public.review_membership_verification_request(uuid, text, text, text)
  from public, anon;
grant execute on function public.review_membership_verification_request(uuid, text, text, text)
  to authenticated;
