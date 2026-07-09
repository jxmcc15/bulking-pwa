# Bulk Day v2 — "The Locker Room" · Morning Report

**Built overnight 2026-07-09. Shipped and live.** ☕

**▶ Live app: https://jxmcc15.github.io/bulking-pwa/**

---

## TL;DR

v2 is built, reviewed across three lenses, fixed, verified, and pushed to `main`. GitHub Pages is serving it now. Everything the v2 spec asked for is in. The pure game logic passes a 63-assertion test harness, and I drove the real app in a browser to confirm the flows (tabs, banking, flame, badges, share card, block-complete). No blockers. The only thing left is your real-device pass on an iPhone — see **What still needs you**.

---

## What got built

A second surface and a lot of texture, layered onto the calm v1 rack screen.

- **Two tabs** — *Today* (the v1 next-session screen, now shorter/calmer) and *Locker Room* (everything browsable). Switching is a pure URL-hash change: instant, no network, no service-worker hit.
- **The flame** 🔥 — momentum meter in the banner on both tabs. Counts every session (lift **or** mobility) in the trailing 8 days, 0–4: Cold Iron → Flicker → Burning → Blazing → Inferno. Grows with work, cools quietly with time, never a penalty. Tap it for the plain rule.
- **XP / levels / badges** — +25 "Mass" per lift, +15 per mobility. Six levels (Twig → Stringbean → Solid → Dense → Heavy → Mass Monster). Eleven badges, all derived from your banked sessions, on a badge wall (earned lit, unearned dimmed to silhouettes labeled "not yet").
- **The coach** — a salty line of the day in the banner (deterministic, stable all day, rotates daily) and a reward line every time you bank. Punches at effort and excuses, never at you or the goal; breaks character on rare occasions. Signs **"— Coach Burlap"** once you've banked a dozen lifts.
- **Explain-yourself UI** — tap the phase banner to jump to the Locker Room's Method; tap the workout title for an inline A/B/C + supersets + sequence explainer; tap the flame for the heat overlay.
- **Locker Room** (8 sections) — level card · flame card · badge wall · share card · **The Method** · **The Mission** · **The Fuel** · small print. The three reference sections are adapted straight from the vault plan (numbers checked against it, nothing exceeds it).
- **Share card** — "Make my card" draws your dots + flame + level onto a PNG and opens the share sheet (falls back to text share, then clipboard). No backend, no account.
- **Bank moment** — dot-pop, "+25 MASS" tick, flame-rise if heat climbed, badge toast, a synthesized Web Audio "clank" (no audio files), and the coach's event line.
- **Easter eggs** — coach name reveal at the Dozen; poke the flame 5× in 3s; a halfway-day glow + sincere line on **2026-08-19** (day 45); confetti + a signed Coach Burlap letter on block-complete.
- **Preview overrides** — `?heat=0..4` and `?xp=N` added (display-only), alongside the existing `?day= ?week= ?banked=`.

**Files changed:** `index.html` (the whole build, → ~2,120 lines) and `README.md` (new-features section, Locker Room description, share-card note, `?heat=`/`?xp=` docs). **`sw.js` untouched**, `CACHE_NAME` stays `bulk-day-v2`, manifest/icon untouched — so this ships with a plain push (see the update note below).

---

## How it was built (one deviation worth knowing)

The plan was one Opus/max build agent. It died **twice** mid-write on a connection drop (the ~2,000-line single-file generation is fragile over one long response), leaving a corrupt 428-line partial each time. So I restored the known-good v1 and **built v2 directly myself** (same Opus 4.8), in bounded sections to be resilient, then ran the planned **three-lens review as a parallel agent workflow** against the result and applied the confirmed fixes. Net effect: same Opus-quality build + the full adversarial review the spec wanted — just without the flaky single-shot build agent in the loop. Nothing about the shipped app changed because of this; it's a "how", not a "what".

---

## Review findings & outcomes

Three reviewers (spec-compliance · logic/render-path · PWA/iOS) ran in parallel. All three judged the build a faithful implementation of the v2 spec. **10 findings, all confirmed, all applied** (0 critical, 2 major — which were the *same* bug, also caught independently in my own browser testing):

| # | Sev | Finding | Fix applied |
|---|-----|---------|-------------|
| 1 | **major** | Coach fired a *comeback* line ("back… again soon") on a brand-new user's **first-ever** bank — heat is 0 for a fresh start too, so the "return from absence" line misfired. | Gated comeback to `heat 0 **and** prior history`. A first bank now gets the milestone line. Verified both paths in-browser. |
| 2 | minor | Locked badges rendered a generic 🔒 instead of the badge's own dimmed art. | Show the real icon; existing CSS dims it to a silhouette. |
| 3 | minor | Flame overlay's "N sessions" reused the *capped/overridable* heat, so it could lie above 4 or under `?heat=`. | Overlay now computes the true uncapped count from real sessions. |
| 4 | minor | When one bank earned 2+ badges, only the first toasted but all were marked seen — the rest were silently swallowed. | Combined toast names all of them ("Badges earned: X + Y"). |
| 5 | minor | `justBanked` cleared *after* the effects ran; a throw could leak it into the next render and re-fire animations. | `try/finally` guarantees it clears exactly once. |
| 6 | minor | Dot-pop targeted the possibly-overridden `?banked` index (dev-only). | Skip the pop when a preview override is active. |
| 7 | minor | Block-complete confetti re-fired on every re-render. | Fires once per app session via a module flag. |
| 8 | minor | Share validated `canShare({files})` but called `share({files, text})` — some Safari builds reject the combined payload. | Validate the exact payload; genuine failures fall through the chain; a user-cancel is not treated as failure. |
| 9 | minor | `canvas.toBlob`'s async callback ran past the guarding `try` — an unsupported `File()`/`canShare` on old iOS could throw unhandled. | Wrapped the callback body in its own `try/catch → fallback`. |

---

## Test results

- **Pure-logic node harness — 63/63 pass.** heat window boundaries (session dated `today−7` counts, `today−8` doesn't, caps at 4, mobility counts), `xpFor` on mixed sessions, `levelFor` at **every** threshold edge (99/100, 249/250, 449/450, 699/700, 999/1000), all 11 badge triggers (incl. full-rotation's rolling 7-day window and the overtime weekday rule), `coachLine` determinism (stable per date, rotates across dates), and the day-45 derivation = **2026-08-19**.
- **Full-file JS syntax check** — clean (`node --check`).
- **Browser drive-through** (served locally, real DOM): no console errors on load; tabs switch with no network; first-ever bank shows the **milestone** line (fix #1); a seeded cold-flame-with-history bank shows the **comeback** line and the flame rises; the badge wall shows dimmed silhouettes (no padlocks); `?heat=4&xp=720` drives the flame to Inferno and the level card to Heavy while badges correctly stay at real (0); block-complete shows the Burlap letter + confetti (once); share fallback chain intact.
- **No-negative-state sweep** — clean in source, in the served bytes, **and in the live-rendered DOM**. No `missed/late/behind/overdue/broken`, no red hues anywhere (palette is green/blue/amber/gold only; a cooled flame just shrinks and greys).
- **Live deploy verified** — `https://jxmcc15.github.io/bulking-pwa/` served v2 ~32s after the push, and the deployed bytes contain the fixed version.

---

## Deploy — done

- Committed as `959bf19` and pushed to `main` (`16cb4f3..959bf19`). GitHub Pages rebuilt and is live.
- **Update note for your installed copy (important):** the service worker is stale-while-revalidate, so if you already added Bulk Day to your home screen, **your first launch will still show v1** — it serves the cached copy instantly and downloads v2 in the background. **Launch it a second time and v2 appears.** (Open it, close it, open it again.) A brand-new install shows v2 immediately.

---

## What still needs you (real-device pass)

The one thing a headless browser can't fully prove is iOS-on-glass. When you have a minute with your iPhone:

1. **Open the app twice** (per the update note) so v2 loads, then poke around: tabs, the flame, bank a session, check the coach line and the "+25 MASS" tick, make a share card.
2. **Share card → iMessage** — tap "Make my card" in the Locker Room and confirm the PNG actually reaches the share sheet and sends. This is the one flow with real iOS-Safari variance.
3. **VoiceOver spot-check** — turn on VoiceOver and confirm the two tabs announce sensibly and the badges read as named labels (not anonymous cells).
4. **Text me anything that feels off** (iMessage) and I'll fix it in the morning session.

Nothing here is expected to fail — it's a confidence pass, not a debugging session.

*(If you clear the app's website data at any point, your dot chain resets — that's the localStorage honesty limit; the vault note stays the record of truth.)*
