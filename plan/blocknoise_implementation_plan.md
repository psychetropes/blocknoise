# blocknoise — tech stack & implementation plan

A complete reference document for Claude Code to build the blocknoise Android dApp.
All filenames, directory names, variables, and UI strings must use **lowercase only** — no capitals anywhere except in comments and documentation where grammatically required.

---

## project overview

blocknoise is a Solana Mobile dApp built exclusively for the Seeker device and the Solana dApp Store. Users connect their Solana wallet, generate a unique audio composition (USI) from their public key hash via ElevenLabs' sound generation API, optionally mix it spatially using The Block 3D mixer (Pro USI), assign a genre, and mint it permanently to Arweave. A live leaderboard and Seeker Radio ambient stream drive ongoing engagement.

The project is a research imprint of Psyché Tropes — an internationally exhibited experimental sound and film label. Qualifying seasons result in a real vinyl release with PR and distribution.

---

## testing device

A **physical Solana Seeker device** is available for testing throughout the build. This is critical — Solana Mobile Wallet Adapter (MWA) requires a physical Android device with a wallet app installed. The emulator cannot complete MWA wallet signing flows. Use the Seeker device for all MWA-dependent testing from Day 1.

Development workflow:
- Use Android emulator for UI, layout, and non-wallet flows
- Use Seeker device (USB or wireless ADB) for all wallet connect, sign, and mint flows
- Build and install APKs to Seeker via `adb install` or `eas build` preview profile

---

## monorepo structure

The repository is a monorepo with two workspaces: the mobile app (`app`) and the API server (`server`). All directory and file names are lowercase with hyphens — no camelCase directories, no uppercase anywhere in paths.

```
blocknoise/
├── .github/
│   └── workflows/
│       └── ci.yml               # lint + type check on push
├── app/                         # react native / expo
│   ├── android/                 # android native build files
│   ├── assets/
│   │   └── fonts/               # abc favorit + jetbrains mono
│   ├── src/
│   │   ├── screens/
│   │   │   ├── home.tsx
│   │   │   ├── generate.tsx
│   │   │   ├── block-mixer.tsx
│   │   │   ├── mint.tsx
│   │   │   ├── leaderboard.tsx
│   │   │   └── radio.tsx
│   │   ├── components/
│   │   │   ├── wallet-connect.tsx
│   │   │   ├── audio-player.tsx
│   │   │   ├── genre-selector.tsx
│   │   │   ├── leaderboard-row.tsx
│   │   │   ├── radio-player.tsx
│   │   │   └── block/
│   │   │       ├── block-canvas.tsx
│   │   │       ├── stem-object.tsx
│   │   │       └── path-recorder.tsx
│   │   ├── hooks/
│   │   │   ├── use-wallet.ts
│   │   │   ├── use-generate.ts
│   │   │   ├── use-mint.ts
│   │   │   └── use-leaderboard.ts
│   │   ├── services/
│   │   │   ├── solana.ts          # payment tx builders (SOL/USDC/SKR)
│   │   │   ├── pricing.ts         # jupiter price fetching
│   │   │   └── track-player.ts    # background playback service
│   │   ├── utils/
│   │   │   └── arweave.ts         # ar:// → https gateway resolver
│   │   ├── config.ts              # network config (devnet/mainnet)
│   │   ├── store/
│   │   │   └── index.ts           # zustand global store
│   │   ├── theme/
│   │   │   └── index.ts
│   │   └── spatial/
│   │       ├── spatial-audio-bridge.ts   # HRTF spatial engine
│   │       └── lfo.ts                    # LFO modulation system
│   ├── index.js                   # entry point with polyfills
│   ├── app.json
│   ├── babel.config.js
│   ├── tsconfig.json
│   └── package.json
├── server/                      # express api
│   ├── src/
│   │   ├── routes/
│   │   │   ├── generate.ts      # elevenlabs proxy
│   │   │   ├── upload.ts        # arweave upload + supabase insert
│   │   │   ├── leaderboard.ts
│   │   │   ├── vote.ts
│   │   │   ├── radio.ts
│   │   │   ├── price.ts
│   │   │   └── genres.ts
│   │   ├── middleware/
│   │   │   └── rate-limit.ts    # global + generate-specific limiters
│   │   ├── audio-cache.ts       # in-memory cache with 30min TTL
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
├── supabase/
│   └── schema.sql               # full schema + seeds + RLS + migration
├── preview/
│   └── index.html               # static phone mockup preview
├── .env.example                 # template — never commit real .env
├── .gitignore
├── package.json                 # workspace root
├── README.md
└── LICENCE
```

---

## repository standards

This repo will be assessed for quality. The following rules are non-negotiable:

- **No unnecessary files** — no `.DS_Store`, no `node_modules` committed, no stray test files, no commented-out code blocks left in production files
- **`.gitignore` must be comprehensive** — cover node_modules, .env files, android/build, android/.gradle, *.keystore, eas credentials
- **`.env.example` committed with all keys listed but no values** — serves as documentation for required environment variables
- **TypeScript strict mode** — `"strict": true` in both tsconfigs, no `any` types without explicit justification
- **Consistent code style** — ESLint + Prettier configured and enforced via CI
- **README.md must be complete** — project description, tech stack overview, local setup instructions, environment variable reference, build and test commands, submission notes
- **Semantic commit messages** — `feat:`, `fix:`, `chore:`, `docs:` prefixes
- **No API keys anywhere in client code** — ElevenLabs key lives only in `server/.env`

---

## tech stack

### core framework
- **React Native** via Expo bare workflow
  - Bare workflow required for native Solana Mobile Stack modules
  - Target: Android only (APK output for Solana dApp Store)

### solana integration
- **`@solana-mobile/mobile-wallet-adapter-protocol`** — MWA wallet connection
- **`@solana-mobile/mobile-wallet-adapter-protocol-web3js`** — MWA transaction signing
- **`@solana/web3.js`** — Solana RPC, transaction building
- **`@solana/spl-token`** — SPL token handling for SKR and USDC payments
- **`@metaplex-foundation/mpl-token-metadata`** — NFT minting and metadata
- **`@metaplex-foundation/umi`** — Metaplex SDK abstraction

### polyfills (critical — app crashes without these)
- **`react-native-get-random-values`** — crypto polyfill for @solana/web3.js (MUST be first import)
- **`buffer`** — `global.Buffer = Buffer` in index.js before any other imports

### audio generation
- **ElevenLabs Sound Effects API** (`/v1/sound-generation`)
  - Model: `eleven_text_to_sound_v2`
  - `loop: true` on all calls — seamless looping at source
  - Standard USI: 1 × 30s track (1,200 credits)
  - Pro USI: 3 × 30s looping stems in parallel (3,600 credits)
  - Prompt format: `{walletPublicKey}_layer{n}` where n = 1, 2, 3
  - `prompt_influence: 0.3` — maintains randomness/lottery feel
  - **API key must never leave the server** — all generation calls proxied through Express

### audio playback
- **`expo-av`** — track playback, volume, position
- **`react-native-track-player`** — background audio queue for Seeker Radio
- **Web Audio API** (via `react-native-webview` bridge) — real-time 3D spatial panning from Block mixer using HRTF PannerNode

### spatial audio engine (implemented in `app/src/spatial/`)

The spatial audio system bridges React Native to the Web Audio API via a hidden WebView, enabling real-time HRTF 3D audio processing that isn't natively available in React Native.

**`spatial-audio-bridge.ts`** — core bridge class
- Creates a hidden `react-native-webview` instance running an inline Web Audio API context
- Each stem gets its own signal chain: `AudioBufferSourceNode → GainNode → PannerNode → destination`
- `PannerNode` configured with `panningModel: 'HRTF'` and `distanceModel: 'inverse'` for realistic 3D spatial rendering
- Listener (head) positioned at origin `(0, 0, 0)` — stem positions relative to listener
- Communication via `postMessage` bridge: React Native sends JSON commands, WebView executes audio operations
- Supports: `loadStems(urls[])`, `setPosition(stemIndex, x, y, z)`, `play()`, `pause()`, `dispose()`
- Path playback: accepts recorded `[x, y, z, timestamp][]` arrays and interpolates positions over time using `requestAnimationFrame`
- Default positions for pro tracks without recorded paths: stems spread at `[-2,0,0]`, `[2,0,0]`, `[0,0,-2]`

**`lfo.ts`** — low frequency oscillator modulation
- Generates subtle continuous spatial movement even when stems are stationary
- Configurable waveform (sine, triangle, sawtooth, square), frequency, and amplitude
- Each stem can have independent LFO parameters for organic spatial drift
- Modulates PannerNode x/y/z positions by small offsets (±0.3 range default)
- Creates the perception of "living" sound fields — stems breathe and shift in 3D space

**Signal flow for Pro USI playback:**
```
3 audio stems (from Arweave ar:// URLs, resolved to https)
    ↓
SpatialAudioBridge WebView
    ↓
3× AudioBufferSourceNode (one per stem, looping)
    ↓
3× GainNode (volume per stem)
    ↓
3× PannerNode (HRTF, positions from path or default + LFO modulation)
    ↓
AudioContext.destination (stereo headphone output with 3D spatial rendering)
```

**Radio integration:**
- Radio screen detects pro tracks via `stem_urls` presence
- Standard tracks: `react-native-track-player` (normal stereo playback)
- Pro tracks: TrackPlayer paused → SpatialAudioBridge activated with stem URLs + spatial path
- Seamless switching between playback modes as queue advances

### 3d block mixer (implemented in `app/src/components/block/`)

- **`@react-three/fiber`** + **`@react-three/drei`** (Three.js)
  - Wireframe cube geometry ("The Block") — transparent edges, dark fill
  - 3 draggable stem spheres with `react-native-gesture-handler` pan responder
  - Each sphere colour-coded and emissive (cyan, magenta, white)
  - Touch path recorded as `[x, y, z, timestamp]` arrays per stem
  - Smooth cubic interpolation between recorded path points
  - At timer end: final path point interpolated back to origin for seamless loop
  - Stem positions drive SpatialAudioBridge PannerNode positions in real-time
  - 5-minute countdown timer with visual progress indicator
  - "Lock mix" button to end early
  - Path data saved to `spatial_path` jsonb column in supabase

### permanent storage
- **Irys SDK** (`@irys/sdk`) — Arweave uploads paid in SOL
  - Devnet for development (free)
  - Mainnet for production
  - Each mint uploads: MP3 audio file(s) + JSON metadata manifest
  - Pro tier: 3 stems uploaded in parallel via `Promise.all`
  - Returns permanent `ar://` URI used in NFT metadata
  - **Requires `IRYS_WALLET_KEY` env var** — base58 private key for funding uploads

### backend / api
- **Node.js + Express + TypeScript** — lightweight proxy server
  - All ElevenLabs calls proxied here — key never exposed to client
  - Payment verification: on-chain tx validation with replay protection
  - Rate limiting: global 30/min + generate-specific 5/min
  - Audio cache: in-memory with 30min TTL, enforced on read
  - CORS: configurable allowed origins via `CORS_ORIGINS` env var

### database
- **Supabase** (PostgreSQL + Realtime) ✅ SET UP
  - Realtime subscriptions for live leaderboard updates
  - Row-level security enforces read-only public access
  - Server uses service_role key to bypass RLS for writes
  - Tables: `usis`, `votes`, `genres`
  - Views: `leaderboard` (SKR-weighted scoring)

### price oracle
- **Jupiter Price API** (free, no key required)
  - `GET https://price.jup.ag/v6/price?ids=SKR,SOL,USDC`
  - Called at mint time — never cached for longer than 60 seconds
  - Converts USD price ($10 standard / $20 pro) to token amount at mint moment

### state management
- **Zustand** — global store for wallet state, generation state, leaderboard

### navigation
- **React Navigation v7** — stack navigator + bottom tab navigator

### styling
- **NativeWind** (Tailwind for React Native)
- Custom theme tokens:
  ```typescript
  export const theme = {
    bg:      '#080A0C',
    bg2:     '#0F1215',
    cream:   '#F0EBE0',
    cyan:    '#00D9C0',
    magenta: '#E8197A',
    muted:   '#4A5560',
    muted2:  '#2A3038',
  }
  ```
- Fonts: ABC Favorit (titles/headings), JetBrains Mono (body/data/code elements)

---

## UI design system (implemented in `preview/index.html` + app screens)

The design language is dark, minimal, and brutalist — inspired by experimental music label aesthetics. Every screen uses the same visual vocabulary.

### design principles
- **Dark-first**: near-black backgrounds (`#080A0C`), no white backgrounds anywhere
- **Monospace data**: all wallet addresses, catalog numbers, and technical data in JetBrains Mono
- **Minimal chrome**: no drop shadows, no gradients except on functional elements (bevels)
- **Accent restraint**: cyan (`#00D9C0`) for primary actions, magenta (`#E8197A`) for pro/premium indicators, cream (`#F0EBE0`) for body text
- **Compact density**: leaderboard fits 20 entries without scrolling — tight padding, small fonts
- **Lowercase everything**: all UI text is lowercase — headings, buttons, labels, alerts

### screen designs

**home / wallet connect**
- Full-screen dark background
- Centered "connect wallet" button in cyan
- After connection: truncated wallet address (4...4 format) + disconnect option
- Tier selection: two cards (standard / pro) with pricing + credit breakdown

**generate screen**
- Loading animation during ElevenLabs generation
- Audio preview player with looping waveform visualisation
- Genre selector: 3D beveled recess box (SVG bevel frame) containing scrollable genre list
  - Recess effect: layered SVG creating inset 3D appearance
  - Content clipped to inner bevel bounds via `position: absolute` with `top: 5%; bottom: 18%; left: 8%; right: 22%`
  - Vertical scroll with fade mask (`mask-image: linear-gradient`) at top/bottom edges
  - Selected genre highlighted in cyan

**block mixer (pro only)**
- Full-screen Three.js canvas
- Wireframe cube centered in viewport
- 3 colour-coded draggable spheres (cyan, magenta, white)
- Timer countdown in top corner
- "Lock mix" button at bottom
- Real-time spatial audio feedback through headphones

**mint screen**
- Payment method selector (USDC / SOL / SKR)
- Live price display: USD amount prominent, token equivalent below
- MWA signing prompt
- Success state: "#blocknoise#N" catalog number displayed

**leaderboard**
- Compact row design:
  - Row padding: 4px vertical, 2px horizontal
  - Mini waveform bar: 8px height
  - Meta text: 5px font size
  - Score: 9px font with line-height 1
  - Vote count: 5px with line-height 1
- Catalog number `#blocknoise#N` displayed per entry
- Tier badge: "pro" in magenta for pro USIs
- Genre tag in muted text
- Inline audio player per row (arweave URLs resolved from `ar://` to `https://`)
- Vote button with SKR-weighted indicator (2x for token holders)
- Realtime updates via Supabase subscription
- Permanent border-top on tab bar (`1px solid rgba(255,255,255,0.12)`)
- Tab filters: "all time", "this week", "today"

**seeker radio**
- Now-playing display: catalog number + wallet address
- "pro — spatial" badge for pro tracks using HRTF playback
- Animated waveform bars
- Upvote button for current track
- Background playback persists when app is minimized
- Queue auto-advances through leaderboard-ordered playlist

### reusable UI components
- **3D beveled recess box**: SVG frame creating an inset panel effect, used for genre selector and tier cards. Content area is absolutely positioned within the inner bevel bounds.
- **Audio player**: looping playback with waveform visualization, play/pause toggle
- **Wallet address display**: always truncated `XXXX...XXXX` format in JetBrains Mono cyan
- **Tab bar**: bottom navigation with icons, border-top separator

---

## environment variables

```bash
# server/.env — never committed, never referenced in client code
ELEVENLABS_API_KEY=              # elevenlabs api key for sound generation
SUPABASE_URL=                    # supabase project url (https://xxx.supabase.co)
SUPABASE_SERVICE_KEY=            # supabase service role key (server-side only)
SOLANA_RPC=https://api.devnet.solana.com
SOLANA_NETWORK=devnet            # 'devnet' or 'mainnet'
IRYS_WALLET_KEY=                 # base58 private key for arweave uploads (REQUIRED)
TREASURY_ADDRESS=                # solana wallet to receive payments (REQUIRED)
CORS_ORIGINS=                    # comma-separated allowed origins (empty = allow all)

# app/.env — non-sensitive client config only
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SOLANA_NETWORK=devnet
EXPO_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
EXPO_PUBLIC_SUPABASE_URL=        # supabase project url
EXPO_PUBLIC_SUPABASE_ANON_KEY=   # supabase anon/public key
EXPO_PUBLIC_TREASURY_ADDRESS=    # MUST match server TREASURY_ADDRESS
```

The `.env.example` at repo root lists all keys with empty values and a one-line comment explaining each. This is the only env file committed to the repo.

**Critical**: `EXPO_PUBLIC_TREASURY_ADDRESS` has no fallback — app throws on startup if missing. This prevents funds being sent to wrong addresses.

---

## network configuration

All network settings flow from a single source of truth: `app/src/config.ts`

```typescript
export const config = {
  network: (process.env.EXPO_PUBLIC_SOLANA_NETWORK ?? 'devnet') as 'devnet' | 'mainnet',
  get rpcUrl() { ... },        // devnet or mainnet RPC
  get irysUrl() { ... },       // devnet or mainnet Irys node
  get solanaCluster() { ... }, // 'devnet' or 'mainnet-beta' for MWA
}
```

All wallet, payment, and upload code references `config.ts` — no hardcoded network values anywhere.

---

## database schema (supabase) ✅ DEPLOYED

```sql
-- usis table (allows multiple mints per wallet)
create table usis (
  id               uuid primary key default gen_random_uuid(),
  wallet_address   text not null,
  arweave_url      text not null,
  metadata_url     text not null,
  mint_address     text not null,       -- stores txSignature for replay protection
  tier             text check (tier in ('standard', 'pro')) not null,
  genre            text not null,
  spatial_path     jsonb,
  catalog_number   serial not null,     -- auto-incrementing #blocknoise#N
  stem_urls        text[],              -- pro tier: individual stem arweave urls
  created_at       timestamptz default now()
);

-- votes (1 per wallet per usi, skr holders get 2x weight)
create table votes (
  id               uuid primary key default gen_random_uuid(),
  usi_id           uuid references usis(id),
  voter_wallet     text not null,
  voter_has_skr    boolean default false,
  created_at       timestamptz default now(),
  unique(usi_id, voter_wallet)
);

-- genres (40 seeded)
create table genres (
  id   serial primary key,
  name text not null unique
);

-- leaderboard view (skr votes weighted ×2)
create or replace view leaderboard as
  select
    u.id, u.wallet_address, u.arweave_url, u.tier, u.genre,
    u.catalog_number, u.spatial_path, u.stem_urls, u.created_at,
    coalesce(sum(case when v.voter_has_skr then 2 else 1 end), 0) as score,
    count(v.id) as vote_count
  from usis u
  left join votes v on v.usi_id = u.id
  group by u.id
  order by score desc;

-- RLS: public read, server writes via service_role key
```

---

## security measures ✅ IMPLEMENTED

| area | protection |
|------|-----------|
| payment verification | on-chain tx validation: checks feePayer, treasury recipient, tx success |
| replay protection | txSignature stored as mint_address; duplicate attempts rejected |
| treasury safety | no fallback address — app/server throw if env var missing |
| rate limiting | global 30 req/min + generate endpoint 5 req/min |
| cache TTL | enforced on read (not just cleanup interval) |
| CORS | configurable allowed origins for production |
| RLS | supabase row-level security on all tables |
| api key isolation | ElevenLabs key server-side only, never in client bundle |
| network consistency | single config.ts drives all network settings |
| polyfills | crypto + buffer polyfills loaded before any solana code |

---

## pricing logic

Prices are always pegged to USD and converted to token amounts at mint time.

| tier | usdc / sol | skr (50% discount) | credits used |
|------|-----------|-------------------|--------------|
| standard | $10 | $5 | 1,200 |
| pro | $20 | $10 | 3,600 |

Never hardcode SKR or SOL amounts. Always call `/price` immediately before building the payment transaction. Display the USD amount prominently — token equivalent shown below it is informational only.

---

## core user flows

### flow 1 — standard usi mint

```
1.  launch app → wallet-connect screen (MWA via config.solanaCluster)
2.  app reads public key
3.  user selects 'standard' tier → taps 'generate'
4.  POST /generate { walletAddress, tier: 'standard' }
    → server calls ElevenLabs (1 call, 30s, loop: true)
    → audio cached server-side (30min TTL)
5.  user previews track (looping)
6.  user selects genre from list
7.  GET /price → display USD amount + token equivalent
8.  user selects payment method: usdc / sol / skr
9.  app builds transaction → MWA wallet signing on Seeker device
10. POST /upload { walletAddress, txSignature, genre, tier }
    → server verifies payment (replay check, sender, treasury)
    → irys uploads mp3 + metadata json to arweave
    → record saved to supabase with catalog_number
    → cache cleared after successful insert
11. success alert: "#blocknoise#N"
12. user lands on leaderboard showing their new usi
```

### flow 2 — pro usi mint

```
1-2. same as standard
3.   user selects 'pro' tier → taps 'generate'
4.   POST /generate { walletAddress, tier: 'pro' }
     → server makes 3 parallel elevenlabs calls (layer1, layer2, layer3)
     → 3 stems cached server-side
5.   user enters block-mixer screen
     → three.js wireframe cube renders
     → 3 stem spheres at default positions
     → 5:00 countdown begins
     → user drags stems through 3d space via touch
     → paths recorded as [x, y, z, timestamp] arrays
     → HRTF spatial audio bridge applies 3D panning in real-time
6.   timer ends or user taps 'lock mix'
     → final path point interpolated back to origin (smooth loop)
     → spatial mix previewed as continuous loop
7.   user selects genre
8.   payment + signing (same as standard, $20 / $10 skr)
9.   POST /upload → all 3 stems uploaded to arweave in parallel
     → stem_urls[] + spatial_path saved to supabase
10.  success alert: "#blocknoise#N"
```

### flow 3 — seeker radio

```
1. user opens radio tab
2. GET /radio → leaderboard-ordered playlist with stem_urls + spatial_path
3. standard tracks: react-native-track-player with ar:// → https resolution
4. pro tracks: SpatialAudioBridge with HRTF panning + path playback
5. background playback continues when app is backgrounded
6. now-playing ui: #blocknoise#N + "pro — spatial" badge for pro tracks
7. user can upvote current track directly from radio screen
8. queue advances automatically on track end
```

---

## api endpoints

| method | endpoint | auth | rate limit | description |
|--------|----------|------|-----------|-------------|
| POST | `/generate` | wallet address | 5/min | generate stems via elevenlabs |
| POST | `/upload` | tx signature | 30/min | verify payment + upload to arweave |
| GET | `/leaderboard` | none | 30/min | ranked usi list with scores |
| POST | `/vote` | wallet signature | 30/min | cast upvote (1 per wallet) |
| GET | `/radio` | none | 30/min | ordered playlist with stem data |
| GET | `/price` | none | 30/min | live skr / sol / usdc rates |
| GET | `/genres` | none | 30/min | genre list from db |
| GET | `/health` | none | none | service health check |

---

## nft metadata schema (arweave)

```json
{
  "name": "blocknoise usi — [wallet_short]",
  "description": "a unique sound identifier generated from solana wallet [full_address]. part of the blocknoise research project — a psyché tropes imprint.",
  "image": "https://blocknoise.xyz/cover.png",
  "animation_url": "ar://[arweave_tx_id]",
  "external_url": "https://blocknoise.xyz",
  "attributes": [
    { "trait_type": "tier",   "value": "pro" },
    { "trait_type": "genre",  "value": "ambient" },
    { "trait_type": "season", "value": "1" },
    { "trait_type": "wallet", "value": "[full_address]" },
    { "trait_type": "catalog", "value": "#blocknoise#42" }
  ],
  "properties": {
    "files": [{ "uri": "ar://[arweave_tx_id]", "type": "audio/mpeg" }],
    "category": "audio",
    "spatial_path": "[...path_data_if_pro_or_null...]"
  }
}
```

---

## build status

### ✅ completed

- [x] monorepo scaffold (app + server workspaces)
- [x] expo bare workflow with android target
- [x] solana MWA integration (wallet connect + sign)
- [x] react navigation (stack + bottom tabs)
- [x] nativewind + theme tokens + fonts
- [x] all screen files scaffolded and navigable
- [x] eslint + prettier + typescript strict
- [x] comprehensive .gitignore
- [x] express server with typescript
- [x] `/generate` endpoint (elevenlabs proxy)
- [x] `/upload` endpoint (arweave upload + supabase insert + payment verification)
- [x] `/leaderboard`, `/vote`, `/radio`, `/price`, `/genres` endpoints
- [x] supabase schema deployed with RLS + genres seeded
- [x] irys arweave integration (parallel stem uploads for pro)
- [x] audio player component with loop support
- [x] block-mixer screen (three.js wireframe cube + draggable stems)
- [x] spatial audio bridge (HRTF panner via webview)
- [x] LFO modulation system
- [x] path recording + playback
- [x] genre selector with 3D beveled recess UI
- [x] payment flow (USDC / SOL / SKR with jupiter pricing)
- [x] leaderboard screen (realtime, voting, catalog numbers)
- [x] seeker radio (standard + spatial playback, ar:// resolution)
- [x] zustand global store
- [x] security audit + all critical/high fixes applied
- [x] polyfills (react-native-get-random-values + Buffer)
- [x] network config centralized in config.ts
- [x] .env files created (server + app)
- [x] supabase project created + schema deployed
- [x] preview HTML mockup (all screens)

### 🔲 remaining (submission day)

- [ ] fill in .env values (supabase keys, elevenlabs key, treasury wallet, irys key)
- [ ] generate/fund irys wallet for arweave uploads
- [ ] fund test wallet with devnet SOL
- [ ] start server + test all endpoints (`curl localhost:3001/health`)
- [ ] test full pipeline on seeker device
- [ ] create github repo + push code
- [ ] write README.md
- [ ] record demo video on seeker (2-3 mins)
- [ ] prepare pitch deck
- [ ] final APK build for submission
- [ ] set github repo to public

### 🟡 nice-to-have (if time permits)

- [ ] on-chain NFT mint via metaplex (currently arweave-only)
- [ ] vote endpoint wallet ownership verification
- [ ] clean up unused service files (elevenlabs.ts, arweave.ts service, metaplex.ts)
- [ ] CI workflow (.github/workflows/ci.yml)

---

## hard rules for claude code

1. **blocknoise is always lowercase** — in all UI strings, variable names, comments, copy, and filenames
2. **api key never in client** — ElevenLabs key in `server/.env` only, proxied via Express
3. **multiple mints per wallet allowed** — wallet_address is NOT unique; replay protection via txSignature
4. **usd-pegged pricing always** — fetch live rate at mint time, never hardcode token amounts
5. **`loop: true` on all elevenlabs calls** — seamless looping is core to the product
6. **arweave is permanent** — no delete or update flows for minted usis
7. **android only** — no ios code, no ios-specific libraries
8. **physical device required for mwa** — emulator cannot complete wallet signing; use Seeker for all wallet tests
9. **clean repo at all times** — no unnecessary files committed at any point
10. **typescript strict mode** — `"strict": true`, no `any` without justification
11. **no treasury fallbacks** — app crashes intentionally if treasury address not set
12. **config.ts is the single source of truth** — all network/cluster settings come from here

---

## submission checklist

- [ ] functional APK (`eas build --platform android --profile preview`)
- [ ] public GitHub monorepo — clean, professional, documented
- [ ] demo video on Seeker device (2–3 minutes)
- [ ] pitch deck (`blocknoise_pitch.pptx` — already complete)
- [ ] README.md with full setup instructions
- [ ] `.env.example` committed with all keys documented
