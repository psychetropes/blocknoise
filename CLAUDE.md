# blocknoise design system — rules for claude code

these rules govern all UI code, CSS, component styling, and visual decisions in the blocknoise project. they are non-negotiable and must be followed in every file.

---

## identity

- **blocknoise** is always lowercase — in all UI strings, variable names, filenames, comments, and copy
- the app is a solana mobile dApp for the seeker device
- the aesthetic is dark, minimal, brutalist — inspired by experimental music label design
- every screen must feel like it belongs on a record sleeve, not a fintech app

---

## colour palette

| token | hex | usage |
|-------|-----|-------|
| `bg` | `#080A0C` | primary background — used on all screens |
| `bg2` | `#0F1215` | card/panel backgrounds — subtle separation |
| `cream` | `#F0EBE0` | primary body text |
| `cyan` | `#00D9C0` | primary actions, wallet addresses, selected states, links |
| `magenta` | `#E8197A` | pro tier badge, premium indicators, warnings |
| `muted` | `#4A5560` | secondary text, borders, inactive elements |
| `muted2` | `#2A3038` | subtle dividers, disabled states |

### colour rules
- never use pure white (`#FFFFFF`) — use `cream` for text
- never use pure black — use `bg` (`#080A0C`)
- cyan is for interactive/active elements only — don't use it decoratively
- magenta is reserved for pro/premium — never use it for standard tier
- borders are always `rgba(255,255,255,0.12)` — never solid white or grey
- no gradients except on functional 3D bevel elements
- no drop shadows anywhere

---

## typography

### fonts
- **ABC Favorit Bold** — headings, titles, button labels
- **JetBrains Mono Regular** — wallet addresses, catalog numbers, data, scores, technical info

### rules
- all text is **lowercase** — headings, buttons, labels, alerts, everything
- never capitalise words unless it's a proper noun in documentation
- wallet addresses always truncated: `XXXX...XXXX` (first 4 + last 4)
- catalog numbers format: `#blocknoise#N` where N is the serial number
- font sizes are compact — body text 10-12px, meta/labels 5-6px, scores 9px
- line-height is tight (1.0-1.2) to maximise density

---

## spacing & density

- the leaderboard must fit 20 entries without scrolling
- row padding: 4px vertical, 2px horizontal
- prefer tight spacing — if it looks like it has room to breathe, it's too loose
- spacers between sections: 12-16px max
- no excessive whitespace — every pixel earns its place

---

## components

### 3D beveled recess box
- SVG frame creating an inset 3D panel effect
- used for: genre selector, tier selection cards, spatial composition panel
- the bevel SVG must always be visible — never clip it with `clip-path` on the parent
- content area uses `position: absolute` with bounds matching the inner bevel: `top: 5%; bottom: 18%; left: 8%; right: 22%`
- scrollable content inside uses `mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 80%, transparent 100%)` for edge fade
- the recess box is a signature UI element — it must look physically recessed, like a hardware control panel

### audio player
- inline waveform visualisation (animated bars)
- play/pause toggle
- looping indicator
- compact: waveform height 8px for leaderboard rows

### wallet address display
- always JetBrains Mono
- always cyan
- always truncated `XXXX...XXXX`
- never show full address in UI (only in metadata)

### buttons
- primary: cyan background, `bg` text, ABC Favorit Bold
- secondary: border only (`muted` colour), no fill
- disabled: `muted2` background, reduced opacity
- all button text lowercase
- no rounded corners > 8px — keep it angular

### tab bar
- bottom of screen, always visible
- `border-top: 1px solid rgba(255,255,255,0.12)` — permanent separator
- active tab in cyan, inactive in muted
- icon + label, both lowercase

---

## screen-specific rules

### leaderboard
- compact rows — every entry must be visible without scrolling
- waveform bar height: 8px
- meta text: 5px
- score: 9px, line-height 1
- vote count: 5px, line-height 1
- catalog number displayed on every row
- pro badge in magenta
- genre in muted text
- tab filters: "all time", "this week", "today"

### radio
- now-playing: large catalog number + truncated wallet
- "pro — spatial" badge when playing HRTF content
- animated waveform bars
- background playback — UI state persists

### genre selector
- inside 3D beveled recess box
- vertical scroll with fade mask at edges
- selected genre: cyan text
- unselected: cream text
- no horizontal scroll — single column list

---

## what NOT to do

- no white backgrounds
- no gradients (except bevels)
- no drop shadows
- no rounded corners > 8px
- no capitalised text in UI
- no emoji in the app UI
- no skeleton loaders — use simple text states ("generating...", "loading...")
- no toast notifications — use inline status text
- no modal dialogs except MWA wallet prompts (which are system-level)
- no onboarding flows or tutorials — the app should be self-explanatory
- no light mode — dark only, forever
