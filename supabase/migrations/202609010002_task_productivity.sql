alter table public.focus_tasks add column if not exists due_time time;
alter table public.focus_tasks add column if not exists recurrence text not null default 'none';
alter table public.focus_tasks add column if not exists list_id text;
alter table public.focus_tasks add column if not exists subtasks jsonb not null default '[]'::jsonb;
alter table public.focus_tasks add column if not exists pinned boolean not null default false;
alter table public.focus_tasks add column if not exists position bigint not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'focus_tasks_recurrence_check') then
    alter table public.focus_tasks add constraint focus_tasks_recurrence_check check (recurrence in ('none', 'daily', 'weekdays', 'weekly'));
  end if;
end;
$$;

create table if not exists public.focus_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  name text not null check (char_length(name) between 1 and 40),
  color text not null default 'coral' check (color in ('coral', 'green', 'blue', 'yellow')),
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_id)
);

alter table public.focus_lists enable row level security;
drop policy if exists "Users manage own rows" on public.focus_lists;
create policy "Users manage own rows" on public.focus_lists
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists set_updated_at on public.focus_lists;
create trigger set_updated_at before update on public.focus_lists
for each row execute function public.focus_set_updated_at();
