# Bulking PWA — "Bulk Day" Design (v1.1)

**Date:** 2026-07-06 (v1.1 same day — adherence layer added after redesign review)
**Status:** Approved by James. Hosting: public GitHub Pages. v1.1 changes discussed and approved in-session.
**Source plan:** `/Users/jxm/jxm-vault/Topics/90-Day Bulking Plan.md` (canonical; this app displays a snapshot of it)

## Purpose

A phone-installable app for James's 90-day bulking program: open it from the iPhone home screen and see the next session with zero taps — plus just enough memory (one bit per session) to make showing up visible. It replaces squinting at a markdown table. Weigh-ins and the record of truth stay in the vault note, prompted by the recurring Todoist task.

## Design philosophy — the adherence layer

The app must be something James doesn't want to let down, without ever guilting him. Rules, derived from his own Todoist rebuild (honest dates, no overdue spirals):

- **Count up, never down.** Progress renders as banked sessions and filled dots. There is NO red state, no zero, no "missed," no deficit anywhere in the UI. Empty dots read as *not yet*, never *failed*.
- **Sequence over calendar.** The workout card shows the next uncompleted session in the A→B→C rotation. Missing a day pauses the program; it never skips a workout or shows "behind." You can be slow; you cannot be behind.
- **A witness, not a judge.** Per-exercise checkboxes during the session; a "Session done" button banks it; a one-line phase-aware coach note is the reward. That's the whole loop.

## Goals

- Correct content for today with zero taps; next session always obvious.
- Make consistency visible (dot grid, banked count) and misses invisible.
- Work offline, load instantly.
- Small enough that James can read every line and understand what makes a PWA a PWA.

## Non-goals (explicitly out of scope)

- No set/rep/weight logging and no weight entry — the only stored data is session completion marks in localStorage.
- No Apple Health / HealthKit (impossible from a browser; deliberately dropped). No Nike (no public API exists).
- No frameworks, build tools, or package.json. Plain HTML/CSS/JS only.
- No accounts, analytics, or push notifications.
- Deferred to a possible v2 (do NOT build): rest timer, data export, week-12 test capture.

## Architecture

Static site, six files, no build step. The repo is the deployable artifact.

| File | Contents |
| --- | --- |
| `index.html` | Entire app: markup, embedded CSS, embedded JS (plan data + date/sequence logic + rendering) |
| `manifest.json` | PWA manifest: name "Bulk Day", short_name "Bulk Day", standalone display, dark theme color, icon reference |
| `sw.js` | Service worker: cache-first, versioned cache name (`bulk-day-v1`), caches the app shell (index.html, manifest.json, icon) on install |
| `icon-512.png` | Single 512×512 dark app icon (also linked as apple-touch-icon) |
| `README.md` | What the app is + iPhone install steps (Safari → Share → Add to Home Screen) |
| `CLAUDE.md` | Project context per global CLAUDE.md policy |

**Hosting:** public GitHub repo `bulking-pwa`, GitHub Pages from `main` branch root. Deploy = `git push`. Project-site constraint: the app is served from `/bulking-pwa/`, so ALL asset references and the service-worker registration/scope must use relative paths (`./`).

## Screen layout & states

Always visible: **phase banner** (calendar-driven: "Week N of 12 — <phase>: <one-line focus>"; weeks clamp to 1–12; phases per plan: Groove 1–3, Volume 4–7, Hard variations 8–11, Test 12) and the **dot grid** (36 dots + "Sessions banked: N of 36"). Collapsible reference section at the bottom: nutrition targets (2,900 cal / 150–160 g protein), shake recipe, grocery staples, double-progression rule, weigh-in adjustment rules. Dark theme, type sized for arm's-length reading.

Main card, chosen by day type + sequence:

1. **Lift day (Mon/Wed/Fri):** the next uncompleted session in the A→B→C rotation — exercise table with superset pairing (1a/1b, 2a/2b), sets × reps, finisher, and a checkbox per exercise. All boxes checked surfaces **Session done**; tapping banks the session (fills a dot, increments count), clears the checkboxes, and shows a one-line coach note (small rotating set, phase-aware). A "done early/extra day" path is allowed: the card also renders on non-lift days behind a "Train anyway" link — same sequence logic.
2. **Mobility day (Sat):** mobility flow (six movements, 60–90 s each) + conditioning (20–30 min conversational pace). Markable done the same way; mobility days bank into their own 12-dot row (optional visual, single row under the main grid).
3. **Rest day (Tue/Thu/Sun):** nutrition targets front and center + preview of the next session. Friday additionally shows a **weigh-in chip** ("Weigh-in day — log it in the vault note"). No completion mechanics on rest days.
4. **Block complete:** triggers at 36 banked sessions OR on/after 2026-10-04, whichever comes first. Shows the week-12 test checklist (max push-ups, weigh-in, photos) and a pointer back to Claude to plan Phase 2. No silent looping.

## Data flow & storage

No network calls. Plan data is a JS object literal in `index.html`. Date/sequence logic runs on load and on `visibilitychange` (an app left open overnight re-renders for the new day).

localStorage keys:
- `bulkday.sessions` — array of `{date: "YYYY-MM-DD", type: "A"|"B"|"C"|"mobility"}` in completion order. Sequence position = count of A/B/C entries mod 3. Dot grid = array length.
- `bulkday.active` — checkbox state for the in-progress session `{type, checked: [indices]}`; cleared on bank or when `type` no longer matches the next session.

**Honest limit (state in README):** localStorage is per-device and wiped if Safari website data is cleared. The chain is motivational; the vault note remains the record of truth.

**Update path:** vault note is canonical. Plan changes → edit the data object in `index.html`, bump the cache version in `sw.js`, push. Versioned cache means clients pick up the new version on next online load; the SW must clean old caches on `activate`.

## Edge cases & error handling

- **Timezone/DST:** all date math uses device-local `new Date()`; no UTC conversion anywhere.
- **Testing overrides:** `?day=tue`, `?week=9`, `?banked=14` query params override computed values for previewing any state; ignored when absent; overrides never write to localStorage.
- **Overrun:** days 85–90 (2026-09-28 → 10-03) display as week 12; block-complete takes over 2026-10-04 or at 36 sessions.
- **Corrupt/absent storage:** any JSON parse failure → treat as empty (fresh chain), never crash. Double-tap protection: banking is idempotent per day+type.
- **No negative states:** by spec, no UI path may render a missed/late/behind message. Code review must enforce this.
- **iOS:** HTTPS via GitHub Pages (required for SW). iOS Safari never prompts to install — README carries the Add to Home Screen steps.

## Testing

1. Local: `python3 -m http.server`, walk all four states + banking flow via override params.
2. Logic: exercise the date/sequence functions directly with node — boundaries 2026-07-06 (week 1), 2026-09-28 (week-12 clamp), 2026-10-03 (last day), 2026-10-04 (block complete), sequence wrap A→B→C→A, banked=36 trigger.
3. Service worker: load once, kill server, reload — page must render (offline proof). Verify old cache cleanup on version bump.
4. On-device (James, morning after build): install on iPhone, standalone launch, airplane-mode open, bank a fake session and confirm the dot fills.

## Post-90-day future (noted, not built)

Phase 2 = second block in the data object + new start constant + cache bump. Logging/Health ambitions are a separate brainstorm.
