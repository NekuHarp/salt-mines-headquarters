# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server with HMR (pinned to port 5173, `strictPort`)
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build

## Architecture

Statistics and monitoring frontend for the **salt-mines** API, which lives at
`../salt-mines` — a Salty Bet fighter tracker with win-chance predictions and
automated betting. This app is read-mostly: the only state it changes is
starting and stopping the backend's listener.

**Stack:** React 19, Vite 7, MUI 7 + MUI X Charts 8, Emotion, TanStack Query 5,
React Router 7, react-hook-form

**Key structure:**

- `src/api/` — one module per API resource, mirroring the backend's own layout.
  `client.js` holds the fetch wrapper: base URL, Basic Auth header, `qs`
  serialization, and `ApiError` (carrying `status` and the backend's numeric
  `errorCode`). A 401 clears the stored credentials, which drops the app back to
  the login screen.
- `src/auth/` — `credentialStore.js` is a plain module store (not React state)
  because the API client needs credentials from outside the component tree and a
  401 must clear them from inside a fetch; React reads it via
  `useSyncExternalStore`. `LoginGate.jsx` gates the whole app.
- `src/features/<domain>/` — one folder per page. `predictions/statistics.js`
  holds every aggregation (accuracy, Brier score, calibration buckets,
  parimutuel profit, ROI) as pure functions, separate from the components.
- `src/components/` — `DataTable` (server-side sort/paging), `QueryState`
  (loading/error wrapper), `StatCard`, `AppLayout`, `Page`.
- `src/hooks/useListParams.js` — paging and sort state, kept in the API's own
  `sort` string form (`"-name"`) so it needs no translation step.
- `src/constants.js` — values **mirrored from the backend**
  (`../salt-mines/src/constants/`). The API validates against its own copy and
  rejects unknown values, so these must be changed in step.
- `src/theme/` — dark-mode MUI theme. `palette.viz` is the data-visualisation
  palette, kept separate from the UI palette so re-theming a button cannot
  repaint a chart.

## Backend contract notes

Things that are easy to get wrong and are not obvious from the endpoint list:

- **CORS is required in development**, where the app calls the backend directly.
  `CORS_ALLOWED_ORIGINS` in the salt-mines `.env` defaults to
  `http://localhost:5173`; `none` disables CORS. Browsers hide CORS rejections
  from JavaScript, so a misconfiguration looks like a generic network error. The
  deployed build goes through Netlify's `/api/*` proxy instead, which is
  same-origin, so CORS does not apply there — see `netlify.toml` and the
  Deployment section of `README.md`. `VITE_SALT_MINES_BACKEND_URL` is therefore
  an absolute origin locally and the relative path `/api` in production;
  `client.js` branches its unreachable-API message on which it is.
- **Basic Auth on everything** except `GET /health_check` and `GET /state`.
  Credentials never live in `.env` — a `VITE_`-prefixed variable is inlined into
  the bundle and publicly readable.
- List endpoints return `{ count, rows }` and accept `offset`, `limit`, `sort`,
  and `created*`/`updated*` bounds. Advanced filters use array syntax
  (`field[]=<operator>&field[]=<value>`), which `qs` produces from an array value.
- `GET /predictions` is the statistics source: one row per recorded match with
  the fighter stats frozen at prediction time. There is no POST — rows are
  written by the backend's listener. Pass `fightersInfo=true` for nested
  `P1`/`P2` objects.
- `GET /fighters` takes `name` as an operator array, so `["contains", text]`
  searches by substring; a bare string is an exact match. Text filters are
  debounced (`SEARCH_DEBOUNCE_MS`) so typing doesn't fire a request per keystroke.
- `GET /state` answers **422** for exhibition matches and 502 when Salty Bet is
  unreachable. Neither is a fault; the UI renders them as states.
- Matchups are sortable only by `P1_name`, `P2_name`, `createdAt`, `updatedAt` —
  not by `matches` or the win columns.

## Code Conventions

- ESLint enforces sorted imports (`sort-imports`), no implicit coercion, the
  security plugin, and prettier formatting. `src/**` gets browser globals and the
  React plugins; `*.config.js` gets Node globals and `eslint-plugin-n`.
  `react/prop-types` is off — the project carries no PropTypes or type checker.
- 4-space indentation (`.prettierrc` sets `tabWidth: 4`).
- UI text is in English.

## Data visualisation

Charts follow a fixed procedure — form first, colour last, and the palette is
validated rather than eyeballed. Before adding or changing a chart, read the
`dataviz` skill.

The three `palette.viz.categorical` slots are assigned in fixed order and never
cycled; they were validated as a set against the `background.paper` surface
(all pairs, dark mode: worst CVD ΔE 9.4, worst normal-vision ΔE 20.9, all ≥3:1
contrast). A **fourth series breaks those floors** — fold it into "Other" or give
it its own chart. `palette.viz.status` is reserved for good/warning/serious/
critical and never used for a series; because red and green are
indistinguishable under deuteranopia, anything status-coloured also carries an
icon and a signed number, so hue is never the only signal.
