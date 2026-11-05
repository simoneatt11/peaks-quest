# Peaks Quest: project description

Reference file for whoever picks this up next (Simone, or Claude in a later session).
How to run, deploy and edit is in `README.md`; this file covers the **what, why and current state**.

## What it is

A three-minute, one-shot browser mini game that works as a **business card for Beyond Swiss Peaks (BSP)**, Simone Attanasio's company: a science-led commercial partner for spin-offs and SMEs (strategy, growth and funding, done hands-on).

Simone hands a phone over, or people scan a QR, during conversations at events. In about 3 minutes it shows what BSP does: each of the 8 missions is one BSP service module.

Built on 5 November 2026 for **UnitedXR Europe 2026** (Brussels, 7–9 December 2026), where Simone attends with a media pass.

## Player journey

Start → choose avatar (Founder he/him, Founder she/her, or "The Dumb AI") + Spin-off/SME → walk a winding map with 8 stations → one tiny mission per station → "Your company is launched" + call to action (Book a call, website, LinkedIn, QR).

| # | Station | BSP module | Mechanic |
|---|---|---|---|
| 01 | Set the direction | Strategy | pick the sharp positioning out of 3 |
| 02 | Talk to customers | Customer relations & sales | tap leads through New → Talked → Proposal → Won (Cousin Marco refuses) |
| 03 | Say it clearly | Marketing & branding | strike 4 buzzwords from a homepage draft |
| 04 | Find the right partner | BD & partnerships | pick the partner that fills the missing piece |
| 05 | Automate the boring | Operations | Automate vs Keep human, 5 tasks |
| 06 | Spot the risk | Finance, BI & risk | tap the falling-cash months on an SVG bar chart |
| 07 | Win the grant | Public funding | tap proposal sections in order (Excellence, Impact, Implementation, Budget) |
| 08 | Meet the investor | Private funding | pick 3 slides; must include Problem + The Ask |

Nothing can be failed: wrong answers get a one-liner and an instant retry. Every mission has "Skip mission".

## Hard constraints (from the original brief)

- Pure static: vanilla HTML/CSS/JS, no build, no frameworks, **no external requests** (bad conference wifi), no analytics/cookies/storage, no audio.
- Must work at `/play/` on the Netlify site **and** from `file://` (hence plain globals in `content.js`, not ES modules).
- Mobile-first portrait (390×844), also desktop (1280×800); touch targets ≥ 44 px; `prefers-reduced-motion` respected.
- BSP brand: cream `#f5f2ea` / ink `#14140f` palette, Georgia bold headlines (-0.045em), Inter/system sans body, outline-only geometric texture, two-peak logo icon. Station accents: green / orange / pink / purple.
- BSP voice: direct, scientific, operator, warm, concise. Banned words in UI copy (checked by `_qa/check_copy.py`): see that script. They may appear **only** in mission 3, struck through.

## Files

| File | Role |
|---|---|
| `index.html` | markup for all 5 screens + mission overlay |
| `style.css` | brand tokens, layout, animations |
| `game.js` | screen flow, SVG map, movement (keys / tap-drag / auto-walk), procedural avatars, the 8 mission builders |
| `content.js` | `CONFIG` (URLs, email) + `CONTENT` (every line of copy, avatar lines, mission data) |
| `assets/qr.svg` | QR → https://beyondswisspeaks.ch (generated offline with `segno`, decode-verified) |
| `_qa/playthrough.py` | Playwright: 8 full playthroughs (2 viewports × 3 avatars + reduced-motion + file://), network blocked, fails on console errors / external requests / horizontal scroll; writes screenshots |
| `_qa/check_copy.py` | banned-word check |
| `_qa/*.png` | latest QA screenshots |

## Status (5 Nov 2026)

- Done: full game, all tests passing, QR verified, README.
- Hosting decision: serve from the BSP website at **beyondswisspeaks.ch/play/** (own domain, already on Netlify). This GitHub repo is the source of truth for the code.

## Open to-dos

- [ ] Deploy to Netlify as `play/` (drag the **whole** site folder: Netlify replaces the entire deployment). Optional: connect Netlify to a GitHub repo for git-based deploys.
- [ ] Play it end to end on a real phone (iPhone + one Android) over mobile data.
- [ ] Make a second QR pointing to `beyondswisspeaks.ch/play/` for people to scan at the event (the in-game QR points to the main site, on purpose).
- [ ] Optional: add a small service worker so a refresh works with no signal.
- [ ] Switch `CONTACT_EMAIL` in `content.js` to `simone@beyondswisspeaks.ch` once Google Workspace is set up.
- [ ] Optional: bundle Inter locally (currently falls back to the system sans when Inter isn't installed).
