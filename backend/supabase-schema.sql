create table if not exists public.app_runtime_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_app text not null default 'tiktok',
  limits jsonb not null default '{"tiktok":155,"instagram":150,"youtube":150}'::jsonb,
  views jsonb not null default '{"tiktok":0,"instagram":0,"youtube":0}'::jsonb,
  likes jsonb not null default '{"tiktok":0,"instagram":0,"youtube":0}'::jsonb,
  reposts jsonb not null default '{"tiktok":0,"instagram":0,"youtube":0}'::jsonb,
  lock_until jsonb not null default '{"tiktok":0,"instagram":0,"youtube":0}'::jsonb,
  last_reset_day date not null default current_date,
  total_free integer not null default 500,
  global_remaining integer not null default 500,
  global_used integer not null default 0,
  app_bonus jsonb not null default '{"tiktok":60,"instagram":60,"youtube":60}'::jsonb,
  app_bonus_initial jsonb not null default '{"tiktok":60,"instagram":60,"youtube":60}'::jsonb,
  alerted20 boolean not null default false,
  alerted5 boolean not null default false,
  exhausted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_runtime_state_updated_at on public.app_runtime_state(updated_at desc);

-- RLS on, no policies for the "authenticated" role: rows are read/written only by the Node backend
-- using the Supabase service role key (bypasses RLS). Client apps must not receive policies that
-- allow direct PostgREST access to this table, or users could bypass server-side merge rules.
alter table public.app_runtime_state enable row level security;
