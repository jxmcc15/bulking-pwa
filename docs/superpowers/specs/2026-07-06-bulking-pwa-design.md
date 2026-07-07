# Bulking PWA — "Today's Workout" Design

**Date:** 2026-07-06
**Status:** Approved by James (public GitHub Pages hosting confirmed)
**Source plan:** `/Users/jxm/jxm-vault/Topics/90-Day Bulking Plan.md` (canonical; this app displays a snapshot of it)

## Purpose

A phone-installable display app for James's 90-day bulking program. Open it from the iPhone home screen mid-workout and see today's session — nothing else. It replaces squinting at a markdown table, not the logging system (weigh-ins stay in the vault note, prompted by the recurring Todoist task).

## Goals

- Show the correct content for today's date with zero taps.
- Work offline and load instantly (living-room use, no network dependency).
- Small enough that James can read every line and understand what makes a PWA a PWA.

## Non-goals (explicitly out of scope)

- No workout logging, set tracking, or weight entry — the app stores nothing.
- No Apple Health / HealthKit integration (impossible from a browser; deliberately dropped).
- No Nike integration (no public API exists).
- No frameworks, build tools, or package.json. Plain HTML/CSS/JS only.
- No user accounts, no analytics, no notifications.

## Architecture

Static site, six files, no build step. The repo is the deployable artifact.

| File | Contents |
| --- | --- |
| `index.html` | Entire app: markup, embedded CSS, embedded JS (plan data + date logic + rendering) |
| `manifest.json` | PWA manifest: name "Bulk Day", short_name, standalone display, dark theme color, icon reference |
| `sw.js` | Service worker: cache-first strategy, versioned cache name (`bulk-day-v1`), caches the app shell (index.html, manifest.json, icon) on install |
| `icon-512.png` | Single 512×512 app icon (also referenced as apple-touch-icon) |
| `README.md` | What the app is + iPhone install steps (Share → Add to Home Screen) |
| `CLAUDE.md` | Project context per global CLAUDE.md policy |

**Hosting:** public GitHub repo `bulking-pwa`, GitHub Pages from `main` branch root. Deploy = `git push`.

## Screen states (date-driven)

The app computes two things from the device's local date: **program week** (from start date 2026-07-06) and **day type** (from day of week). One screen, four states:

1. **Lifting day (Mon/Wed/Fri):** phase banner + today's workout card. Exercise table with superset pairing (1a/1b, 2a/2b), sets × reps, and the finisher. Workout mapping: Mon = Day A (Squat+Push), Wed = Day B (Hinge+Pull), Fri = Day C (Unilateral+Arms).
2. **Mobility day (Sat):** the mobility flow list (six movements, 60–90 s each) + conditioning instruction (20–30 min conversational pace).
3. **Rest day (Tue/Thu/Sun):** nutrition targets front and center (2,900 cal / 150–160 g protein, shake recipe, meal rhythm) + preview of tomorrow's session.
4. **Block complete (after day 90, i.e., on/after 2026-10-04):** "Phase 1 complete" state showing the week-12 test checklist (max push-ups, weigh-in, photos) and a pointer back to Claude to plan the next block. No silent looping.

Always present: a **phase banner** ("Week N of 12 — <phase name>: <one-line focus>") using the approved phase table (Groove wk 1–3, Volume wk 4–7, Hard variations wk 8–11, Test wk 12), and a **collapsible reference section** at the bottom: nutrition targets, shake recipe, grocery staples, double-progression rule, weigh-in adjustment rules.

Dark theme by default. Type sized for arm's length reading.

## Data flow

None at runtime. Plan data is a single JS object literal in `index.html`. Date logic runs on load (and on `visibilitychange`, so an app left open overnight re-renders for the new day). No fetch calls, no storage APIs.

**Update path:** the vault note is canonical. When the plan changes (e.g., week-7 adjustments), edit the data object in `index.html`, bump the cache version in `sw.js` (`bulk-day-v2`), commit, push. The service worker's versioned cache means clients pick up the new version on their next online load.

## Edge cases & error handling

- **Timezone/DST:** all date math uses the device's local date via `new Date()` — no UTC conversion anywhere, so a 7 pm workout never shows tomorrow's session.
- **Testing override:** `?day=tue` and `?week=9` query parameters override the computed values for previewing any state. Ignored when absent; harmless if a stranger finds them.
- **Pre-start dates / overrun:** computed week clamps to the 1–12 range. Days 85–90 (2026-09-28 → 10-03) display as week 12; the block-complete state takes over on 2026-10-04.
- **iOS install quirk:** GitHub Pages serves over HTTPS (required for service workers). Install instructions (Share → Add to Home Screen) go in the README since iOS Safari never prompts.

## Testing

1. Local: `python3 -m http.server` in the repo, walk all four states via `?day=`/`?week=` overrides.
2. Service worker: load once, kill the server, reload — page must still render (proves offline cache).
3. On-device: install on James's iPhone via Add to Home Screen, confirm standalone launch, icon, and offline open in airplane mode.
4. Date correctness: spot-check that "today" (real date, no overrides) renders the right day and week number.

## Post-90-day future (noted, not built)

If Phase 2 continues the app, the data object gains a second block and the start-date constant moves — that's the entire migration. Any logging/Health ambitions become a separate brainstorm.
