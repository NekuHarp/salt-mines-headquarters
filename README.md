# salt-mines-headquarters

Statistics and monitoring frontend for the [salt-mines](../salt-mines) API — a
Salty Bet fighter tracker with win-chance predictions and automated betting.

## Tech Stack

- React 19 + Vite 7
- MUI 7 (Material UI) with Emotion, MUI X Charts 8
- TanStack Query 5 for data fetching and polling
- React Router 7
- react-hook-form

## Setup

```bash
npm install
cp .env.example .env   # set VITE_SALT_MINES_BACKEND_URL
npm run dev
```

The dev server is pinned to port **5173** with `strictPort`, because the backend
allowlists that exact origin for CORS by default. If the port is taken, Vite
fails loudly rather than moving to one the API will reject.

## Environment Variables

| Variable                      | Description                  |
| ----------------------------- | ---------------------------- |
| `VITE_SALT_MINES_BACKEND_URL` | Base URL of the salt-mines API |

Only `VITE_`-prefixed variables reach client code.

The API's Basic Auth credentials are deliberately **not** environment variables:
anything in `.env` is inlined into the production bundle and readable by anyone
who loads the page. They are entered through the app's login screen and held in
`sessionStorage` for the tab's lifetime.

## Backend requirements

In development the app talks to the API directly, so the API must allow this
app's origin. `CORS_ALLOWED_ORIGINS` in the salt-mines `.env` defaults to
`http://localhost:5173`. Without it the browser blocks every request, including
the login probe, and the failure surfaces as a generic network error because
browsers do not expose CORS rejections to JavaScript.

## Deployment

Deployed on Netlify at <https://salt-mines-hq.netlify.app/>. `netlify.toml`
carries two rewrites that the app does not work without:

- **`/api/*` → the backend**, proxied server-side. The backend serves plain HTTP,
  and a page loaded over HTTPS is not allowed to request an `http://` URL — the
  browser blocks it before the request is sent, and nothing in the frontend can
  opt out. Proxying means the browser only ever talks HTTPS to Netlify. It also
  makes the API same-origin, so CORS does not apply to the deployed app at all.
  `VITE_SALT_MINES_BACKEND_URL` is set to `/api` for the production build via
  `[build.environment]`.
- **`/*` → `/index.html`**, the SPA fallback. React Router owns those paths on
  the client, so without this a reload or a shared link on anything but `/`
  returns Netlify's 404.

The proxy target is a literal IP because Netlify cannot interpolate an
environment variable into a redirect target. That IP is provisioned as
**ephemeral** on the Oracle VM, so a reboot can change it and `netlify.toml`
must be updated in step.

### Transport security

The proxy fixes the browser's mixed-content block. It does **not** encrypt the
traffic. The Netlify-edge-to-backend hop is plaintext HTTP across the public
internet, so the API's Basic Auth credentials and every response are exposed on
that leg to anyone positioned along it.

Closing this properly means giving the backend real TLS — a domain pointed at the
VM with Caddy or nginx plus Let's Encrypt in front of the API, or a Cloudflare
Tunnel — and then pointing `/api/*` at the `https://` origin. That also requires
promoting the VM's ephemeral public IP to a reserved one. Until then, treat the
API credentials as interceptable and do not reuse them anywhere else.

## Pages

| Route          | What it shows                                                            |
| -------------- | ------------------------------------------------------------------------ |
| `/`            | Live match snapshot, win chances, balance, and listener start/stop        |
| `/predictions` | Accuracy, Brier score, calibration, ROI, balance history, and match log   |
| `/fighters`    | Every recorded fighter, sorted and paginated server-side                  |
| `/matchups`    | Head-to-head records per pair of fighters                                 |

## Scripts

- `npm run dev` — Vite dev server with HMR
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run preview` — preview the production build
