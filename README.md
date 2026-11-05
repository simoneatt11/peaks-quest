# Peaks Quest

A three-minute, one-shot mini game that works as a business card for Beyond Swiss Peaks.
Choose an avatar, walk a winding path up the map, clear 8 tiny missions (one per BSP module), reach **Launch**.

Pure static site: vanilla HTML/CSS/JS, no build step, no frameworks, no external requests, no cookies, no storage, no audio.

```
bsp-game/
  index.html      entry point (all paths relative)
  style.css       brand tokens + layout
  game.js         screens, map, movement, the 8 mission mechanics
  content.js      ALL copy and config (edit this one)
  assets/qr.svg   QR code -> https://beyondswisspeaks.ch (generated locally with segno, verified by decoding)
  _qa/            screenshots + test scripts (safe to delete before deploying)
```

## Run locally

```bash
cd bsp-game
python3 -m http.server 8000
# open http://localhost:8000
```

Or just double-click `index.html`: it works from `file://` too (content.js uses plain globals, not ES modules, for exactly this reason).

## Deploy (Netlify)

1. Copy the whole `bsp-game/` folder into your Netlify deploy folder and rename it `play/`, so the game lives at `https://beyondswisspeaks.ch/play/`.
2. You can leave out `_qa/` (it's only test output).
3. **Netlify replaces the whole deployment on every drag-and-drop deploy.** Drag the *entire* site folder (all existing site files + `play/`), never single files, or the rest of the site disappears.

## Edit copy

Everything a player reads is in `content.js` as plain data:

- `CONTENT.start`, `avatarScreen`, `map`, `finish`: screen copy.
- `CONTENT.avatars`: names, tags and blurbs of the three avatars.
- `CONTENT.lines.founder` / `CONTENT.lines.robot`: 8 intro lines + 8 reaction lines each (index 0 = mission 1), plus the skip line.
- `CONTENT.missions[0..7]`: label, title, setup, options/answers, witty wrong-answer replies, success line, and `irl` (the "In real life, BSP does:" line, keep it at 12 words or fewer).
- `CONTENT.FLAVOUR`: the few words that change between Spin-off and SME (`{place}`, `{product}`, `{company}`). Any string can also be `{ spinoff: "...", sme: "..." }`.

Mission 3's draft paragraph sits between `BUZZWORD-MISSION-START` / `END` markers. It's the only place the banned buzzwords may appear. Run `python3 _qa/check_copy.py` after editing to confirm none of them have crept in anywhere else.

## Config constants (top of `content.js`)

| Key | Value |
|---|---|
| `SITE_URL` | `https://beyondswisspeaks.ch` |
| `LINKEDIN_URL` | `https://www.linkedin.com/company/beyond-swiss-peaks/` |
| `CONTACT_EMAIL` | `simoneattanasio11@gmail.com` (TODO: switch to `simone@beyondswisspeaks.ch` once Workspace is set up) |
| `MAILTO_SUBJECT` | `Hello from Peaks Quest` |

If you change `SITE_URL`, regenerate the QR:
`pip install segno && python3 -c "import segno; segno.make('https://NEW-URL', error='m').save('assets/qr.svg', scale=8, border=2, dark='#14140f', xmldecl=False)"`, then add `viewBox="0 0 W H"` (same as width/height) to the `<svg>` tag so it scales.

## Testing

```bash
pip install playwright && python3 -m playwright install chromium
python3 _qa/playthrough.py   # 8 full playthroughs, all network blocked except localhost/file
python3 _qa/check_copy.py    # banned-word check
```

`playthrough.py` plays the whole game at 390×844 and 1280×800 for all three avatars (plus one reduced-motion run and one `file://` run). It includes wrong answers, retries, an Esc-close-and-reopen, a skipped mission, the locked-station toast and keyboard movement. It fails on any console error or warning, any external request, or any horizontal scroll. Screenshots land in `_qa/`.

## Decisions I made where the brief was open

- **Map fits one screen** (no camera scroll): a 360×730 world scaled to fit, stations zig-zag up an S-curve trail from the bottom to a "Launch" gate at the summit (a growth climb, on brand with the peaks). Labels sit on the inner side of each station so they never collide with the trail.
- **Movement:** arrow keys / WASD; on touch, **tap or drag anywhere** and the avatar walks toward your finger (simpler than a joystick and works one-handed). Tapping the glowing station, or the always-visible **"Walk to 0X"** button, auto-walks there and opens the mission. Locked stations reply with a short toast.
- **Speech:** the intro line appears in the mission card, the reaction replaces it on success and is repeated briefly in a bubble above the avatar back on the map.
- **Colour mapping:** green = Strategy; orange = Sales, Operations; pink = Marketing, Partnerships; purple = Finance, Public funding, Private funding. Colour is only ever used for rings, dots and fills, never for body text (contrast).
- **Avatars:** male founder (short hair, green), female founder (bob haircut, A-line pink), the Dumb AI (square head, mismatched eyes, wobbling antenna, permanent "…" thought bubble, orange). All inline SVG.
- **Skip mission** marks the station done with a dashed check; the finish screen still lists all 8 modules.
- **Company health** labels: Idea → Prototype → First customers → Growing → Funded across the 8 missions.
- **Public funding order:** Excellence → Impact → Implementation → Budget (Horizon Europe reading order, with Budget as its own card for the game).
- **Pitch rule:** exactly 3 slides, must include Problem and The Ask; the third is any of Traction / Team / Market. The 47-slide architecture slide is roasted and can't be picked.
- **Fonts:** Inter isn't bundled (no external requests). The CSS asks for Inter and falls back to the system sans, so it uses Inter where installed, otherwise San Francisco / Segoe UI. Headlines use Georgia.
- The header wordmark is not a link, so nobody loses progress mid-game with a stray tap.
- `prefers-reduced-motion`: no bobbing, leg swing, pulses or slide-ups; the avatar still glides (movement is the game).
