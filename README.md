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

Open <http://localhost:5173>. Enter your Discogs username and personal access token on the first screen — they're stored only in your browser's localStorage.

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

   The password is a GitHub **personal access token** with `read:packages` — create one at <https://github.com/settings/tokens>. (GHCR rejects anonymous pulls even for public images, so this login is required.)

   - **Fine-grained (recommended):** *Personal access tokens → Fine-grained tokens → Generate new token* → name it, set an expiry a year out (the Pi keeps the token until it expires), set *Repository access* → *Only select repositories* → `vinyl-vault`, then under **Account permissions** set **Packages → Read** and leave every other permission at *No access* → generate and copy.
   - **Classic:** *Tokens (classic) → Generate new token (classic)* → tick only **`read:packages`** → generate and copy.

   Use your GitHub username as the login name for either token type. Login is a one-time step; the credential is stored on the Pi. (To also `git pull` updates on the Pi later, grant *Contents → Read* on the same fine-grained token — or add the `repo` scope to a classic one — and use it for `git` too.)
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

4. Save, then under **Stacks** → Add → point it at that file and hit **Up**. Open `http://<pi-ip>:8080`.
5. **To update later:** from the GUI re-pull the image (`docker compose pull`) and **Up** again — no data risk, the container is stateless.

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
- **PWA install needs HTTPS.** Over plain LAN HTTP the app works fine in a browser, but the service worker / "Add to Home Screen" install requires a secure context. If you want installable PWA on the Pi, put a TLS reverse proxy in front: OMV's **Reverse Proxy plugin (nginx + Let's Encrypt)** or a small Caddy container.

## Install as a PWA on your iPhone

1. Serve the app over **HTTPS** (required by iOS — see below) and open it in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. It opens full-screen with the Vinyl Vault icon.

For testing, `localhost` is exempt from the HTTPS requirement, but a real install needs a secure origin.

### HTTPS options

| Option | What to do |
| --- | --- |
| Free static host | Deploy the built `dist/` folder to **Cloudflare Pages**, **Netlify** or **Vercel** — auto-HTTPS, works with the Docker image's output exactly as-is. |
| Self-hosted | Put Caddy in front of the container; it provisions Let's Encrypt certificates automatically. Point a domain at your host and add a Caddyfile line for it. |
| Tailscale | Serve over your tailnet with a `tailscale cert` for personal/private use. |

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
├── .github/workflows/docker-build.yml             # publish multi-arch image to GHCR
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