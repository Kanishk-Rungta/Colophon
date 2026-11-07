# Deployment and live verification report

Verified on 7 November 2026. Repository: `Kanishk-Rungta/Colophon`, branch `main`.

## Current outcome

**The public application is working with Supabase persistence:** [colophon-one.vercel.app](https://colophon-one.vercel.app). The owner imported/deployed the repository through Vercel and connected Supabase. After the owner enabled anonymous sign-ins and authenticated the Supabase CLI, the remaining database schema was applied and the real hosted workflow was tested.

The active project is `tquqrwrudzxnlpqcpqoq` (the Vercel-integrated project). The older `ggxrhdomvxumccyiowmp` project was not modified. No account password, database password, API key, service credential, or token is included in this report or committed to the repository.

## Database work completed

The initial live audit found an enabled Auth service but no application tables. Consequently, authenticated workspace initialization failed. Creating an account/project through the Vercel integration had supplied infrastructure and configuration, but had not installed this application's schema.

1. Confirmed the selected project and empty public schema with authenticated read-only management queries.
2. Applied the exact contents of `supabase/migrations/001_workspace.sql` in one transaction through the Supabase CLI's management-query API. The normal `db push --dry-run` path stalled while initializing its database login role, so it was cancelled before applying anything.
3. Verified `workspaces`, `workspace_members`, and `action_limits`, with RLS enabled on all three. Verified membership read policies, the history-preservation trigger, and privileged initialization/rate-limit functions.
4. Recorded version `001`, name `workspace`, and the exact source statements in the standard `supabase_migrations.schema_migrations` history, after verifying the migration succeeded. The history schema/table are not exposed to browser roles.
5. Confirmed authenticated browser clients can read permitted workspaces but cannot update workspace state or change membership roles. Both privileged RPCs are executable by `service_role`, not `anon` or `authenticated`.

The initial migration is already applied. **Do not paste it into SQL Editor again.** New schema changes should use a new reviewed migration and an explicit remote target. Read-only verification queries are retained in [supabase/verify.sql](../supabase/verify.sql).

## Live checks executed

**12 distinct Playwright tests passed against the public origin**, across scoped runs:

| Scope | Tests | Observed result |
|---|---:|---|
| Complete judge journey | 1 | Required findings, exact correction, rescan, human approval, Publication Record, history, and reload persistence passed |
| Review and evidence workflows | 3 | Blocking-finding overrides, request changes, evidence creation/edit/archive and stale-analysis invalidation passed |
| Responsive approval journeys | 4 | 390, 768, 1280, and 1920-pixel widths passed, including dialogs/navigation and no horizontal document overflow |
| Hosted security/persistence | 3 | Independent sessions/RLS/API isolation, stale-writer conflict, and current database-role enforcement passed |
| Automated accessibility | 1 | Six populated screens reported zero violations under the selected axe WCAG 2/2.1 A/AA rules |

The hosted security tests specifically observed: unauthenticated API 401; foreign content mutation 404; untrusted Origin 403; direct membership write 403; privileged browser RPC 403; foreign-workspace REST read returning no rows; repeated initialization preserving the same seed; and simultaneous saves yielding one 200 and one 409. A newly created test membership was temporarily restricted to creator; approval returned 403 without creating a record, and its original demo roles were restored in `finally` cleanup.

One responsive run encountered a Playwright trace-file teardown error because two test processes shared the same output directory. The affected 1280-pixel case was rerun with a separate output directory and passed. This was a test-artifact collision, not an application assertion failure. Run these suites sequentially or give each process a separate `--output` directory.

Local checks were also executed: **82 unit/integration tests passed**, TypeScript and ESLint passed, and the optimized production build passed. The earlier 14-test local development/production suites remain separately recorded in [VERIFICATION.md](VERIFICATION.md); they are not the live test count.

## Configuration and limits

- The public health endpoint reports hosted mode, schema version 1, and AI disabled. Actual successful workspace writes/reloads establish database connectivity; the health endpoint alone only reports configuration presence.
- No Vercel CLI authentication was needed for the schema repair. The owner performed the Vercel import and account/project configuration. No new paid project was created during this repair.
- Optional live AI remains unconfigured and unevaluated; deterministic reviews work without it.
- Anonymous demo users intentionally hold creator, reviewer, and administrator roles in their own workspaces. Separate-person reviewer provisioning is not implemented.
- These checks establish the tested Round 2 demo behavior, not production-scale readiness or full accessibility certification. Destructive history-tampering SQL, quota exhaustion, backup restoration, and server-restart scenarios were not separately exercised against this live project.
- Fictional isolated test users/workspaces remain in the dedicated project. No existing user data was deleted.

## Owner next steps

Open the [live demo](https://colophon-one.vercel.app/demo) and use the same browser profile when returning to its anonymous workspace. A fresh private browser context creates a separate workspace. Keep service credentials private and monitor anonymous Auth/database usage. Use [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for future configuration changes, migrations, deployment checks, and maintenance.
