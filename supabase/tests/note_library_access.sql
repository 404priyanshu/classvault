begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(13);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.get_accessible_note_contributors(uuid[])',
    'EXECUTE'
  ),
  'anonymous users cannot read contributor labels'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.get_accessible_note_contributors(uuid[])',
    'EXECUTE'
  ),
  'authenticated users can request authorized contributor labels'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.get_accessible_note_file(uuid)',
    'EXECUTE'
  ),
  'anonymous users cannot read private note file metadata'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.get_accessible_note_file(uuid)',
    'EXECUTE'
  ),
  'authenticated users can request authorized note file metadata'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.can_download_note_object(text)',
    'EXECUTE'
  ),
  'anonymous users cannot authorize private note downloads'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.can_download_note_object(text)',
    'EXECUTE'
  ),
  'authenticated users can authorize private note downloads'
);

select extensions.ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'note_files_select_accessible_download'
  ),
  'private note objects have an access-gated download policy'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'library-owner@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Archive Fox"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'library-reader@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Reader"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'authenticated',
    'authenticated',
    'library-incomplete@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Incomplete"}',
    now(),
    now()
  );

update public.profiles
set
  display_name = case
    when id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' then 'Archive Fox'
    else display_name
  end,
  onboarding_completed_at = now()
where id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
);

insert into public.notes (
  id,
  owner_id,
  subject_id,
  visibility,
  title,
  description,
  note_type,
  publication_status,
  published_at
)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  (select id from public.subjects where slug = 'operating-systems'),
  'public',
  'Public library access fixture',
  'A published note used to verify library download authorization.',
  'summary',
  'published',
  now()
);

insert into public.note_assets (
  id,
  note_id,
  storage_backend,
  object_key,
  original_filename,
  detected_mime_type,
  byte_size,
  sha256,
  processing_status
)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'supabase_storage',
  'notes/dddddddd-dddd-4ddd-8ddd-dddddddddddd/source/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'operating-systems.pdf',
  'application/pdf',
  2048,
  repeat('f', 64),
  'ready'
);

insert into storage.objects (bucket_id, name, owner_id, metadata)
values (
  'note-files',
  'notes/dddddddd-dddd-4ddd-8ddd-dddddddddddd/source/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  jsonb_build_object('mimetype', 'application/pdf', 'size', 2048)
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select contributor.display_name
    from public.get_accessible_note_contributors(
      array['dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid]
    ) as contributor
  ),
  'Archive Fox',
  'an eligible reader sees the safe contributor label for a consumable note'
);

select extensions.is(
  (
    select file.original_filename
    from public.get_accessible_note_file(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid
    ) as file
  ),
  'operating-systems.pdf',
  'an eligible reader receives ready file metadata for a consumable note'
);

select extensions.ok(
  public.can_download_note_object(
    'notes/dddddddd-dddd-4ddd-8ddd-dddddddddddd/source/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  ),
  'an eligible reader can authorize the exact private source object'
);

select set_config(
  'request.jwt.claim.sub',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select count(*)
    from public.get_accessible_note_contributors(
      array['dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid]
    )
  ),
  0::bigint,
  'an onboarding-incomplete user cannot read contributor labels'
);

select extensions.is(
  (
    select count(*)
    from public.get_accessible_note_file(
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid
    )
  ),
  0::bigint,
  'an onboarding-incomplete user cannot read private file metadata'
);

select extensions.ok(
  not public.can_download_note_object(
    'notes/dddddddd-dddd-4ddd-8ddd-dddddddddddd/source/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  ),
  'an onboarding-incomplete user cannot authorize the private source object'
);

select * from extensions.finish();

rollback;
