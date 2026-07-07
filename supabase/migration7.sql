-- Pin High — migration 7: course photos
-- Run once in Supabase SQL Editor.

-- 1. Photo records
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  path text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table photos enable row level security;
create policy "visible photos are public" on photos for select using (hidden = false);
create policy "signed-in users add own photos" on photos for insert
  with check (auth.uid() = user_id);
create policy "users delete own photos" on photos for delete using (auth.uid() = user_id);

-- 2. Photo reports (review with: select * from photo_reports;
--    hide a photo with: update photos set hidden = true where id = '...';)
create table if not exists photo_reports (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (photo_id, reporter_id)
);
alter table photo_reports enable row level security;
create policy "signed-in users can report photos" on photo_reports for insert
  with check (auth.uid() = reporter_id);

-- 3. Storage bucket (public read, 5MB max, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-photos', 'course-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "public reads course photos" on storage.objects
  for select using (bucket_id = 'course-photos');
create policy "signed-in users upload course photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'course-photos');
create policy "users delete own course photos" on storage.objects
  for delete to authenticated using (bucket_id = 'course-photos' and owner = auth.uid());
