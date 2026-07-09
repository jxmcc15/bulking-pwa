# CLAUDE.md — Bulk Day PWA

## What this is

"Bulk Day" — a single-file PWA that shows James the next session of his 90-day bulking program and lets him bank completed sessions. The design is FINAL and lives in `docs/superpowers/specs/2026-07-08-bulk-day-v2-design.md` (v2 "Locker Room", approved 2026-07-08; v1.1 spec still governs anything v2 doesn't change). Build to that spec; do not re-open design questions.

## Owner context

James is a beginner developer — this project doubles as his "what is a PWA, really" lesson. Keep the code plainly readable top-to-bottom: no frameworks, no build step, no minification, comments only where a constraint isn't visible in the code (iOS quirks, SW scope, GitHub Pages base path).

## Tech rules

- Six files total: `index.html` (whole app), `manifest.json`, `sw.js`, `icon-512.png`, `README.md`, this file. Nothing else except `docs/` and `MORNING-REPORT.md` after the overnight build.
- All paths relative (`./`) — the site serves from `https://<user>.github.io/bulking-pwa/`, not the domain root.
- `index.html` changes deploy with a plain push (the service worker is stale-while-revalidate for navigations; installed copies update on their second online launch). Only `manifest.json`/icon changes require bumping `CACHE_NAME` in `sw.js`.
- Adherence philosophy is a spec requirement, not a style choice: the UI never renders a missed/late/behind/red state. Progress only counts up. The one sanctioned exception (v2): coach "comeback lines" may tease absence at the moment of banking a return session — never during absence.
- Coach voice (v2): trash talk at the damn/hell tier, punches at effort and excuses, never at James's body or the goal. Sincere breaks only at spec-defined moments.
- Plan content mirrors `/Users/jxm/jxm-vault/Topics/90-Day Bulking Plan.md` (canonical). If they drift, the vault wins.

## Deploy

Public repo `bulking-pwa`, GitHub Pages from `main` root, via `gh`. If `gh auth status` fails, stop at a local commit and write manual deploy steps into `MORNING-REPORT.md` — never improvise credentials.

## Done means

`afplay /System/Library/Sounds/Glass.aiff`, and a `MORNING-REPORT.md` James can read with coffee: what was built, review findings + outcomes, live URL (or deploy steps), iPhone install steps, and what still needs a human (real-device offline test).
