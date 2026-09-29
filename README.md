# myYahooClone

A self-hosted personal portal that pulls your daily briefing into one page: live stock
quotes, RSS news, sports scores, and weather forecasts — laid out like the classic
My Yahoo start page, with everything you care about defined in a single JSON file.

![App screenshot](Sample%20Screen%20Shot.png)

## Features

- **Stocks** — multiple watchlists/portfolios with live quotes (price, change, % change)
  sourced from Yahoo Finance, including indices such as `^DJI` and `^GSPC`.
- **News** — RSS/Atom feeds grouped into categories, parsed and rendered as headline
  lists. Feeds that fail to load are dropped from the display rather than breaking the page.
- **Sports** — scores, status (pregame / in-progress / final), and win-loss-tie results for
  your favorite NHL, NFL, NBA, MLB, and MLS teams via ESPN.
- **Weather** — current conditions plus a multi-day forecast for any number of saved
  locations, via Open-Meteo (US and international geocoding included).
- **Fully configurable from the UI** — add/remove stocks, RSS feeds, weather locations, and
  sports teams through in-app modals; the app writes changes back to `myyahoo.json`.
- **Per-section collapse state** — section open/closed state is remembered.
- **Light/dark theme** — toggle between themes; the choice persists in `localStorage`.
- **Manual refresh** — each panel has its own refresh button, and data refreshes on load.

## Architecture

| Piece | Tech | Runs on |
| --- | --- | --- |
| Client | React 19 + Bootstrap 5, bundled with Rsbuild | `http://localhost:3399` |
| Server | Node.js + Express 5 | `http://localhost:5000` |
| Config | `myyahoo.json` | shared |

The client is a static SPA that `POST`s to the Express server. The server reads
`myyahoo.json`, calls the upstream APIs (Yahoo Finance, ESPN, Open-Meteo, and your RSS
feeds), normalizes the results, and returns them to the client. Management endpoints
(add/remove stocks, feeds, locations, teams) write the updated configuration back to
`myyahoo.json`.

```
┌──────────────┐   POST /stockUpdate, /newsUpdate,
│  React SPA   │   /sportsUpdate, /weatherUpdate
│  port 3399   │ ───────────────────────────────▶ ┌──────────────────┐
└──────────────┘                                   │  Express server  │
                                                   │     port 5000    │
                                                   └────────┬─────────┘
                              Yahoo Finance · ESPN · Open-Meteo · RSS feeds
```

## Configuration

All content lives in `myyahoo.json` at the project root:

| Key | Purpose |
| --- | --- |
| `Portfolios` | Named lists of ticker symbols |
| `WeatherAreas` | Saved locations (name, latitude, longitude, forecast `days`) |
| `NewsFeeds` | Feed categories, each containing named RSS/Atom feed URLs |
| `WeatherCodes` | Maps Open-Meteo WMO weather codes to display text |
| `Sports` | Leagues, their ESPN scoreboard URL, and the teams you follow |

You can edit this file directly, or add/remove entries from the gear icons in the UI.

## Install

**Requirements:** [Node.js](https://nodejs.org/) `>=22.12.0` and npm.

The floor is set by the dependencies: `yahoo-finance2@4` requires Node `>=22.0.0`, and
`@rsbuild/core@2.2.11` requires `^20.19.0 || >=22.12.0`. The Docker images use
`node:24-alpine`.

```bash
git clone https://github.com/ccarlin/myYahooClone.git
cd myYahooClone
npm install
```

## Run locally

The app is two processes — start each in its own terminal from the project root.

**1. Start the API server** (port 5000):

```bash
node server.js
```

**2. Start the client** (port 3399):

```bash
npm start
```

Then open [http://localhost:3399](http://localhost:3399).

The client defaults to `http://localhost:5000` for API calls. To point it elsewhere, set
`PUBLIC_API_URL` before starting:

```bash
PUBLIC_API_URL=http://localhost:5000 npm start
```

### Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Run the client in dev mode on port 3399 |
| `npm run build` | Build the client into `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Run the test suite (Node's built-in runner) |
| `node server.js` | Run the API server on port 5000 |

> **Note:** The server resolves `myyahoo.json` relative to the current working directory,
> so always launch it from the project root.

## Run with Docker Compose

The app can also be built and run as two containers (client + server).

**Prerequisites:**
- Docker installed and running.
- Docker Compose (bundled with Docker Desktop).

```bash
docker-compose up --build -d
```

- `--build` forces Compose to rebuild the images first.
- `-d` runs the containers detached in the background.

Then:
- Client: [http://localhost:3399](http://localhost:3399)
- Server API: [http://localhost:5000](http://localhost:5000) (accessed through the client)

> **Note:** both ports are published bound to `127.0.0.1`, so they are reachable from the
> Docker host only — not from other machines on your network. To expose the app on a
> LAN interface, change the `ports` entries in `docker-compose.yml` deliberately and read
> [Security](#security) first.

**Stop the containers:**

```bash
docker-compose down
```

**View logs:**

```bash
docker-compose logs -f
docker-compose logs -f client
docker-compose logs -f server
```

**Configuration:** `myyahoo.json` is bind-mounted from the project directory into the
server container, so edits made locally are picked up by the running server. The client's
API URL is set to `http://server:5000` (the Compose service name) via the
`PUBLIC_API_URL` environment variable.

## Security

This app is built to be run privately, and it has **no authentication**. Anyone who can
reach the server can read your portfolio and add, remove, or overwrite anything in
`myyahoo.json`. The defaults assume it stays on your own machine.

What the project does to reduce accidental exposure:

- **Loopback-only ports.** `docker-compose.yml` publishes `5000` and `3399` bound to
  `127.0.0.1`, so the containers are not reachable from the network.
- **CORS allowlist.** The server reflects only configured origins instead of accepting
  every one. Defaults to `http://localhost:3399` and `http://127.0.0.1:3399`; override
  with a comma-separated `CORS_ORIGINS` environment variable. Note that CORS constrains
  browsers only — it is not an access control, and `curl` from any host bypasses it.
- **SSRF protection on RSS feeds.** Feed URLs are supplied by the user and fetched
  server-side, so they are validated before being saved and again before being fetched.
  Non-`http(s)` schemes are rejected, and any host resolving to a private, loopback,
  link-local (including `169.254.169.254`), CGNAT, or otherwise reserved address is
  refused. This applies to feeds already stored in `myyahoo.json`, not just new ones.

If you need to run this beyond your own machine, put it behind a reverse proxy that
terminates TLS and enforces authentication. Do not rely on CORS or the loopback binding as
your access control.

## License

MIT — see [LICENSE](LICENSE).
