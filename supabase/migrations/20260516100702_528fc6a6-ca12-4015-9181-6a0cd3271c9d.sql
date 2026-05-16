
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end;$$;
create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();

-- tracks catalog
create table public.tracks_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  color text not null,
  icon text not null,
  short_description text not null,
  frameworks text not null,
  ai_system_prompt text not null,
  sort_order int not null default 0
);
alter table public.tracks_catalog enable row level security;
create policy "tracks_catalog_read_all" on public.tracks_catalog for select using (true);

-- user_tracks
create table public.user_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.tracks_catalog(id) on delete cascade,
  started_at timestamptz not null default now(),
  current_streak int not null default 0,
  longest_streak int not null default 0,
  freezes_remaining int not null default 2,
  last_log_date date,
  status text not null default 'active',
  intake jsonb,
  unique(user_id, track_id)
);
alter table public.user_tracks enable row level security;
create policy "ut_select_own" on public.user_tracks for select using (auth.uid() = user_id);
create policy "ut_insert_own" on public.user_tracks for insert with check (auth.uid() = user_id);
create policy "ut_update_own" on public.user_tracks for update using (auth.uid() = user_id);
create policy "ut_delete_own" on public.user_tracks for delete using (auth.uid() = user_id);

-- track logs
create table public.track_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_track_id uuid not null references public.user_tracks(id) on delete cascade,
  log_date date not null default current_date,
  completed boolean not null default true,
  mood int,
  note text,
  created_at timestamptz not null default now(),
  unique(user_track_id, log_date)
);
alter table public.track_logs enable row level security;
create policy "logs_select_own" on public.track_logs for select using (auth.uid() = user_id);
create policy "logs_insert_own" on public.track_logs for insert with check (auth.uid() = user_id);
create policy "logs_update_own" on public.track_logs for update using (auth.uid() = user_id);
create policy "logs_delete_own" on public.track_logs for delete using (auth.uid() = user_id);

-- track messages (AI chat)
create table public.track_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_track_id uuid not null references public.user_tracks(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.track_messages enable row level security;
create policy "msg_select_own" on public.track_messages for select using (auth.uid() = user_id);
create policy "msg_insert_own" on public.track_messages for insert with check (auth.uid() = user_id);
create policy "msg_delete_own" on public.track_messages for delete using (auth.uid() = user_id);
create index on public.track_messages (user_track_id, created_at);

-- insights
create table public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique(user_id, week_start)
);
alter table public.insights enable row level security;
create policy "ins_select_own" on public.insights for select using (auth.uid() = user_id);
create policy "ins_insert_own" on public.insights for insert with check (auth.uid() = user_id);
