create extension if not exists pgcrypto;

create or replace function public.focus_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.focus_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  username text not null default '',
  bio text not null default '',
  cover text not null default 'coral' check (cover in ('coral', 'teal', 'blue', 'charcoal')),
  avatar_path text,
  cover_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists focus_profiles_username_unique
on public.focus_profiles (lower(username)) where username <> '';

create table if not exists public.focus_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  contact_email text not null default '',
  phone text not null default '',
  timezone text not null default 'UTC',
  language text not null default 'ru' check (language in ('ru', 'en')),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  notifications jsonb not null default '{"taskReminders":true,"dailySummary":true,"importantTasks":true,"weeklySummary":false}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.focus_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  text text not null check (char_length(text) between 1 and 500),
  notes text not null default '',
  completed boolean not null default false,
  due_date date,
  priority text not null default 'none' check (priority in ('none', 'low', 'medium', 'high')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

create index if not exists focus_tasks_user_due_idx
on public.focus_tasks (user_id, completed, due_date);

create table if not exists public.focus_quick_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  text text not null check (char_length(text) between 1 and 80),
  due_rule text not null default 'today' check (due_rule in ('none', 'today', 'tomorrow')),
  priority text not null default 'none' check (priority in ('none', 'low', 'medium', 'high')),
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['focus_profiles', 'focus_settings', 'focus_tasks', 'focus_quick_tasks']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "Users manage own rows" on public.%I', table_name);
    execute format(
      'create policy "Users manage own rows" on public.%I for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name
    );
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.focus_set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('focus-avatars', 'focus-avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('focus-covers', 'focus-covers', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users manage own focus media" on storage.objects;
create policy "Users manage own focus media"
on storage.objects
for all
to authenticated
using (
  bucket_id in ('focus-avatars', 'focus-covers')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('focus-avatars', 'focus-covers')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
