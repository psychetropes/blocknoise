# blocknoise design system

source of truth: `preview/index.html` (localhost:8082)

---

## identity

- **blocknoise** is always lowercase in UI: catalog numbers, buttons, labels
- solana mobile dApp for the seeker device
- aesthetic: brutalist, dark, angular — experimental music label, not fintech
- every screen should feel like a record sleeve

---

## colour palette (CSS custom properties)

| var | hex | usage |
|-----|-----|-------|
| `--black` | `#0A0A0A` | black blocks/cards, mixer bg, tab bar bg |
| `--blue` | `#0012FF` | primary screen background — signature electric blue |
| `--white` | `#F2F0ED` | primary text, headings (warm off-white, never pure #FFF) |
| `--grey` | `#666666` | labels, secondary text, inactive elements |
| `--dark` | `#1A1A1A` | subtle dividers, dark borders |

### app theme tokens → CSS vars mapping

```ts
// app/src/theme/index.ts
bg    = '#0012FF'   // --blue
bg2   = '#0A0A0A'   // --black
cream = '#F2F0ED'   // --white
muted = '#666666'   // --grey
muted2= '#1A1A1A'   // --dark
```

### colour rules

- `--blue` (#0012FF) is the DEFAULT screen background on every screen
- `--black` (#0A0A0A) sections sit ON TOP of blue — never the reverse
- mixer screen is the only exception: full `#000000` background
- primary text is `--white` (#F2F0ED) — warm off-white, never pure #FFFFFF
- row borders on blue: `rgba(0,0,0,0.25)`
- row borders on black: `1px solid rgba(255,255,255,0.12)`
- NO gradients (except mixer vignette overlay)
- NO drop shadows (except mixer dot glow)
- NO rounded corners anywhere — everything is square/angular

---

## typography

### fonts

| font | weight | role |
|------|--------|------|
| **ABC Solar** | 700 (Bold) | titles, headings, display numbers, scores |
| **JetBrains Mono** | 400, 700 | body text, labels, buttons, wallet addresses, catalog numbers |
| **Space Grotesk** | 400, 700 | payment amounts, score numbers |

font files: `preview/fonts/ABCSolar-Bold-Trial.woff2`, `.woff`
google fonts: `JetBrains Mono`, `Space Grotesk`

### type classes

| class | font | size | weight | transform | spacing | colour | usage |
|-------|------|------|--------|-----------|---------|--------|-------|
| `.t-outline` | ABC Solar | varies | 400 | UPPERCASE | 2px | --white | screen titles (BLOCK NOISE) |
| `.t-outline-black` | ABC Solar | varies | 400 | UPPERCASE | 2px | --black | titles on white bg |
| `.t-solid` | ABC Solar | varies | 400 | UPPERCASE | 2px | --white | section titles (Leaderboard, etc) |
| `.t-num` | ABC Solar | varies | 400 | none | -1px | inherit | large numbers, scores |
| `.t-mono` | JetBrains Mono | 13px | 400 | none | 0.5px | inherit | body text, info |
| `.t-label` | JetBrains Mono | 10px | 700 | UPPERCASE | 3px | --grey | nav labels, meta text |

### text rules

- titles/headings: **UPPERCASE** with letter-spacing (ABC Solar)
- buttons: **lowercase** with letter-spacing 2px (JetBrains Mono bold 13px)
- labels/nav: **UPPERCASE** with letter-spacing 3px (JetBrains Mono 10px grey)
- catalog numbers: `#blocknoise#N` — always lowercase
- wallet addresses: truncated `XXXX...XXXX` (first 4 + last 4), JetBrains Mono bold
- line-height: 0.9-0.95 for ABC Solar, 1.5 for JetBrains Mono

---

## layout structure

every screen follows this pattern:

1. **blue (#0012FF) background** — fills the full phone screen
2. **screen padding**: 52px top, 28px sides and bottom
3. **black blocks** (`.black-block`) — full-bleed dark sections that break out of side padding using `margin: 0 -28px; width: calc(100% + 56px);`
4. **tab bar** — fixed at bottom, 64px height, black background

### spacers

| class | height |
|-------|--------|
| `.s8` | 8px |
| `.s16` | 16px |
| `.s24` | 24px |
| `.s32` | 32px |
| `.s48` | 48px |

---

## components

### recess button (`.recess-btn`)

the signature UI element — a 3D beveled box that animates on press.

**structure:**
```html
<div class="recess-btn" style="background: var(--black); position: relative;">
  <svg viewBox="0 0 100 100"> <!-- 4 trapezoidal walls + 4 corner lines + inner rect --> </svg>
  <div class="recess-content"> <!-- actual content inside the recessed area --> </div>
  <div class="recess-glow"></div> <!-- selected state glow ring -->
</div>
```

**SVG bevels:**
- 4 `<polygon>` walls with subtle white opacity fills (0.07, 0.05, 0.02, 0.035)
- 4 `<line>` corner perspective lines, stroke `#444`
- 1 `<rect>` inner border, stroke `#444`
- rest state: inner rect at `x:8 y:5 w:70 h:77` (percentage coords)
- pressed state: inner rect expands to `x:4 y:2.5 w:85 h:88.5`
- animation: 180ms easeInOut tween between states
- content padding follows inner rect position + 13px gap

**mutual exclusion groups** (data attributes):
- `data-tier` — tier selection (standard / spatial)
- `data-pay` — payment method (usdc / sol / skr)
- `data-block` — mixer block selection
- `data-genre` — genre selection
- other recess buttons toggle independently (play, radio controls)

**selected state:** `.recess-glow` gets `opacity: 1` — `box-shadow: inset 0 0 0 2px rgba(255,255,255,0.15)`

### buttons (`.btn`)

| class | bg | text | border | usage |
|-------|-----|------|--------|-------|
| `.btn-w` | --white (#F2F0ED) | --black | none | primary action on blue bg |
| `.btn-b` | --black (#0A0A0A) | --white | none | secondary action |
| `.btn-o` | transparent | --white | none | outline/ghost action |

all buttons:
- font: JetBrains Mono, bold, 13px
- text-transform: **lowercase**
- letter-spacing: 2px
- text-align: center
- padding: 20px
- width: 100% (full-width)
- active state: `translateY(2px)`
- NO border-radius

### play button

- 36x36px square, black bg, white icon
- no border-radius — perfectly square
- font-size: 12px (unicode triangle ▶)

### waveform (horizontal)

```css
.waveform-track { height: 28px; display: flex; gap: 1px; }
.bar { flex: 1; min-width: 2px; background: rgba(0,0,0,0.3); }
.bar.played { background: var(--white); }
```

### waveform (vertical — for stem columns)

```css
.waveform-vert { flex-direction: column; width: 100%; }
.vbar { height: 2px; background: rgba(255,255,255,0.25); }
.vbar.played { background: var(--white); }
```

generated with seeded sine/cosine functions for organic shapes.

### tab bar

```css
.tabs {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 64px; background: var(--black);
  border-top: 3px solid var(--black);
  display: flex; align-items: center; justify-content: space-around;
}
.tab { font-size: 9px; color: rgba(255,255,255,0.4); uppercase; letter-spacing: 2px; font-weight: 700; }
.tab.on { color: var(--white); }
```

tabs: HOME (■), BOARD (☰), RADIO (▶)
leaderboard tab bar uses: `border-top: 1px solid rgba(255,255,255,0.12)` instead

### row (list items)

```css
.row { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.25); font-size: 12px; }
```

### genre chips

```css
.chip { padding: 12px 16px; border: 3px solid var(--black); uppercase; letter-spacing: 2px; font-weight: 700; font-size: 11px; }
.chip.on { background: var(--black); }
```

### wallet address display

- JetBrains Mono, bold, 11px
- white text
- truncated: `XXXX...XXXX`

### disconnect label

- JetBrains Mono, 10px, bold, uppercase, letter-spacing 3px
- colour: `--black` (#0A0A0A) on blue background
- positioned top-right of screen header

---

## screen specifications

### 1. home — disconnected

- blue background, centered vertically
- "BLOCK NOISE" title: ABC Solar `.t-outline`, 68px
- "NOISE" letters justified with flex `space-between`
- "connect wallet" button: `.btn-w` (white on blue), 28px margin

### 2. home — connected

- wallet address top-left: JetBrains Mono bold 11px white
- disconnect label top-right: `.t-label` colour --black
- two tier cards as recess buttons (`.recess-btn`), `flex: 1` each:
  - **standard composition**: "1 x 30s looping track", prices: USDC 10 / SOL 0.07 / SKR 5
  - **spatial composition**: "3 x 30s stems + 3D mixer", prices: USDC 20 / SOL 0.14 / SKR 10
- tier card content: title 11px uppercase letter-spacing 2px, subtitle 9px grey
- price row: 10px, currency label 50% opacity, value bold
- "mint composition" button: `.btn-w`
- 28px gap between all elements, 28px side padding

### 3. payment

- wallet + disconnect header
- 3 payment recess buttons stacked vertically, each `aspect-ratio: 1`
- each shows: currency label (11px, uppercase, 50% opacity) + amount (28px bold)
- SKR card includes "50% off" note (8px, 40% opacity)
- "pay & generate" button: `.btn-w`

### 4. generate — spatial

- "Spatial Composition" title: `.t-solid` 36px centered
- "3 stems generated" subtitle: `.t-label` white 60% opacity
- 3 stem columns side by side (flex, gap 12px):
  - each: recess play button (aspect-ratio 1) + "BLOCK1/2/3" label (`.t-solid` 18px) + vertical waveform + timestamp
- "open block mixer" button: `.btn-w`

### 5. the block // mixer

- full `#000000` background — only screen that deviates from blue
- **tron-room**: 3D wireframe room with perspective projection
  - border: `2px solid rgba(0,18,255,0.25)`
  - vignette overlay: `radial-gradient(ellipse at 50% 45%, transparent 15%, rgba(0,0,0,0.55) 100%)`
  - canvas draws perspective wireframe grid (vanishing point center)
- **dots**: 3 stem position indicators
  - active: white, pulsing blue glow animation (`box-shadow: 0 0 16px var(--blue)`)
  - inactive: `rgba(0,18,255,0.6)`, 30% opacity
  - locked: solid `--blue`, 80% opacity
  - sizes scale with depth (closer = larger)
  - draggable in 3D space (x from mouse, z from vertical position)
- **LFO section**: 3 columns (X/Y/Z axes)
  - each: wave canvas (36px height, blue border), shape buttons (SIN/TRI/SQR/SAW), rate + depth sliders
  - slider track: `rgba(0,18,255,0.2)`, thumb: `rgba(0,18,255,0.6)` square
  - mute buttons: M1/M2/M3, muted state = red tint
- **block labels**: BLOCK1/BLOCK2/BLOCK3 selector row
  - selected: white, inactive: grey, locked: blue
- **lock button**: `.btn-w` style, "lock block N"
- **timer**: JetBrains Mono 11px bold, top-right, 5:00 countdown
- **spatial audio**: Web Audio API with HRTF panners, oscillators mapped to dot positions

### 6. mint

- "Catalog Your Composition" title: `.t-solid` 34px centered
- "choose a genre" subtitle: `.t-mono` grey 12px
- genre selector: recess button with scrollable list inside
  - 20 genres: ambient, drone, industrial, noise, glitch, dark ambient, field recording, musique concrete, electroacoustic, sound art, lo-fi, harsh noise, power electronics, tape music, generative, modular, microsound, acousmatic, dark techno, ritual
  - selected: white text, unselected: grey text
  - 9px, uppercase, letter-spacing 1px, font-weight 700
  - CSS mask for fade-out at top/bottom edges
- preview player: recess play button (44x44) + horizontal waveform + time
- full wallet address: 8px, 50% opacity
- catalog number: 7px, 30% opacity, `#blocknoise#146`
- "mint to arweave" button: `.btn-w`

### 7. leaderboard

- "Leaderboard" title: `.t-solid` 36px centered
- scrollable list (`.lb-list`) with thin 3px scrollbar
- each row (`.lb-row`):
  - play button: 14px wide, black triangle, 10px font
  - rank: JetBrains Mono 8px bold, 40% opacity, 16px wide right-aligned
  - wallet: 8px bold
  - catalog: 7px, 30% opacity, JetBrains Mono
  - mini waveform: 8px height, 2px wide bars, 40% opacity white
  - genre: 5px, grey, uppercase, letter-spacing 0.5px
  - score: Space Grotesk 9px bold, right-aligned
  - votes: 5px grey
- row padding: 2px vertical, border-bottom: `1px solid rgba(0,0,0,0.2)`
- fits 20 entries visible
- tab bar has lighter border: `1px solid rgba(255,255,255,0.12)`

### 8. seeker radio

- "BLOCK NOISE" title: `.t-outline` 68px (same as home)
- "seeker radio" subtitle: 10px, 50% opacity, uppercase, letter-spacing 2px
- visualizer: recess button with canvas inside, aspect-ratio 1
  - waveform visualization rendered on canvas (circular/radial bars)
- track info row: wallet (9px bold) + catalog (7px 35% opacity) + genre (8px grey uppercase)
- transport controls: 3 recess buttons
  - prev/next: 48x48px
  - play: 60x60px (larger)
  - all with beveled 3D recess animation
- social icons row: X (Twitter), Telegram, Instagram — 28x28px SVGs, black fill
- social gap: 28px between icons

---

## animations

### recess button press

```js
REST = { x1: 8, y1: 5, x2: 78, y2: 82 }     // inner rect at rest
PRESSED = { x1: 4, y1: 2.5, x2: 89, y2: 91 } // inner rect pressed (expanded)
DURATION = 180 // ms
// easeInOut: t < 0.5 ? 2*t*t : -1 + (4-2*t)*t
```

all SVG polygons, lines, rect, and content padding animate together.
font sizes and gaps inside recess-content scale proportionally with inner rect width.

### mixer dot pulse

```css
@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 16px var(--blue), 0 0 32px rgba(0,18,255,0.6), 0 0 64px rgba(0,18,255,0.25); }
  50% { box-shadow: 0 0 24px var(--blue), 0 0 48px rgba(0,18,255,0.7), 0 0 96px rgba(0,18,255,0.4); }
}
```

2s ease-in-out infinite, only on `.dot.active`

### waveform bars

```css
@keyframes wave { from { height: 6px; opacity: 0.3; } to { height: 100%; opacity: 1; } }
```

0.6s ease-in-out infinite alternate, staggered with `animation-delay`

### button press

```css
.btn:active { transform: translateY(2px); }
```

### LFO shape buttons

```css
.lfo-shape-btn:active { transform: scale(0.95); }
```

---

## mixer 3D projection

```js
function project(x, y, z, w, h) {
  var vx = w * 0.5;
  var vy = h * 0.5;
  var farScale = 0.55;
  var scale = 1.0 / (1.0 + z * (1.0 / farScale - 1.0));
  return { sx: vx + (x - 0.5) * w * scale, sy: vy + (0.5 - y) * h * scale, scale };
}
```

- vanishing point: center of room
- farScale: 0.55 (back wall is 55% size of front)
- dot sizes: 16px base * scale (min 6px, max 28px)
- room border padding: 4px from walls at any depth

---

## what NOT to do

- no light backgrounds anywhere
- no pure white (#FFFFFF) — always use #F2F0ED
- no gradients (except mixer vignette)
- no drop shadows (except mixer dot glow)
- no rounded corners — everything is square/angular
- no border-radius on any element
- no emoji in app UI
- no skeleton loaders — use simple text states ("generating...", "loading...")
- no toast notifications — use inline status text
- no modal dialogs except MWA wallet prompts (system-level)
- no light mode — dark only, forever
- no old colours: #080A0C, #0A1628, #00D9C0, #E8197A, #F0EBE0, #0033FF
- no ABC Favorit font — only ABC Solar, JetBrains Mono, Space Grotesk
- no blocknoise.xyz domain — use blocknoise.io
