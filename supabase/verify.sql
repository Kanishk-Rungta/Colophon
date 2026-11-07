-- Read-only checks for Colophon's deployed schema. Does not return document bodies.
-- A single result also works with management APIs that return only the last statement.
select jsonb_build_object(
  'tables', (
    select jsonb_agg(jsonb_build_object('name', tablename, 'rls', rowsecurity) order by tablename)
    from pg_tables where schemaname = 'public'
      and tablename in ('workspaces', 'workspace_members', 'action_limits')
  ),
  'policies', (
    select jsonb_agg(jsonb_build_object('table', tablename, 'name', policyname, 'roles', roles, 'command', cmd) order by tablename, policyname)
    from pg_policies where schemaname = 'public'
      and tablename in ('workspaces', 'workspace_members', 'action_limits')
  ),
  'functions', (
    select jsonb_agg(jsonb_build_object(
      'name', signature,
      'anon_execute', has_function_privilege('anon', signature, 'execute'),
      'authenticated_execute', has_function_privilege('authenticated', signature, 'execute'),
      'service_execute', has_function_privilege('service_role', signature, 'execute')
    ))
    from unnest(array['public.initialize_demo(uuid,uuid,jsonb)', 'public.consume_action(uuid)']) as signature
  ),
  'table_privileges', (
    select jsonb_agg(jsonb_build_object(
      'role', role_name,
      'read_workspaces', has_table_privilege(role_name, 'public.workspaces', 'select'),
      'update_workspaces', has_table_privilege(role_name, 'public.workspaces', 'update'),
      'change_roles', has_table_privilege(role_name, 'public.workspace_members', 'update')
    ))
    from unnest(array['anon', 'authenticated', 'service_role']) as role_name
  ),
  'history_trigger', exists (
    select 1 from pg_trigger where tgrelid = 'public.workspaces'::regclass
      and tgname = 'preserve_history' and not tgisinternal and tgenabled <> 'D'
  )
) as verification;
