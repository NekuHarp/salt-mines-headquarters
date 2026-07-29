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

The API must allow this app's origin. `CORS_ALLOWED_ORIGINS` in the salt-mines
`.env` defaults to `http://localhost:5173`; set it to the deployed origin in
production. Without it the browser blocks every request, including the login
probe, and the failure surfaces as a generic network error because browsers do
not expose CORS rejections to JavaScript.

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
