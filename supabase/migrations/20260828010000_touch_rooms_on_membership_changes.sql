-- Emit one room-row update for membership changes so lobby Realtime clients
-- can refresh safe aggregate member counts without reading member identities.

create function public.touch_study_room_from_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_room_id uuid;
begin
  target_room_id := case when tg_op = 'DELETE' then old.room_id else new.room_id end;

  update public.study_rooms as room
  set updated_at = now()
  where room.id = target_room_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger study_room_members_touch_room
after insert or update or delete on public.study_room_members
for each row execute function public.touch_study_room_from_member();

revoke all on function public.touch_study_room_from_member()
  from public, anon, authenticated;
