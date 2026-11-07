# Initial deployment-readiness assessment

Audit date: 7 November 2026. This assessment describes the repository before the production deployment work in this follow-up.

**Historical assessment:** the items below describe the initial state, before the owner deployed through Vercel and authorized the subsequent database setup. The public site is now verified with hosted persistence; migration `001` is applied. See the current [deployment report](AUTOMATED_DEPLOYMENT_REPORT.md) and [verification results](VERIFICATION.md).

## Application found

- Next.js 16.4.5 App Router, React 19.3.1, TypeScript, npm lockfile, Node 24 recommended/required by package tooling.
- Six connected product screens: `/`, `/demo`, `/demo/studio`, `/demo/evidence`, `/demo/review`, `/demo/records`.
- Real deterministic verification in `lib/engine.ts`; permissions, revision transitions, approval, and publication snapshots in `lib/domain.ts`.
- Next.js Route Handlers at `/api/health` and `/api/workspace`. No separate backend, filesystem database, ORM, or continuously running worker is required.
- Existing verification report records 82 unit/integration tests and 14 browser tests passing in the previous implementation session. These are historical results until rerun here.

## Persistence and authentication found

- Default demonstration uses browser localStorage, which survives refresh but is not a production authorization boundary.
- A Supabase hosted adapter is already implemented. Three environment variables select it together. Partial configuration is rejected.
- Hosted browser authentication uses anonymous sign-in with `@supabase/ssr`. The server validates `getUser()`, resolves membership in PostgreSQL, and enforces roles on every command. Client input does not choose workspace or actor identity.
- `001_workspace.sql` creates a JSONB workspace aggregate, membership table, action limits, RLS, idempotent initialization RPC, and a history-preservation trigger. Domain entities use stable related IDs inside the aggregate. This is an intentional demo-scale database, not twelve separately normalized SQL tables.
- Public/authenticated clients can select only their workspace under RLS and cannot directly write. Server mutations require a server-only service-role credential because all writes pass through domain validation and optimistic concurrency checks.
- Publication Records snapshot the exact content version, evidence versions, findings, decisions, and history. Existing saved content versions and audit/record prefixes are protected by an SQL trigger.

## Deployment configuration found

- Correct existing GitHub remote: `Kanishk-Rungta/Colophon`; branch `main`; authenticated Git push worked in the prior session.
- No `.vercel` project link, Supabase CLI project link/config, `.env.local`, or relevant service environment variables were present in the workspace/environment inspected.
- Vercel and Supabase CLIs were not available as directly installed commands; compatible `npx` invocations are being checked.
- Standard Next.js framework defaults are suitable. No static export or GitHub Pages conversion is appropriate for the requested database/authenticated server deployment.
- No `vercel.json` is necessary merely to deploy this project. Account linking, environment variables, Node 24, Git connection, and production access settings are deployment configuration.

## AI found

Optional OpenAI structured-output analysis is server-only and uses `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL`. Deterministic verification, approval, and records do not require AI. Invalid provider responses, unknown evidence IDs, invalid spans, timeout, and missing configuration preserve deterministic behavior. No AI key is required for this deployment task.

## Work required before a verified production claim

1. Reinstall the locked dependencies and rerun build/type/lint/domain/browser checks.
2. Exercise the actual SQL migration and RLS/constraint behavior rather than relying only on mocked route tests.
3. Authenticate Vercel and Supabase if no usable sessions exist; reuse existing account projects before creating new free resources.
4. Apply reviewed migrations, enable anonymous sign-ins, configure exact environment names securely, and verify independent session isolation through API and public-key database access.
5. Connect the existing GitHub repository, deploy preview/production, verify public access and the full workflow against the real URL, and report actual results.
6. Produce the requested detailed Windows/PowerShell guide and factual deployment report. External authentication remains a dependency, never evidence of a completed deployment.
