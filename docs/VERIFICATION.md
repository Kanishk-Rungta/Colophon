# Verification report

Implementation checked on 7 November 2026 (client date). All results below are from executed checks, not targets or fabricated benchmark metrics.

## Automated checks

| Check | Result | Scope |
|---|---|---|
| `npm test` | **82 passed**, 5 files | Engine, domain lifecycle, structured-AI boundaries, storage validation, authenticated command-route behavior with mocked database/session dependencies, and labelled regression samples |
| `npm run evaluate` / regression suite | **28 labelled samples passed** (included in the 82) | Approved/incorrect numbers, terms, guarantees, tone, scope, expired/archived sources, prompt injection, and known coverage boundaries |
| `npm run typecheck` | Passed | Strict TypeScript |
| `npm run lint` | Passed | Next.js/React/TypeScript ESLint configuration |
| `npm run build` | Passed | Optimized Next.js production build; all six product screens and API routes generated |
| `npm audit` | **0 vulnerabilities** | Full final dependency tree, including development dependencies; a compatible minimatch override fixes the reported glob-matcher advisory |
| Playwright, development server | **14 passed** | Judge journey, overrides, request changes, evidence CRUD/archive/stale scans, browser-context isolation, four responsive workflows, storage errors, malformed data, keyboard focus, pasted markup, six-screen axe audit |
| Playwright, production server | **14 passed** | Same full suite against the optimized `next start` build at port 3001; completed in 1.6 minutes |

## Public hosted verification

After applying migration `001` to project `tquqrwrudzxnlpqcpqoq`, **12 distinct Playwright tests passed against https://colophon-one.vercel.app**: the judge journey (1), evidence/review workflows (3), responsive journeys at 390/768/1280/1920 pixels (4), hosted security/persistence tests (3), and the six-screen accessibility audit (1). These ran in scoped invocations, not one combined 12-test invocation. The 1280-pixel case passed an isolated retry after a shared trace-directory teardown collision.

Real Supabase tests verified independent workspaces, own-row REST access, foreign-row invisibility under RLS, denied direct membership writes and privileged RPC access, API authentication/Origin checks, idempotent initialization, refresh persistence, and concurrent saves returning one 200 and one 409. A temporary creator-only membership could not approve; the server returned 403 and left the content in review, after which the test restored its original roles.

Read-only database queries confirmed RLS on all three tables, membership policies, server-only RPC privileges, browser-role write restrictions, the history trigger, and recorded migration version `001`. No destructive history-tampering or rate-limit-exhaustion test was performed against the live project. See [the deployment report](AUTOMATED_DEPLOYMENT_REPORT.md) for details.

The live six-screen axe artifact reports zero violations under its selected rules. The current local rerun also passed all 82 unit/integration tests, strict TypeScript, ESLint, and an optimized production build. The 14-test browser counts above describe the earlier local suites and are separate from the 12 hosted tests.

## Browser coverage

The central journey loads the problematic sample, confirms the three required findings and real source IDs, applies an exact suggestion, edits and rescans a new revision, submits it, explicitly approves it, opens its Publication Record, inspects earlier text, and verifies persistence after reload. The primary journey captures runtime exceptions and asserts none occurred.

Separate tests verify that unresolved blockers disable approval, individual override reasons must be meaningful, reasons persist into the record/audit, request changes returns a revision to editing, and evidence edits invalidate existing analysis. A newly added rule that is later archived does not change the original active evidence set; the invalidation test changes an actual governing record.

Responsive tests execute approval workflows at **390×844, 768×1024, 1280×800, and 1920×1080**. They verify navigation, accessible editor controls, native dialogs within the viewport, evidence/record access, reduced-motion settings, and no document-level horizontal overflow. Genuine PNG captures are generated in `artifacts/`; selected final captures are retained in `docs/screenshots/`.

Resilience tests inject a browser quota failure and verify no saved state was replaced and no success was reported. Malformed storage is preserved with a recovery message. Mobile navigation and dialogs support Escape and focus restoration. Pasted markup remains text, and edits disable stale suggestions.

## Accessibility scope

The automated axe test examines the landing, overview, scanned studio, evidence library, populated review desk, and populated publication record using WCAG 2 A/AA and WCAG 2.1 A/AA rule tags. The final run reports **zero violations under those automated rules**. The audit led to actual contrast fixes for source/metadata text and a keyboard-focusable audit scroller. Mobile Escape/focus behavior is tested separately. This is not a complete accessibility certification or a full assistive-technology audit.

## Regression interpretation

The 28 samples are developer-labelled checks of configured deterministic behavior. They are not a held-out accuracy benchmark. One sample intentionally demonstrates that an arbitrary semantic claim outside the configured rules receives no deterministic finding. Archived/expired evidence is excluded, which does not itself establish that an old claim is false. Every deterministic finding is checked against a real applicable evidence snapshot.

## Explicit verification limits

- **Live Supabase coverage is scoped.** The hosted checks above exercised real Auth, database RLS, permissions, persistence, and concurrency. Unit route tests still use mocks. The existence of the history/rate-limit guards was verified, but destructive history rewrites, 61-action quota exhaustion, backup restoration, and server restart were not separately live-tested.
- **Live AI was not called.** No provider key/model was supplied. Schema/span/reference validation and missing-key fallback are tested; live model behavior, cost, and semantic accuracy are not measured.
- **Public deployment verified:** https://colophon-one.vercel.app. The owner deployed through Vercel; the subsequent schema repair and browser checks are recorded separately. Live AI remains disabled.
- The in-app browser preview tool failed to initialize in this environment. Visual QA uses actual Playwright captures inspected locally, not a fabricated screenshot or a claim that the preview tool worked.
- Browser-local storage provides no protection against the browser owner editing records. This limitation appears in the UI, README, and architecture document.

## Submission artifacts

The PDF is generated by `scripts/create_submission_pdf.py` from real product captures and actual test counts. Final output: `output/pdf/colophon-round2.pdf` (five pages). It is rendered with PDFium and visually inspected before delivery. The installed Poppler/MiKTeX wrapper required unfinished system setup, so a temporary workspace-local PDFium renderer supplied the page images. The PDF's text is extracted with pypdf as an additional content check; rendering remains the layout check.

All five final rendered pages were inspected. Headings, body text, screenshots, page numbering, and footers fit without clipping or overlap. Required Round 3 names and the actual test counts were confirmed in extracted text.
