create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  qr_code text unique not null,
  event_name text not null,
  full_name text not null,
  phone text not null,
  email text not null,
  city text not null,
  photo_url text,
  status text not null default 'registered',
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.guests enable row level security;

drop policy if exists "nextbeat_insert_guest" on public.guests;
drop policy if exists "nextbeat_read_guest" on public.guests;
drop policy if exists "nextbeat_update_guest" on public.guests;

create policy "nextbeat_insert_guest" on public.guests for insert to anon with check (true);
create policy "nextbeat_read_guest" on public.guests for select to anon using (true);
create policy "nextbeat_update_guest" on public.guests for update to anon using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('guest-photos', 'guest-photos', true)
on conflict (id) do nothing;

drop policy if exists "guest_photos_upload" on storage.objects;
drop policy if exists "guest_photos_read" on storage.objects;

create policy "guest_photos_upload" on storage.objects for insert to anon with check (bucket_id = 'guest-photos');
create policy "guest_photos_read" on storage.objects for select to anon using (bucket_id = 'guest-photos');
