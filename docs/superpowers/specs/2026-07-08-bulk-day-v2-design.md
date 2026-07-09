# Bulk Day v2 — "The Locker Room" Design

**Date:** 2026-07-08
**Status:** Approved by James (design review in-session 2026-07-08).
**Supersedes:** `2026-07-06-bulking-pwa-design.md` (v1.1) — v1.1 remains accurate for everything this document does not change.
**Source plan:** `/Users/jxm/jxm-vault/Topics/90-Day Bulking Plan.md` (canonical for all program content).

## Purpose

v1 proved the loop: open → see today → bank it. v2 fixes what living with v1 exposed:

1. **The app raises questions it doesn't answer.** "Groove"? "Day A"? A first-time user (including its owner) can't learn the program from the app.
2. **The simplicity reads as lifeless.** No personality, no reward texture, nothing to poke at. James asked to "gamify the hell out of it" and give it a coach with a mouth.

v2 keeps the calm rack-time core and adds: a second surface (the **Locker Room**), a momentum flame, XP/levels/badges, a salty coach with a soft center, tap-to-explain UI, a share card, sounds, and easter eggs.

## Philosophy amendment (supersedes v1.1 "adherence layer" wording)

The founding rule stands: **no negative state is ever rendered.** The words *missed, late, behind, overdue, broken* and the color red never appear. Empty dots, silhouetted badges, and a cooled flame are *reduced positives* ("not yet"), never failures.

**One precise amendment:** the coach may tease about absence **only in the moment of return** — a "comeback line" fires when James banks a session after the flame has gone cold ("Look who remembered where the bags live. Relit."). While he is absent, the app stays silent and neutral. Absence is never rendered *during* absence.

Streaks (breakable chains) were considered and rejected deliberately: first-break abandonment ("what-the-hell effect") is the exact failure mode v1's philosophy was built to prevent. Momentum (the flame) is the chosen mechanic: it grows with work, cools with time, and can always be relit without ceremony.

## Architecture

- Same four deployable files (`index.html`, `manifest.json`, `sw.js`, `icon-512.png`), no build step, no frameworks. `index.html` grows substantially (~2,000+ lines); it stays readable top-to-bottom with a table-of-contents comment. All game logic lives inside the existing `PURE LOGIC` markers as pure functions of `(sessions, date)` so the node harness tests it directly.
- **Two surfaces, tab bar at the top:** `Today` (the v1 rack screen, kept calm) and `Locker Room` (everything browsable). Active tab tracked by URL hash (`#locker`); hash navigation costs no network and doesn't touch the service worker. Back-swipe returns to Today.
- **No new network calls. No accounts. No push notifications** (impossible from a static site; external nudges are the separate Telegram-coach project, see Non-goals).
- Service worker: **no changes required** — v1.5's stale-while-revalidate navigations mean v2 deploys with a plain push. `CACHE_NAME` stays `bulk-day-v2` unless `manifest.json`/icon change (then bump to v3).

## Storage

Existing keys unchanged (`bulkday.sessions`, `bulkday.active`). One new key:

- `bulkday.meta` — `{ seenBadges: ["badge-id", ...] }`. Only what cannot be derived: which badge-earned toasts have already been shown. Everything else (XP, level, heat, badge earned/unearned, coach name reveal) is **derived from `bulkday.sessions` + today's date** on every render. Corrupt/absent meta → treat as empty, re-toast at worst; never crash.

Honest-limit note (README): all of it is per-device localStorage; the vault note remains the record of truth.

## The Flame (momentum)

`heatLevel(sessions, today)` → integer 0–4 = **count of sessions (lift AND mobility) banked in the trailing 8 calendar days** (dates in `[today−7, today]`, inclusive, local time), capped at 4.

| Heat | Name | Display |
|---|---|---|
| 0 | Cold Iron | 🪵 grey glyph |
| 1 | Flicker | small flame |
| 2 | Burning | flame |
| 3 | Blazing | bigger flame |
| 4 | Inferno | full flame + subtle glow |

Full adherence (Mon/Wed/Fri lifts + Sat mobility) sustains Inferno. The flame renders in the phase banner on both tabs (glyph + name, e.g. "🔥 Blazing"). Tapping it opens a two-sentence explainer of the trailing-8-days rule. Cooling is silent — no message, no color change to warm/danger hues, the flame just gets smaller.

## XP, Levels, Badges

**Mass (XP):** +25 per lift (A/B/C), +15 per mobility. Displayed as "Mass" in coach vernacular. `xpFor(sessions)`; bank moment shows "+25 MASS" tick animation.

**Levels** — `levelFor(xp)`; thresholds tuned to a 1,080-XP perfect block so Mass Monster requires finishing the lifts plus most Saturdays (36×25=900; 900+7×15=1005 ≥ 1000):

| XP | Level |
|---|---|
| 0 | Twig |
| 100 | Stringbean |
| 250 | Solid |
| 450 | Dense |
| 700 | Heavy |
| 1000 | Mass Monster |

**Badges** — `badgesFor(sessions, today)` returns earned badge ids; all derivable from the sessions array + dates. Badge wall in the Locker Room shows earned badges lit, unearned as silhouettes labeled "not yet" with a hint. New-badge toast on the bank that earns it ("Badge earned: Halfway Heavy — see the Locker Room"), shown once via `seenBadges`.

| id | Name | Trigger |
|---|---|---|
| first-blood | First Blood | first lift banked |
| first-six | The First Six | 6 lifts |
| dozen | The Dozen | 12 lifts (coach name reveal — see Easter eggs) |
| halfway-heavy | Halfway Heavy | 18 lifts |
| two-dozen | Two-Dozen Deep | 24 lifts |
| thirty | Thirty Piece | 30 lifts |
| full-36 | The Full 36 | 36 lifts |
| full-rotation | Full Rotation | an A, a B, and a C all banked within any 7-day window |
| full-furnace | Full Furnace | heat reaches Inferno for the first time |
| overtime | Overtime | any lift banked on a non-Mon/Wed/Fri date ("Train anyway") |
| bendy | Bendy | first mobility session banked |

## The Coach

**Voice:** salty trash talk, profanity at the *damn / hell / ass* tier (no slurs, nothing stronger than occasional "shit"); punches at effort and excuses, never at James's body or the goal. Secretly caring — the mask slips only at defined moments.

**Line of the day (every card, both tabs' banner area):** deterministic — `coachLine(contextKey, dateString)` picks via a small string hash `(dateString + contextKey) mod pool.length`, so the line is stable all day (no reroll on refresh) and rotates daily. Context pools (≥6 lines each):

- `lift-greeting` (per day type: "Day B. The RDLs won't romance themselves.")
- `rest-nag` (nutrition beat: "Rest day, not a fast, McCormick. 2,900. The scale doesn't negotiate.")
- `mobility-greeting`
- `friday-weighin` (rides with the weigh-in chip)

**Event lines (at bank time, replacing the v1 coach note; may use `Math.random` — event lines are moments, not renders):**

- `celebration` — per phase (Groove/Volume/Hard variations/Test), saltier rewrites of the v1 pools.
- `milestone` — fires on badge-earning banks, bigger energy.
- `comeback` — fires when banking while heat was 0 ("Look who remembered where the bags live. Relit."). Takes precedence over `celebration`.
- `sincere` — **1-in-40 roll on any celebration**: the coach breaks character completely ("I see every one of these, you know. Proud doesn't cover it. Now get out of my locker room."). Also fired deterministically at day 45 and dot 36 (see Easter eggs).

**Name:** the coach is "Coach" until the Dozen badge (12 lifts); from then on he signs lines **— Coach Burlap** (he's made of sandbags).

## Explain-yourself UI (Today tab)

- **Tap the phase banner** → jumps to the Locker Room Phase Guide, scrolled to the current phase.
- **Tap the workout title ("Day A — Squat + Push")** → inline expandable explainer under the title: what A/B/C are, why supersets (the 1a/1b pairing), and the sequence-over-calendar rule ("you can be slow; you can't be behind"). Rendered with the same `<details>` pattern as the v1 reference section.
- **Tap the flame** → heat explainer overlay (two sentences + current count, e.g. "3 sessions in the last 8 days").

## Today tab changes

- Phase banner gains the flame (right-aligned) and the coach's line of the day (below the focus line).
- The v1 reference section **moves out entirely** → Today gets shorter and calmer than v1.
- **Bank moment:** dot-pop animation (the newly filled dot scales in), "+25 MASS" XP tick, flame upgrade animation if heat rose, badge toast if earned, synthesized clank (Web Audio oscillator, ~150 ms, subtle; no audio files; no volume/mute setting in v2), and the coach event line.
- **Saturday card:** under the six movements, a link — "Or follow along: **Yoga with Adriene** (YouTube)" → `https://www.youtube.com/@yogawithadriene`. Opens in Safari (external links leave standalone PWAs; acceptable).
- Friday weigh-in chip unchanged, plus the `friday-weighin` coach line.

## Locker Room tab (top to bottom)

1. **Level card** — level name big ("DENSE"), XP progress bar to next level with numbers ("580 / 700 Mass"), one coach line about the current level (deterministic per level, not per day).
2. **Flame card** — current heat name + the trailing-8-days rule in plain words.
3. **Badge wall** — grid per the table above.
4. **Share card** — "Show off" button: renders dot grid + flame + level name + "Bulk Day · week N of 12" onto a `<canvas>`, exports PNG, `navigator.share({files})`; fallback to `navigator.share` text; fallback to clipboard copy. No backend, no accounts — this is the whole "compare with a friend" feature.
5. **The Method** — the four phases (week ranges, what each is for, where James is now), A/B/C templates and what each targets, supersets, the double-progression rule.
6. **The Mission** — 165 → 169–170 this block → 175 by ~January 2027; why ~0.4 lb/week is the ceiling; the Friday weigh-in feedback loop rules; "this plan succeeds or fails in the kitchen."
7. **The Fuel** — 2,900 cal / 150–160 g protein, both breakfast options, the shake, grocery staples, the meal rhythm.
8. **Small print** — localStorage honesty note; vault note is the record of truth.

Content for 5–7 is adapted from the vault plan note (canonical); tone matches the coach's world but explainers stay factual.

## Easter eggs

1. **Coach name reveal** at the Dozen badge (above).
2. **Tap the flame 5× within 3 s** → tiny flare animation + "Quit poking the flame and go lift something."
3. **Day 45 of 90** (2026-08-19, derived from PROGRAM_START): banner glow once that day + sincere line: "Half the road behind you. The kid who started this couldn't do what you did today."
4. **Dot 36 / block complete** — confetti (CSS, no library) + a signed letter from Coach Burlap (longer sincere text) on the block-complete screen.

## Preview overrides (dev/testing, view-only, never persisted)

v1's `?day= ?week= ?banked=` remain. Added: `?heat=0..4` and `?xp=N` override the flame and level card display only. Real XP/heat/badges always derive from real sessions; overrides never affect banking or storage.

## Non-goals

- **Telegram coach** — approved as a **separate follow-up project** (scheduled Claude session DMs nudges in the coach's voice via the existing Telegram bot). Nothing in v2 blocks on it; the app never assumes it exists.
- Todoist integration (declined in design review — no personality, duplicates banking).
- Friend accounts / shared streaks (needs a backend; killed — the share card is the replacement).
- Set/rep/weight logging, weight entry, HealthKit, rest timers, notification permission prompts, analytics.
- In-app haptics: iOS Safari exposes no vibration API; not attempted.

## Files touched

| File | Change |
|---|---|
| `index.html` | the whole v2 build (tabs, flame, XP/badges, coach, explainers, Locker Room, share card, sound, easter eggs) |
| `README.md` | new features paragraph, Locker Room description, share-card note |
| `CLAUDE.md` | point "design is FINAL" at this spec; add coach-voice + no-negative-state review rules |
| `sw.js` | none (SWR already ships index.html changes) |

## Testing

**Node harness (pure logic):** heatLevel window boundaries (session dated today−7 counts, today−8 doesn't; caps at 4), xpFor mixed sessions, levelFor at every threshold edge, badgesFor triggers (incl. full-rotation 7-day window and overtime weekday rule), coachLine determinism (same date+context → same line; different dates rotate), day-45 derivation.

**Browser (preview server):** tab switch + back-swipe hash nav, bank flow with animations/toast/sound, badge toast shows exactly once, explainer taps, share fallback chain (canvas → text → clipboard), `?heat=`/`?xp=` overrides, no-negative-state sweep (grep the rendered strings for banned words), offline reload.

**On-device (James):** install update arrives on second launch (SWR), share card → iMessage, VoiceOver spot-check on tabs and badges.

**Review gate (unchanged from v1):** no UI path may render a missed/late/behind/red state; comeback lines fire only on bank events.
