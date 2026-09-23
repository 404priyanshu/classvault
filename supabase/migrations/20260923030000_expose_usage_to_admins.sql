-- Let platform administrators read the demand-pilot usage summaries in the app.
--
-- usage_daily_summary and usage_weekly_students (20260923010000) are readable
-- only by the service role, which meant the SQL editor. These two functions
-- hand the same aggregate rows to a signed-in platform administrator and to
-- nobody else, so /dashboard/usage needs no service-role key in the request
-- path. They return counts only; the underlying ledger stays unreadable.

create function public.get_usage_daily(p_days integer default 28)
returns table (
  day date,
  event text,
  events bigint,
  students bigint,
  searches_without_results bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_platform_notes_role(array['platform_admin']) then
    raise exception 'Platform administrator access is required'
      using errcode = '42501';
  end if;

  return query
  select summary.day, summary.event, summary.events, summary.students,
    summary.searches_without_results
  from public.usage_daily_summary as summary
  where summary.day > (now() at time zone 'Asia/Kolkata')::date
    - least(greatest(coalesce(p_days, 28), 1), 366)
  order by summary.day desc, summary.event;
end;
$$;

create function public.get_usage_weekly(p_weeks integer default 12)
returns table (
  week date,
  active_students bigint,
  returning_students bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_platform_notes_role(array['platform_admin']) then
    raise exception 'Platform administrator access is required'
      using errcode = '42501';
  end if;

  return query
  select weekly.week, weekly.active_students, weekly.returning_students
  from public.usage_weekly_students as weekly
  order by weekly.week desc
  limit least(greatest(coalesce(p_weeks, 12), 1), 104);
end;
$$;

revoke all on function public.get_usage_daily(integer) from public, anon, authenticated;
revoke all on function public.get_usage_weekly(integer) from public, anon, authenticated;
grant execute on function public.get_usage_daily(integer) to authenticated;
grant execute on function public.get_usage_weekly(integer) to authenticated;
