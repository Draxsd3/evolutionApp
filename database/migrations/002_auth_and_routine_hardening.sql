-- Execute after 001_initial.sql.
-- Tightens browser access and enables idempotent daily routine updates.

alter table public.routine_logs
  add constraint routine_logs_marker_date_key
  unique (routine_marker_id, log_date);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists routine_markers_user_id_idx on public.routine_markers(user_id);
create index if not exists routine_logs_user_id_idx on public.routine_logs(user_id);
create index if not exists conversations_user_id_idx on public.conversations(user_id);
create index if not exists messages_user_id_idx on public.messages(user_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'daily_entries', 'meals', 'activities', 'achievements',
    'difficulties', 'habits', 'habit_logs', 'routine_markers',
    'routine_logs', 'conversations', 'messages', 'weekly_reports',
    'user_memories'
  ]
  loop
    execute format('revoke all on table public.%I from anon', table_name);
    execute format(
      'grant select, insert, update, delete on table public.%I to authenticated',
      table_name
    );
    execute format('drop policy if exists "owner_all" on public.%I', table_name);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id) with check ((select auth.uid()) is not null and (select auth.uid()) = user_id)',
      table_name
    );
  end loop;
end $$;
