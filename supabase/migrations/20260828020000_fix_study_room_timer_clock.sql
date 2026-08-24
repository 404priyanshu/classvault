-- Keep the stable timer helper tied to the transaction timestamp. PostgreSQL
-- may evaluate stable functions once per statement, so volatile wall-clock
-- reads do not belong inside this helper.

create or replace function public.study_room_timer_remaining(
  p_status text,
  p_remaining_seconds integer,
  p_anchor_at timestamptz
)
returns integer
language sql
stable
set search_path = ''
as $$
  select case
    when p_status = 'running' and p_anchor_at is not null then
      greatest(
        0,
        p_remaining_seconds
          - floor(extract(epoch from (now() - p_anchor_at)))::integer
      )
    else p_remaining_seconds
  end;
$$;
