# Ollaya Web UI

A browser client for the [Ollaya](../docs/ollaya-api.md) decision server. Built
with Vite + React + Tailwind v4 + shadcn (Nova preset), no backend.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. The UI expects an Ollaya server at
`http://127.0.0.1:11435` by default; change it from the Settings dialog in the
header (values live in `localStorage`).

Point the UI at any Ollaya server, on this machine or elsewhere — cross-origin
requests must be allowed by the server (`OLLAYA_ORIGINS`), and if the server has
`OLLAYA_API_KEY` set, paste the key into Settings so it's sent as
`Authorization: Bearer <key>`.

## What's inside

- **Decide** — build typed questions (`choice`, `score`, `noul`), send them to
  `/api/decide` with a state, and inspect answers with calibrated probability
  bars, confidence badges, routing info, and timings. A "Sample" button loads
  the ticket-triage example from the API docs.
- **Models** — browse local models from `/api/tags` in a table, pull new ones
  with streamed per-layer progress, delete, copy, and create derived models
  with built-in questions. "Show details" wraps `/api/show`, including the
  Modelfile and license text.
- **Running** — snapshot of `/api/ps` with auto-refresh every 5 s. Each row has
  an "Unload" button that calls `/api/decide` with `keep_alive: 0`.

## Layout

```
src/
  App.jsx                    root: SettingsProvider + Toaster
  main.jsx                   entry
  index.css                  tailwind + theme tokens (shadcn Nova)
  lib/
    ollaya.js                fetch wrapper + NDJSON streaming
    settings.js              baseUrl + apiKey persisted in localStorage
    theme.js                 light / dark / system toggle
    hooks.js                 useModels, useRunning
    format.js                bytes, nanoseconds, percentages, timestamps
    utils.js                 shadcn cn re-export
  components/
    ui/                      shadcn primitives (Tailwind under the hood)
    AppShell.jsx             sticky header + tabs
    ServerStatus.jsx         version ping every 30 s
    SettingsDialog.jsx       baseUrl + apiKey editor
    SettingsContext.jsx
    ThemeToggle.jsx
    decide/                  ProbBar, AnswerCard, QuestionEditor
    models/                  PullDialog, CreateDialog, ShowDialog,
                             CopyDialog, DeleteDialog, StreamProgress
  pages/
    DecidePage.jsx
    ModelsPage.jsx
    RunningPage.jsx
    AboutPage.jsx
```

## Scripts

- `npm run dev` — Vite dev server on :5173
- `npm run build` — production bundle in `dist/`
- `npm run preview` — serve the built bundle
- `npm run lint` — oxlint
