# Sentry errors-only monitoring (QADDHA)

This branch proposes opt-in browser error reporting using Sentry's official pinned browser bundle plus QADDHA's existing React `ErrorBoundary`. No changes to game UI, game logic, rooms, Supabase, or the 18 games.

## Setup after review

1. Sentry is already connected read-only to NAWAF OS; this **does not** enable error ingestion in QADDHA on its own.
2. Find the **public DSN** in Sentry → organization `nawaf-os` → project `javascript-react` → Client Keys (DSN).
3. Add `VITE_SENTRY_DSN` in Vercel → QADDHA project → Settings → Environment Variables. Start with **Preview only**; do not paste private Sentry auth tokens into the app or Vite env vars.
4. Deploy the feature branch as a preview and check Sentry's SDK network request. The browser bundle loads **only if** a valid DSN was present during the Vite production build.
5. To verify delivery **on preview only**, temporarily call `window.Sentry?.captureException(new Error('QADDHA monitoring verification'))` from a small test-only app entry point or controlled developer action. Do **not** add a publicly accessible “generate error” button or trigger this on production.
6. Inspect Sentry → Issues and confirm the test event belongs to the expected project. Then remove the test trigger, rerun the repository CI, and manually verify the main games and online room flows.
7. Only after preview verification, add `VITE_SENTRY_DSN` to Production in Vercel and approve merging and publishing in a **separate** step. The existing QADDHA PRs and two-device QA requirements remain independent.

## Privacy and failure behavior

- Captures exceptions only. Session Replay, tracing, logging, and performance capture stay off.
- No user ID, HTTP request, breadcrumbs, extra metadata, or React contexts are sent.
- Messages and URL query strings are redacted from error events; exception class and stack locations remain for diagnosis.
- CDN bundle is version-pinned with Subresource Integrity (SRI). Blocked/unavailable CDN or missing DSN never prevents games from loading.
- Error events may still contain metadata in browser stack URLs. Review your Sentry Data Scrubbing settings and applicable privacy notices before turning on production reporting.
- The JS browser SDK is used with explicit reporting from the existing React boundary (instead of adding a new npm dependency and changing the lockfile).

## Evidence before release

- GitHub CI: content validation, TypeScript typecheck, production build.
- Preview with DSN: Sentry event received and visible to NAWAF OS / Noura.
- Manual: no regression in home, all 18 games, room join/rejoin, mobile layout.
- Not in this branch: a UptimeRobot API integration, source map uploads, changes to production DSN, automatic PR merge or deployment.
