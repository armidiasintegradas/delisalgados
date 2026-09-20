-- DELI SALGADOS — V3.16 CUSTOMER PROFILE AVATAR
alter table public.customer_profiles
  add column if not exists avatar_url text null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-avatars',
  'customer-avatars',
  true,
  2097152,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "customer avatars insert own folder" on storage.objects;
create policy "customer avatars insert own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "customer avatars update own folder" on storage.objects;
create policy "customer avatars update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "customer avatars delete own folder" on storage.objects;
create policy "customer avatars delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "customer avatars public read" on storage.objects;
create policy "customer avatars public read"
on storage.objects
for select
to public
using (bucket_id = 'customer-avatars');
