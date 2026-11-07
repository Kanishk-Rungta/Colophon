-- Apply in a new Supabase project. No service key is exposed to the browser.
-- Aggregate storage is an intentional Round 2 simplification; domain entities
-- have stable IDs and explicit relationships within the versioned state.
create table public.workspaces (
  id uuid primary key,
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  revision integer not null default 0 check (revision >= 0),
  state jsonb not null check (state->>'schemaVersion' = '1'),
  created_at timestamptz not null default now(),
  check ((state->>'id')::uuid = id),
  check ((state->>'revision')::integer = revision)
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid primary key references auth.users(id) on delete cascade,
  roles text[] not null check (roles <@ array['creator','reviewer','admin']::text[])
);
create index workspace_members_workspace on public.workspace_members(workspace_id);
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
create policy "own membership" on public.workspace_members for select to authenticated using (user_id = (select auth.uid()));
create policy "member workspace read" on public.workspaces for select to authenticated using (
  exists (select 1 from public.workspace_members m where m.workspace_id = id and m.user_id = (select auth.uid()))
);
-- No client write policies. Every mutation passes through the authenticated server.
revoke all on public.workspaces, public.workspace_members from anon, authenticated;
grant select on public.workspaces, public.workspace_members to authenticated;
grant all on public.workspaces, public.workspace_members to service_role;

create function public.initialize_demo(p_user_id uuid, p_workspace_id uuid, p_state jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Transaction-level lock makes initialization idempotent even across tabs.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if exists(select 1 from public.workspace_members where user_id = p_user_id) then return; end if;
  insert into public.workspaces(id,owner_id,state) values(p_workspace_id,p_user_id,p_state);
  insert into public.workspace_members(workspace_id,user_id,roles)
    values(p_workspace_id,p_user_id,array['creator','reviewer','admin']);
end; $$;
revoke all on function public.initialize_demo(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.initialize_demo(uuid,uuid,jsonb) to service_role;

-- Preserve records and audit events as append-only prefixes in normal writes.
create function public.guard_workspace_history() returns trigger language plpgsql set search_path = '' as $$
declare field text; old_value jsonb; new_value jsonb; i integer;
begin
  if new.revision <> old.revision + 1 then raise exception 'Invalid revision'; end if;
  foreach field in array array['audit','records','versions','evidenceHistory','decisions'] loop
    old_value := old.state->field; new_value := new.state->field;
    if jsonb_array_length(new_value) < jsonb_array_length(old_value) then raise exception 'History cannot be removed'; end if;
    if jsonb_array_length(old_value) > 0 then
      for i in 0..jsonb_array_length(old_value)-1 loop
        if (new_value->i) is distinct from (old_value->i) then raise exception 'History cannot be rewritten'; end if;
      end loop;
    end if;
  end loop;
  return new;
end; $$;
create trigger preserve_history before update on public.workspaces for each row execute function public.guard_workspace_history();

create table public.action_limits(user_id uuid primary key references auth.users(id) on delete cascade, window_start timestamptz not null default now(), count integer not null default 1);
alter table public.action_limits enable row level security;
revoke all on public.action_limits from anon, authenticated;
create function public.consume_action(p_user_id uuid) returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into public.action_limits(user_id) values(p_user_id)
  on conflict(user_id) do update set
    count = case when public.action_limits.window_start < now()-interval '1 minute' then 1 else public.action_limits.count+1 end,
    window_start = case when public.action_limits.window_start < now()-interval '1 minute' then now() else public.action_limits.window_start end
  returning count into n;
  return n <= 60;
end; $$;
revoke all on function public.consume_action(uuid) from public, anon, authenticated;
grant execute on function public.consume_action(uuid) to service_role;
