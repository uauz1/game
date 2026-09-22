# Sentry errors-only monitoring (QADDHA)

This branch proposes opt-in browser error reporting using Sentry's official pinned browser bundle plus QADDHA's existing React `ErrorBoundary`. No changes to game UI, game logic, rooms, Supabase, or the 18 games.

## Setup after review

1. Sentry is connected read-only to NAWAF OS; **that connection alone does not activate QADDHA's frontend SDK**.
2. Verified the public DSN directly from Sentry's `javascript-react` project's Client Keys endpoint and included it as a public, non-secret browser ingestion address in this draft PR. This avoids requiring further Vercel environment setup solely to test Preview. `VITE_SENTRY_DSN` remains available as an optional override; **never** place a private Sentry API token in a Vite environment variable.
3. Verified the official pinned Sentry CDN bundle's SHA-384 checksum against the actual downloaded bundle using an isolated cloud browser.
4. Tested Sentry's ingestion with one *synthetic info-level event from an isolated cloud browser*, and independently confirmed the event exists in `javascript-react` (`JAVASCRIPT-REACT-1`). The event is filtered out of NAWAF OS real incident alerts. **This does not prove the QADDHA Preview frontend has loaded the SDK.**
5. GitHub Actions passed after including the verified public DSN. The Vercel PR preview deployment exists but currently requires Vercel SSO, and the available Vercel connection has no access to that project; actual in-app browser validation and a separate production release remain pending.
6. To verify actual app delivery **on preview only**, temporarily call `window.Sentry?.captureException(new Error('QADDHA monitoring verification'))` from a small test-only app entry point or controlled developer action. Do **not** add a publicly accessible “generate error” button or trigger this on production.
7. Inspect Sentry → Issues and confirm the test event belongs to the expected project. Then remove the test trigger, rerun the repository CI, and manually verify the main games and online room flows.
8. Only after preview verification, add `VITE_SENTRY_DSN` to Production in Vercel and approve merging and publishing in a **separate** step. The existing QADDHA PRs and two-device QA requirements remain independent.

## Privacy and failure behavior

- Captures exceptions only. Session Replay, tracing, logging, and performance capture stay off.
- No user ID, HTTP request, breadcrumbs, extra metadata, or React contexts are sent.
- Messages and URL query strings are redacted from error events; exception class and stack locations remain for diagnosis.
- CDN bundle is version-pinned with Subresource Integrity (SRI). Blocked/unavailable CDN or missing DSN never prevents games from loading.
- Error events may still contain metadata in browser stack URLs. Review your Sentry Data Scrubbing settings and applicable privacy notices before turning on production reporting.
- The JS browser SDK is used with explicit reporting from the existing React boundary (instead of adding a new npm dependency and changing the lockfile).
- The public DSN is intentionally visible in the browser; the separate Sentry API access token is encrypted within Hatchable and never included in client code.

## Evidence before release

- GitHub CI: content validation, TypeScript typecheck, production build.
- Preview with DSN: Sentry event received and visible to NAWAF OS / Noura.
- Manual: no regression in home, all 18 games, room join/rejoin, mobile layout.
- Not in this branch: a UptimeRobot API integration, source map uploads, changes to production DSN, automatic PR merge or deployment.
