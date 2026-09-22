# Vinyl Vault

A React 19 + TypeScript + Vite progressive web app that renders a Discogs
collection from the user's personal access token. All data lives in the
browser (IndexedDB, localStorage, service-worker caches); there is no backend.

## Build, lint, verify

```bash
npm install       # install deps (uses package-lock.json, commit it)
npm run build     # = tsc --noEmit && eslint . && vite build
npm test          # unit tests (vitest, jsdom) — @testing-library/react
```

**Verification for every change is `npm run build && npm test`.** CI runs the
`check` job (`npm ci && npm run build && npm test`) on every PR, and a green
`check` is required to merge. There is no other test suite.

## Issue-first workflow (MANDATORY)

Before starting any new work item, create a GitHub issue:

```bash
gh issue create --title "<what>" --body "..."   # → gives an issue number
```

- Name the branch `fix/...`, `feat/...` or `chore/...` (one per issue).
- Put `Fixes #<n>` on its own line in the PR body so the issue auto-closes on merge.
- Stack branches only when fixes are directly related; otherwise branch off `main`.

## Git / PR conventions

- `main` is protected: **no direct pushes** — every change lands via a pull
  request and a **squash merge**. Required check: `check` (CI).
- After merging, GitHub auto-deletes the head branch (`delete-branch-on-merge` is on).
- Pattern: create branch → implement → `npm run build` → push → `gh pr create`
  → merge once `check` passes. Use `gh pr merge --squash` when asked to merge.
- Commit messages are imperative, single-paragraph (plus context lines), and
  reference the fix: `Fixes #<n>`.

## Architecture

- `src/hooks/useCollection.ts` — load orchestration: stale-while-revalidate.
  Content-first: the release grid commits to the UI immediately; master-year
  enrichment runs in the background and streams in batches.
- `src/api/discogs.ts` — raw Discogs calls, ~60 req/min budget. Master-year
  fetch uses staggered batches of 6 + 6.6s pauses; 429s retry via `Retry-After`.
  All calls go through the same-origin `/discogs` proxy (vite dev + nginx) —
  the app must never call `api.discogs.com` cross-origin, because Discogs' 429s
  carry no CORS headers and the browser would mask throttling as an opaque
  CORS error.
- `src/db/collection.ts` — IndexedDB `vinyl-vault` (idb lib), three stores:
  `collection` (1 row/username), `masterYears` (1 row), `releaseDetails`
  (unbounded tracklist cache — the app's main space grower).
  Bump `VERSION` to invalidate caches after a shape change.
- `src/theme.ts` + `src/styles.css` — CSS-variable themes (`midnight`/`paper`/`club`);
  new UI styles must use existing `--*` tokens, never hardcoded colors.
- PWA via `vite-plugin-pwa`: app-shell precache + `album-art` runtime cache
  (500 entries, 30-day expiry). `vite.config.ts`.

## Platform caveats (important)

- Served over **plain HTTP on LAN** (nginx in the container). IndexedDB and
  localStorage work over HTTP, but these are **secure-context-only** and must
  be feature-detected with graceful degradation: `navigator.storage.*`,
  `navigator.storage.persist()`, and the `caches` Cache API.
- iPhone home-screen install works over HTTP via legacy `apple-*` meta tags;
  the service worker (and therefore **offline** launch) needs HTTPS.
- Release-detail scrolling lock sets overflow on BOTH `<html>` and `<body>`
  (`document.body` alone is unreliable on iOS).

## Dependencies / Dependabot

- Dependabot majors stay **enabled** (we watch how often majors recur) — do not
  add `ignore` rules without the maintainer asking.
- **TypeScript ceiling: 6.0.3.** TS 7 is blocked by `typescript-eslint`'s peer
  range `<6.1.0`. Bumping TS to 7.x will fail CI; don't attempt it.

## Deployment (internal)

- Every `main` push with app paths re-builds the multi-arch image and pushes
  `ghcr.io/ackervekenbm/vinyl-vault:latest` (see `.github/workflows/docker-build.yml`).
- OMV host redeploy: Services → Compose → Files → select `vinyl-vault.yml`
  → **Pull** → **Up**. GHCR requires a classic-PAT `docker login ghcr.io -u ackervekenbm`
  (stored per-host; re-login if expired). Container is stateless — redeploys are lossless.