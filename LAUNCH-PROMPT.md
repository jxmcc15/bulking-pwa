# Overnight build launch prompt

Start the session with `cd ~/Projects/bulking-pwa && claude`, then paste everything below the line.

---

Overnight autonomous build — Bulk Day PWA. No questions tonight: everything below is pre-approved, I am asleep, and AskUserQuestion must not be used. When a choice arises: follow the spec, then CLAUDE.md, then the simplest thing that works.

Context — read exactly these, nothing else: `CLAUDE.md`, then `docs/superpowers/specs/2026-07-06-bulking-pwa-design.md` (v1.1, approved). Design is final; skip brainstorming/discovery entirely and do not write any planning docs.

Orchestration: use a workflow. You (Fable 5) orchestrate and handle review; build agents run on Opus 4.8 at max effort (agent opts: model "opus", effort "max").

- Stage 1 — Build: ONE Opus/max agent writes all six files per the spec's file table (index.html, manifest.json, sw.js, icon-512.png, README.md; CLAUDE.md already exists). Icon: generate programmatically via Bash/Python stdlib — a dark tile with a simple "BD" monogram or dot-grid motif is acceptable. Remember the GitHub Pages base-path rule: relative paths everywhere, SW registered with scope "./".
- Stage 2 — Review, in parallel, reviewers inherit Fable 5: (a) spec-compliance audit against the design doc, section by section; (b) logic review — local-time date math, week clamp 1–12, A→B→C sequence wrap, all four screen states, ?day/?week/?banked overrides, localStorage keys bulkday.sessions/bulkday.active, corrupt-storage fallback, idempotent banking, and the hard rule that NO code path renders a missed/late/behind state; (c) PWA/iOS audit — manifest completeness, apple-touch-icon link, SW install/activate/fetch with versioned cache + old-cache cleanup, offline reload.
- Stage 3 — Fix: builder agent (Opus/max) applies CONFIRMED findings only. One review→fix round; a second round only for app-breaking regressions.
- Stage 4 — Verify: extract the date/sequence functions and exercise them with node (boundaries: 2026-07-06, 2026-09-28, 2026-10-03, 2026-10-04; sequence wrap; banked=36 trigger). Smoke-test serving via python3 -m http.server + curl.
- Stage 5 — Deploy (pre-approved): commit with clean messages. Check gh auth status FIRST. If authenticated: gh repo create bulking-pwa --public --source . --push, enable Pages on main root via gh api, poll the live URL until it returns 200, then curl-verify real content. If NOT authenticated: stop at the local commit, put exact deploy commands in the morning report, and do not attempt any credential workaround.

Efficiency contract — hard requirement: keep your main context under ~230k tokens. Agents return terse structured results (files written, line counts, findings with file:line) — never full file bodies back to the orchestrator. Max ~8 agents total. No documents beyond MORNING-REPORT.md.

Finish: write MORNING-REPORT.md (what was built, findings and their outcomes, live URL or deploy steps, iPhone install steps — Safari → Share → Add to Home Screen, and what needs me in the morning: real-device install + airplane-mode test + banking a session), commit it, then afplay /System/Library/Sounds/Glass.aiff.
