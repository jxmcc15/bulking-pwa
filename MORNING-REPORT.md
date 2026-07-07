# Morning Report — Bulk Day PWA overnight build

**Date:** 2026-07-07 · **Status:** Built, reviewed, fixed, verified, deployed.

## TL;DR

Bulk Day is live at **https://jxmcc15.github.io/bulking-pwa/**. All five files
built to spec v1.1, audited by three independent reviewers, 7 confirmed
findings fixed, 35/35 logic boundary tests passing, deployed to public GitHub
Pages. What's left needs your hands: install it on the iPhone and run the
airplane-mode test.

## What was built

Six-file static PWA, no build step, repo = deployable artifact:

| File | What it is |
| --- | --- |
| `index.html` (~1,190 lines) | The whole app: plan data, local-time date/sequence logic (in an extractable "PURE LOGIC" block), all four screen states, dot grids, collapsible reference section, embedded CSS/JS |
| `manifest.json` | PWA manifest — "Bulk Day", standalone, dark theme, `./` scope |
| `sw.js` | Cache-first service worker, cache `bulk-day-v1`, pre-caches the shell, deletes old caches on activate, `ignoreSearch` so offline navigations with query strings resolve |
| `icon-512.png` | 512×512 dark tile, generated programmatically (Python stdlib) |
| `README.md` | What it is + iPhone install steps + the localStorage honesty note |
| `CLAUDE.md` | Already existed (project context) |

## One bump in the night

The build agent hit the session usage limit at ~12:03am — *after* writing all
five files but before reporting back, so the orchestration marked it failed.
On inspection this morning the build was complete and sound; the pipeline
resumed from review with nothing rebuilt.

## Review findings (3 reviewers: spec, logic, PWA/iOS) — all 7 confirmed fixed

1. **Coach note never showed after banking a lift** (major). Banking advanced
   the A→B→C rotation *before* the re-render, so the "reward" line compared
   against the wrong workout and the card instantly flipped to the next
   session. Fixed: the just-banked type is carried through one render, so you
   see the note on the workout you actually finished.
2. **Friday weigh-in chip was unreachable** (major). It only rendered on the
   rest-day card — but Friday is a lift day, so it could never appear. Fixed:
   chip now renders on whatever card shows on a real Friday.
3. **Stale checkbox state could resurrect** (major). Half-checked boxes from
   last Saturday would reappear the next Saturday, potentially enabling
   "Session done" for work not done today. Fixed: stale `bulkday.active` is
   cleared on type mismatch per spec.
4. **"Train anyway" missing from the Saturday card** (minor) — added.
5. **No `<!DOCTYPE html>` / `<meta charset>`** (minor) — added; fixes
   quirks-mode and mojibake ("Ã—" instead of "×") under local `http.server`.
6. **PURE LOGIC block wasn't standalone** (minor) — its constants now live
   inside the markers, so the node test harness extracts and runs it directly.
7. **Offline navigations with `?day=...` query strings failed** (minor) —
   service worker now matches with `ignoreSearch`.

## Verification

- **Logic (node, 35/35 pass):** week 1 on 2026-07-06 · week-12 clamp on
  2026-09-28 → 2026-10-03 · block-complete on 2026-10-04 *or* 36 banked ·
  A→B→C wraps, mobility days never advance the rotation · all four phases
  carry a focus line.
- **Serving:** `python3 -m http.server` smoke test — every asset returns 200,
  root serves the app.
- **PWA audit:** manifest complete, apple-touch-icon linked, SW install /
  activate / fetch correct, versioned cache with cleanup, zero root-absolute
  paths (GitHub Pages project-site safe), icon verified as a real 512×512 PNG.

## Deploy

- Repo: https://github.com/jxmcc15/bulking-pwa (public)
- Live: **https://jxmcc15.github.io/bulking-pwa/** (Pages from `main` root,
  polled until it returned 200 and served real content)
- Future plan changes: edit the data object in `index.html`, bump
  `CACHE_NAME` in `sw.js` (v1 → v2), commit, push. That's the whole deploy.

## Needs you this morning

1. **Install on iPhone:** open the live URL in Safari → Share → **Add to Home
   Screen**. (iOS never prompts on its own.)
2. **Offline proof:** open Bulk Day from the home screen once, then turn on
   airplane mode and open it again — it should load instantly.
3. **Bank a session:** check off today's exercises, tap Session done, watch a
   dot fill and the coach note appear. (Today is a lift day — Day B is up,
   unless you bank retroactively.)
4. Weigh-ins still go in the vault note — the app only reminds you on
   Fridays; the vault stays the record of truth.

## Deferred (your call, separate brainstorm)

The Claude PT-coach agent — can't live inside a public static site (API key
would be exposed). Two shapes discussed: a Supabase Edge Function proxy, or a
scheduled Claude session that reads the vault and messages you on Telegram.
Needs a data-sync decision either way, since banked sessions live only in the
phone's localStorage.
