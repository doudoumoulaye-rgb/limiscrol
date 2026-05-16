-- One-time migration for projects that already ran the older supabase-schema.sql with
-- "Users can read/update/insert their own runtime state" policies.
-- Run in Supabase SQL Editor so clients cannot mutate app_runtime_state via the anon key + JWT.

drop policy if exists "Users can read their own runtime state" on public.app_runtime_state;
drop policy if exists "Users can update their own runtime state" on public.app_runtime_state;
drop policy if exists "Users can insert their own runtime state" on public.app_runtime_state;
