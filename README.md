# Bulk Day

**▶ Open the app: https://jxmcc15.github.io/bulking-pwa/**
(This page you're reading is just the source code — the link above is the app itself.)

A tiny, installable phone app for James's 90-day bulking program. Open it from the iPhone home screen and the **next session shows with zero taps** — the right workout for today, the phase you're in, and a chain of dots for every session you've banked. It replaces squinting at a markdown table at the rack.

It counts up, never down. There's no "missed", no red, no streak to break — an empty dot just means *not yet*.

## What it is (and isn't)

It's a **PWA** (Progressive Web App): a plain web page plus two extra files (`manifest.json` and `sw.js`) that let iOS install it like a native app and run it fully offline. No frameworks, no build step, no accounts, no network calls — the whole thing is four static files.

It shows the plan and banks one bit per session ("done"). It does **not** log sets, reps, or weight, and it does not record your bodyweight. Those live in the vault note.

The four screens, chosen automatically by the day and where you are in the rotation:

- **Lift day** (Mon/Wed/Fri) — the next workout in the A → B → C rotation, as a superset table with a checkbox per exercise. Check them all, tap **Session done**, and it banks the session (fills a dot) and shows a one-line coach note.
- **Mobility day** (Sat) — the six-movement flow plus easy conditioning; bankable the same way, into its own row of dots.
- **Rest day** (Tue/Thu/Sun) — nutrition targets front and center plus a preview of the next lift. Fridays add a weigh-in reminder chip.
- **Block complete** — after 36 banked sessions (or once the calendar passes the final program day), a week-12 test checklist and a nudge to plan Phase 2 with Claude.

There's also a **"Train anyway"** link on non-lift days if you want to do the next session early.

## Install it on your iPhone

1. Open **https://jxmcc15.github.io/bulking-pwa/** in **Safari** (it must be Safari — Chrome on iOS can't install PWAs).
2. Tap the **Share** button (the square with an up-arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top-right.

You'll get a "Bulk Day" icon on your home screen. Launching it opens full-screen with no address bar, and it works in airplane mode.

## The honest limitation

Your banked-session chain is stored in **localStorage** — a small storage box that belongs to Safari on *this one device*. That means:

- It is **per-device**. Bank a session on your phone and it won't appear on your laptop, and vice versa.
- It is **wiped if you clear Safari's website data** (Settings → Safari → Clear History and Website Data, or "Advanced → Website Data → Bulk Day").
- There is **no cloud backup** and no account — by design, to keep the app simple and private.

So the dot chain is *motivation*, not a ledger. **The vault note (`90-Day Bulking Plan.md`) stays the record of truth** — that's where the weigh-in log lives, and where you should note anything you actually want to keep. The Friday chip in the app is just a reminder to go log it there.

## Run it locally (for development)

It's static files, so any static server works. From the project folder:

```sh
python3 -m http.server
```

Then open `http://localhost:8000/`.

### Preview any state without waiting for the calendar

Add query parameters to the URL to force a particular view. These are **view-only** — they never write to your saved data:

- `?day=tue` — force the day type. Accepts a weekday (`mon`…`sun`) or a type (`lift`, `mobility`, `rest`).
- `?week=9` — force the week number (1–12), which drives the phase banner and coach notes.
- `?banked=14` — force the banked-session count shown in the grid (and trip the block-complete screen at 36).

Example: `http://localhost:8000/?day=fri&week=9&banked=20`

### Updating the plan later

The workout/nutrition content is a JavaScript object near the top of `index.html`. If the plan changes in the vault note, edit that object to match, commit, and push — that's the whole deploy. Installed copies pick up an `index.html` change on their **second** online launch (the first launch shows the cached copy while quietly downloading the new one in the background). Only if you change `manifest.json` or the icon do you need to **bump the cache name in `sw.js`** (`bulk-day-v2` → `bulk-day-v3`); the service worker deletes old caches automatically when the new version activates.
