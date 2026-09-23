-- Verify a campus membership whenever the account's confirmed email proves it.
--
-- Membership status was derived from the confirmed email exactly once, at
-- onboarding. A student who signed up with Gmail, a phone number, or GitHub
-- therefore stayed `pending` for good: the only way on was a manual review,
-- and no reviewer is appointed yet. The verification page now lets a student
-- change their sign-in email to their college address; Supabase confirms it
-- with its own email-change link, and this trigger applies the same domain
-- rule onboarding uses the moment a confirmed address matches.
--
-- Only ever upgrades. Moving the sign-in email off a campus domain later (a
-- graduate keeping their account) does not revoke a verification already
-- earned, and a `rejected` review is overridden because a confirmed campus
-- address is stronger evidence than the claim that was rejected.

create function public.verify_membership_from_confirmed_email(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  confirmed_email text;
  email_domain text;
begin
  select auth_user.email
  into confirmed_email
  from auth.users as auth_user
  where auth_user.id = p_user_id
    and auth_user.email is not null
    and auth_user.email_confirmed_at is not null;

  if confirmed_email is null then
    return false;
  end if;

  email_domain := lower(split_part(confirmed_email, '@', 2));

  update public.university_memberships as membership
  set status = 'verified',
      verified_at = now(),
      academic_email = lower(confirmed_email)
  where membership.user_id = p_user_id
    and membership.status <> 'verified'
    and exists (
      select 1
      from public.university_email_domains as trusted_domain
      where trusted_domain.university_id = membership.university_id
        and (
          email_domain = trusted_domain.domain
          or email_domain like ('%.' || trusted_domain.domain)
        )
    );

  return found;
end;
$$;

comment on function public.verify_membership_from_confirmed_email(uuid) is
  'Marks a membership verified when the account''s confirmed email is on its university''s domain. Upgrade only.';

revoke all on function public.verify_membership_from_confirmed_email(uuid)
  from public, anon, authenticated;

create function public.verify_membership_after_email_confirmation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.verify_membership_from_confirmed_email(new.id);
  return new;
end;
$$;

revoke all on function public.verify_membership_after_email_confirmation()
  from public, anon, authenticated;

-- GoTrue writes the new address into `email` only once the change is
-- confirmed, so a pending change never reaches this trigger.
create trigger verify_membership_after_email_confirmation
after update of email, email_confirmed_at on auth.users
for each row
when (new.email_confirmed_at is not null)
execute function public.verify_membership_after_email_confirmation();
