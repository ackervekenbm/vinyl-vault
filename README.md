# Vinyl Vault

A web-based, PWA-capable viewer for your personal **Discogs collection**. Fetch your collection once, browse it offline — grouped by artist, sorted the way you want, searchable and filterable.

## Features

- **Your collection, beautifully browsed** — collection fetched from the Discogs API and grouped by artist in a cover-art grid. Split/collaboration releases are cross-listed under every credited artist (compilations stay under **Various**), and Discogs' disambiguation suffixes are stripped, so **Alice Cooper (2)** groups and searches under **Alice Cooper**.
- **Filing sort** — leading articles (`a`, `an`, `the`) are ignored when sorting, so **The Menzingers** files under **M**. Diacritics and punctuation are normalized too (`Motörhead` → `motorhead`).
- **Sort within an artist** — toggle between **Year** (oldest → newest, default) and **A–Z** (by album name, article-stripped) per artist; click any artist header to collapse or expand its shelf.
- **Summary & unique albums** — the summary keeps running totals of `N artists · M releases · U unique albums`; every artist header shows its own release and unique-album counts. *Unique albums* counts distinct masters (a release id when a master is missing), so several pressings of the same album count once.
- **Search & filter** — debounced search across artist, title, genre, style, label and year; filters for format and genre populated from your actual data.
- **Collection folders** — a first-level folder bar above the search: pick a Discogs folder (or **All**) and the search, filters, summary and grids all follow that folder. The whole collection is still fetched once, so switching folders is instant.
- **Release details** — click any cover for an overlay with everything we have on hand: original/pressing years, format, label + catno, genres/styles, credits, country, rating, added date, and direct Discogs links.
- **Random picker** — can't decide what to listen to? A floating shuffle button always sits in the corner for one-click picks from the current folder (respecting any active search/filters); with the detail view open it re-rolls to a new random release.
- **Tracklists** — the detail view also lists the full tracklisting, loaded per release on demand and cached in IndexedDB (so it's instant on reopening and works offline).
- **4 UI styles** — choose from **Midnight** (dark navy), **Paper** (warm light), **Club** (neon dark) or **Forest** (mossy dark) in settings; your choice is remembered.
- **Offline & installable** — service worker caches the app shell and cover art; your collection is cached in IndexedDB so it loads instantly and works offline. Install on iPhone/Android via "Add to Home Screen".
- **Rate-limit friendly** — pages are fetched sequentially with backoff/retry to stay inside Discogs' 60 req/min limit.

## Requirements

- Node.js **22+** (for development/build)
- A free **Discogs personal access token** — create one at <https://www.discogs.com/settings/developers>
- Docker (optional, for containerized hosting)

## Quick start (development)

```bash
npm install
npm run dev
```

Open <http://localhost:5199>. Enter your Discogs username and personal access token on the first screen — they're stored only in your browser's localStorage. (If 5199 is taken, Vite automatically moves to the next free port and prints the address.)

## Run it in Docker

```bash
docker compose up --build
```

Then open <http://localhost:8080>. The image is a multi-stage build: the frontend is compiled in `node:22-alpine`, then served by `nginx:alpine` (gzip, SPA fallback, immutable caching for hashed assets).

### On a Raspberry Pi running OpenMediaVault

The image builds natively for **arm64**, so it runs on a Pi without any changes. Because OMV's own web UI listens on ports 80/443, the app is exposed on host port **8080**.

There are two ways to deploy; pick one.

**Route A — prebuilt image (all from the OMV web UI)**

Every push to `main` builds each architecture **natively on GitHub's ARM/x86 runners** (no emulation) and merges the two images into one multi-arch tag: `ghcr.io/ackervekenbm/vinyl-vault:latest`. The workflow lives in `.github/workflows/docker-build.yml`. No building on the Pi.

1. In OMV, install **omv-extras**, then enable **Docker** and the **Compose plugin** (Services → Compose).
2. **One-time registry login over SSH.** Unlike Docker Hub, the GitHub Container Registry requires a login for every pull, even of public images. On the Pi:

   ```bash
   sudo docker login ghcr.io -u ackervekenbm
   ```

   The password is a GitHub **personal access token (classic)** — fine-grained tokens don't support GitHub Packages at all, so this has to be a classic token. (GHCR also rejects anonymous pulls even for public images, so this login is required.)

   Create it at <https://github.com/settings/tokens> → **Tokens (classic)** → *Generate new token (classic)* → tick **`read:packages`** (add **`repo`** too if you also want `git pull` updates on the Pi to work with the same token), set an expiration, and generate. Copy the token (shown only once) and use your GitHub username as the login name. Login is a one-time step; the credential is stored on the Pi.

   Note: a classic token can access everything your account can access on GitHub — keep the expiry short-ish (up to a year), and if it expires, re-login on the Pi (`sudo docker login ghcr.io` again) before pulling.
3. Services → Compose → **Files** → create a new file named `vinyl-vault.yml`, pasting:

   ```yaml
   services:
     vinyl-vault:
       image: ghcr.io/ackervekenbm/vinyl-vault:latest
       container_name: vinyl-vault
       ports:
         - "8080:80"
       restart: unless-stopped
   ```

4. Save. Back in **Services → Compose → Files**, select `vinyl-vault.yml` and press **Up** — this creates and starts the container. Open `http://<pi-ip>:8080`.

5. **To update later** (every `main` merge ships a new `:latest`): in **Services → Compose → Files**, select `vinyl-vault.yml` → press **Pull** (downloads the latest image) → press **Up** again (recreates the container with the new image; an unchanged image is a no-op). The container is stateless — no volumes, no data risk. If **Pull** fails with an auth error, redo the one-time login (`sudo docker login ghcr.io -u ackervekenbm`) first, then pull again.

   Then refresh the app on your phone: it's served over plain HTTP (no service worker), so a normal refresh fetches the new build — nginx never caches `index.html`. Force-refresh once if you suspect a stale tab.

**Route B — build it on the Pi**

```bash
cd ~
git clone https://github.com/ackervekenbm/vinyl-vault.git
cd vinyl-vault
sudo docker compose up -d --build
```

Notes:
- **No volumes needed** — the container is pure static hosting; every user's data lives in the browser. Recreates/updates are lossless.
- **To update later:** `git pull && sudo docker compose up -d --build` in the same folder.
- **Home-screen shortcut works over plain HTTP; offline install needs HTTPS.** "Add to Home Screen" works over HTTP (the page ships the legacy `apple-touch-icon` / `apple-mobile-web-app-capable` tags). The service worker — and therefore launching the app *with the Pi powered off* — requires a secure context. See [Install on your iPhone](#install-on-your-iphone).

## Install on your iPhone

iOS treats "Add to Home Screen" as a bookmark, so it works over **plain HTTP** — no HTTPS or device setup required:

1. Open the app in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. It launches standalone with the Vinyl Vault icon (the app ships the legacy `apple-mobile-web-app-capable` and `apple-touch-icon` tags, which iOS honors over HTTP).

The one thing an HTTP shortcut doesn't get is the **service worker**, so launching it always requires the server to be reachable — there is no offline start while the Pi is powered off. Your collection, settings and tracklists still live in IndexedDB either way. For a self-hosted LAN setup where the server is essentially always on, plain HTTP is usually fine.

If you do want a true offline-capable install (open the app with the server down), the service worker needs a **secure context (HTTPS)** — and the certificate must be one the device trusts, since Safari and Android refuse or warn on certificates from unknown issuers. Security-wise, self-signed certs encrypt fine; the warning is purely about trust: either the device already trusts the issuer (a public CA) or you teach it to trust yours. From least to most setup:

| Approach | What's needed | Notes |
| --- | --- | --- |
| **mkcert — your own local CA** | Install your CA profile once on each device | Fully self-hosted and offline; no external party involved |
| **Domain + Let's Encrypt** (DuckDNS + Caddy/nginx) | A free domain and a TLS reverse proxy; use the **DNS-01** challenge so no ports need to be opened | Public CA, so devices trust it with zero setup |
| **Tailscale** | Tailscale on the Pi and your devices | Free, auto-renewing Let's Encrypt certs on your private tailnet via `tailscale serve` |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Type-check, lint, then production build to `dist/` (also regenerates the PWA service worker + manifest) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` / `lint:fix` | ESLint (flat config; eslint.config.js with js + typescript-eslint + react-hooks + react-refresh) |
| `npm run icons` | Regenerate app icons from `public/icons/icon.svg` (needs a one-off `npm i -D sharp`) |

## Project structure

```
├── Dockerfile / docker-compose.yml / nginx.conf   # containerized hosting
├── .github/
│   ├── workflows/
│   │   ├── ci.yml             # PR checks (type-check + lint + build)
│   │   └── docker-build.yml   # publish multi-arch image to GHCR
│   └── dependabot.yml         # weekly dependency-update PRs
├── eslint.config.js                               # ESLint flat config
├── index.html                                     # app shell + PWA/iOS meta tags
├── vite.config.ts                                 # build + PWA configuration
├── public/
│   ├── icons/                                     # app icons (192, 512, maskable)
│   ├── favicon.svg
│   └── apple-touch-icon.png
├── scripts/gen-icons.mjs                          # icon generator
└── src/
    ├── api/discogs.ts                             # Discogs client (pagination, retries)
    ├── db/                                        # settings + IndexedDB collection cache
    ├── hooks/useCollection.ts                     # fetch/cache/refresh lifecycle
    ├── utils/
    │   ├── sortName.ts                            # article-stripping sort keys
    │   └── collection.ts                          # grouping, filtering, display shaping
    ├── types/discogs.ts                           # Discogs API types
    └── components/                                # Settings, SearchBar, FilterBar, …
```

## How it works

1. **Settings screen** — you enter username + personal access token.
2. **Fetch** — `GET /users/{username}/collection/folders/0/releases` is paginated (100 per page) with a ~1.1s delay between pages to respect Discogs rate limits. Failures retry with exponential backoff.
3. **Cache** — the full collection (plus the folder list) is stored in IndexedDB per username. Reopening the app shows cached data instantly and re-syncs in the background (stale-while-revalidate). Original release years are enriched from each unique master (one paced API call each) and cached too, so pressing-vs-original years work offline.
4. **Browsing** — pick a folder (or **All**), then releases are grouped by artist (split releases appear under every credited artist; compilations under **Various**), artists sorted by their filing-sort key, and every artist section carries its own Year/A–Z toggle.

## Privacy notes

- Your token is kept **in your browser only** (localStorage). It's sent to Discogs and nowhere else. Anyone with access to your device could extract it — regenerate it anytime at <https://www.discogs.com/settings/developers>.
- "Clear local data" in settings removes the cached collection and stored credentials from your device.

## Future ideas

**Organization & practicality**
- **Saved views / smart lists** — persist filter combinations as named lists ("7-inch singles", "90s techno") and switch between them from the toolbar.
- **Master view** — group all pressings of the same master under one card ("4 pressings") alongside the current per-release browsing.
- **Collection stats dashboard** — top genres, styles, labels and formats; year-distribution and acquisition-timeline charts from the cached data.
- **Collection export** — one-click CSV/JSON dump of the collection (or a printable shelf list).
- **Listen log** — extend the random picker to log each pick as listened, re-roll avoiding recently-played records.

**Discovery & buying**
- **Record-store mode** — look up any release (or scan its barcode) and instantly see whether it's in your collection, which folder it lives in, and which pressings you own.
- **Artist completeness** — "you own 6 of 41 releases": compare your collection against each artist's full Discogs discography (paced API calls, like the master-year enrichment).
- **Collection value** — estimated spend/total value from Discogs price data, with most-valuable records on top.

**UX polish**
- **Recently added view** — globally sort by *date added* (the data's already cached, zero extra API cost).
- **Keyboard shortcuts & shuffle-all** — J/K to navigate, Enter to open, R for random; plus a global "listen through the collection" queue mode.

**Shelf & accounts**
- **Record cabinet organizer** — describe your furniture (e.g. 1 cabinet × 8 slots) and the app assigns every record a slot in it. You pick the rules, it picks the placement: keep 7″/10″ separate from 12″, keep an artist's records together, sort by artist then year (or title), and distribute evenly across slots. Like a shelf-planning assistant for your collection.
- **Multi-user via Discogs OAuth** — real per-user login instead of a shared personal access token.

---

This README is part of the repo and is kept in sync as the app evolves — when features, commands, or structure change, this file is updated to match.