begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(18);

select extensions.ok(
  exists (
    select 1
    from storage.buckets as bucket
    where bucket.id = 'note-files'
      and not bucket.public
      and bucket.file_size_limit = 26214400
  ),
  'note source files use a private 25 MiB bucket'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.create_note_upload_draft(text,text,bigint,text,text[],text,text,text,bigint,text)',
    'EXECUTE'
  ),
  'anonymous users cannot create note upload intents'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.create_note_upload_draft(text,text,bigint,text,text[],text,text,text,bigint,text)',
    'EXECUTE'
  ),
  'authenticated users can call the draft upload operation'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.notes', 'INSERT'),
  'note drafts remain server-owned rather than directly insertable'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.note_assets', 'SELECT'),
  'private storage metadata remains hidden from authenticated clients'
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
    '77777777-7777-4777-8777-777777777777',
    'authenticated',
    'authenticated',
    'uploader@bennett.edu.in',
    '',
    now(),
    '{}',
    '{"full_name":"Verified Uploader"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '88888888-8888-4888-8888-888888888888',
    'authenticated',
    'authenticated',
    'pending@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Pending Uploader"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '99999999-9999-4999-8999-999999999999',
    'authenticated',
    'authenticated',
    'incomplete@example.com',
    '',
    now(),
    '{}',
    '{"full_name":"Incomplete Uploader"}',
    now(),
    now()
  );

update public.profiles
set onboarding_completed_at = now()
where id in (
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888'
);

insert into public.university_memberships (
  user_id,
  university_id,
  academic_email,
  status,
  role,
  verified_at
)
values
  (
    '77777777-7777-4777-8777-777777777777',
    (select id from public.universities where slug = 'bennett-university'),
    'uploader@bennett.edu.in',
    'verified',
    'student',
    now()
  ),
  (
    '88888888-8888-4888-8888-888888888888',
    (select id from public.universities where slug = 'bennett-university'),
    'pending@example.com',
    'pending',
    'student',
    null
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '99999999-9999-4999-8999-999999999999',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"99999999-9999-4999-8999-999999999999","role":"authenticated"}',
  true
);

select extensions.throws_ok(
  $$
    select *
    from public.create_note_upload_draft(
      'Incomplete student note',
      '',
      (select id from public.subjects where slug = 'operating-systems'),
      'summary',
      '{}'::text[],
      'public',
      'incomplete.pdf',
      'application/pdf',
      1024,
      repeat('a', 64)
    )
  $$,
  '42501',
  'Complete onboarding before adding notes',
  'onboarding-incomplete students cannot create note drafts'
);

select set_config(
  'request.jwt.claim.sub',
  '88888888-8888-4888-8888-888888888888',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated"}',
  true
);

select extensions.throws_ok(
  $$
    select *
    from public.create_note_upload_draft(
      'Pending university note',
      '',
      (select id from public.subjects where slug = 'operating-systems'),
      'summary',
      '{}'::text[],
      'university',
      'pending.pdf',
      'application/pdf',
      1024,
      repeat('b', 64)
    )
  $$,
  '42501',
  'Verified university membership is required',
  'pending students cannot create university-only upload intents'
);

select set_config(
  'request.jwt.claim.sub',
  '77777777-7777-4777-8777-777777777777',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);

select extensions.lives_ok(
  $$
    select *
    from public.create_note_upload_draft(
      'Verified public upload',
      'A valid upload intent',
      (select id from public.subjects where slug = 'operating-systems'),
      'summary',
      array['important', 'midsem'],
      'public',
      'operating-systems.pdf',
      'application/pdf',
      1024,
      repeat('c', 64)
    )
  $$,
  'eligible students can create an owner-derived public upload intent'
);

reset role;

select set_config(
  'test.upload_object_key',
  (
    select asset.object_key
    from public.note_assets as asset
    join public.notes as note on note.id = asset.note_id
    where note.title = 'Verified public upload'
  ),
  true
);
select set_config(
  'test.upload_note_id',
  (
    select note.id::text
    from public.notes as note
    where note.title = 'Verified public upload'
  ),
  true
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '77777777-7777-4777-8777-777777777777',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);

select extensions.ok(
  public.can_upload_note_object(current_setting('test.upload_object_key')),
  'the owner can authorize the exact opaque upload object'
);

select set_config(
  'request.jwt.claim.sub',
  '88888888-8888-4888-8888-888888888888',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated"}',
  true
);

select extensions.ok(
  not public.can_upload_note_object(current_setting('test.upload_object_key')),
  'another student cannot authorize the owner upload object'
);

select set_config(
  'request.jwt.claim.sub',
  '77777777-7777-4777-8777-777777777777',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);

select extensions.throws_ok(
  format(
    $$
      select *
      from public.complete_note_upload(
        %L::uuid,
        true,
        'application/pdf',
        1024,
        null
      )
    $$,
    current_setting('test.upload_note_id')
  ),
  '22023',
  'Verified file metadata is required',
  'publication rejects omitted verification metadata'
);

select extensions.throws_ok(
  format(
    $$
      select *
      from public.complete_note_upload(
        %L::uuid,
        true,
        'application/pdf',
        1024,
        %L
      )
    $$,
    current_setting('test.upload_note_id'),
    repeat('c', 64)
  ),
  '23503',
  'Uploaded note file was not found',
  'publication cannot complete before the private object exists'
);

reset role;

insert into storage.objects (bucket_id, name, owner_id, metadata)
values (
  'note-files',
  current_setting('test.upload_object_key'),
  '77777777-7777-4777-8777-777777777777',
  jsonb_build_object('mimetype', 'application/pdf', 'size', 1024)
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '77777777-7777-4777-8777-777777777777',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);

select extensions.throws_ok(
  format(
    $$
      select *
      from public.complete_note_upload(
        %L::uuid,
        true,
        'application/pdf',
        1024,
        %L
      )
    $$,
    current_setting('test.upload_note_id'),
    repeat('d', 64)
  ),
  '23514',
  'Uploaded note file did not match the upload intent',
  'publication rejects a checksum mismatch'
);

select extensions.lives_ok(
  format(
    $$
      select *
      from public.complete_note_upload(
        %L::uuid,
        true,
        'application/pdf',
        1024,
        %L
      )
    $$,
    current_setting('test.upload_note_id'),
    repeat('c', 64)
  ),
  'a matching verified object can be published atomically'
);

reset role;

select extensions.is(
  (
    select note.publication_status
    from public.notes as note
    where note.id = current_setting('test.upload_note_id')::uuid
  ),
  'published',
  'completion moves the note to published state'
);

select extensions.is(
  (
    select asset.processing_status
    from public.note_assets as asset
    where asset.note_id = current_setting('test.upload_note_id')::uuid
  ),
  'ready',
  'completion marks the private source asset ready'
);

select extensions.is(
  (
    select count(*)
    from public.note_search_documents as document
    where document.note_id = current_setting('test.upload_note_id')::uuid
  ),
  1::bigint,
  'publication queues a private search document record'
);

select extensions.ok(
  not public.can_upload_note_object(current_setting('test.upload_object_key')),
  'published source objects cannot receive another upload token'
);

select * from extensions.finish();

rollback;
