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
│   │   │   ├── use-leaderboard.ts
│   │   │   └── use-radio.ts
│   │   ├── services/
│   │   │   ├── elevenlabs.ts
│   │   │   ├── arweave.ts
│   │   │   ├── solana.ts
│   │   │   ├── metaplex.ts
│   │   │   └── pricing.ts
│   │   ├── store/
│   │   │   └── index.ts
│   │   └── theme/
│   │       └── index.ts
│   ├── app.json
│   ├── babel.config.js
│   ├── tsconfig.json
│   └── package.json
├── server/                      # express api
│   ├── src/
│   │   ├── routes/
│   │   │   ├── generate.ts
│   │   │   ├── upload.ts
│   │   │   ├── leaderboard.ts
│   │   │   ├── vote.ts
│   │   │   ├── radio.ts
│   │   │   ├── price.ts
│   │   │   └── genres.ts
│   │   ├── middleware/
│   │   │   ├── verify-transaction.ts
│   │   │   └── rate-limit.ts
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
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
- **`@solana-mobile/wallet-adapter-mobile`** — MWA hooks and context
- **`@solana/web3.js`** — Solana RPC, transaction building
- **`@solana/spl-token`** — SPL token handling for SKR and USDC payments
- **`@metaplex-foundation/mpl-token-metadata`** — NFT minting and metadata
- **`@metaplex-foundation/umi`** — Metaplex SDK abstraction

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
- **Web Audio API** (via `react-native-webview` bridge) — real-time 3D spatial panning from Block mixer using PannerNode

### 3d block mixer
- **`@react-three/fiber`** + **`@react-three/drei`** (Three.js)
  - Wireframe cube (The Block)
  - 3 draggable stem spheres with gesture handler
  - Touch path recorded as `[x, y, z, timestamp]` arrays
  - Smooth cubic interpolation between path points
  - At timer end: path closes back to origin for seamless loop
  - Stem positions drive Web Audio API PannerNode in real-time

### permanent storage
- **Irys SDK** (`@irys/sdk`) — Arweave uploads paid in SOL
  - Devnet for development (free)
  - Mainnet for production
  - Each mint uploads: MP3 audio file + JSON metadata manifest
  - Returns permanent `ar://` URI used in NFT metadata

### backend / api
- **Node.js + Express + TypeScript** — lightweight proxy server
  - All ElevenLabs calls proxied here — key never exposed to client
  - Validates transaction on-chain before triggering generation
  - Fetches live token prices for USD-pegged mint fees

### database
- **Supabase** (PostgreSQL + Realtime)
  - **Free tier: $0/month** — 500MB DB, 1GB storage, 50K MAUs
  - Free projects pause after 7 days of inactivity — resume manually via Supabase dashboard if this happens during development. Not a concern during active build.
  - Upgrade to Pro ($25/month) before any public launch
  - Realtime subscriptions for live leaderboard updates
  - Row-level security enforces vote integrity

### price oracle
- **Jupiter Price API** (free, no key required)
  - `GET https://price.jup.ag/v6/price?ids=SKR,SOL,USDC`
  - Called at mint time — never cached for longer than 60 seconds
  - Converts USD price ($10 standard / $20 pro) to token amount at mint moment

### state management
- **Zustand** — global store for wallet state, generation state, leaderboard

### navigation
- **React Navigation v6** — stack navigator + bottom tab navigator

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

## environment variables

```bash
# server/.env  — never committed, never referenced in client code
ELEVENLABS_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# app/.env  — non-sensitive client config only
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

The `.env.example` at repo root lists all keys with empty values and a one-line comment explaining each. This is the only env file committed to the repo.

---

## database schema (supabase)

```sql
-- usis
create table usis (
  id               uuid primary key default gen_random_uuid(),
  wallet_address   text not null unique,
  arweave_url      text not null,
  metadata_url     text not null,
  mint_address     text not null,
  tier             text check (tier in ('standard', 'pro')) not null,
  genre            text not null,
  spatial_path     jsonb,
  created_at       timestamptz default now()
);

-- votes
create table votes (
  id               uuid primary key default gen_random_uuid(),
  usi_id           uuid references usis(id),
  voter_wallet     text not null,
  voter_has_skr    boolean default false,
  created_at       timestamptz default now(),
  unique(usi_id, voter_wallet)
);

-- genres
create table genres (
  id   serial primary key,
  name text not null unique
);

-- leaderboard view (skr votes weighted ×2)
create view leaderboard as
  select
    u.id,
    u.wallet_address,
    u.arweave_url,
    u.tier,
    u.genre,
    u.created_at,
    coalesce(sum(case when v.voter_has_skr then 2 else 1 end), 0) as score,
    count(v.id) as vote_count
  from usis u
  left join votes v on v.usi_id = u.id
  group by u.id
  order by score desc;
```

---

## genre list (alphabetical)

```sql
insert into genres (name) values
  ('ambient'),
  ('asmr'),
  ('avant-pop'),
  ('breakcore'),
  ('dark ambient'),
  ('deconstructed club'),
  ('doom'),
  ('drone'),
  ('easy listening'),
  ('electroacoustic'),
  ('esoteric'),
  ('experimental pop'),
  ('field recording'),
  ('folklore'),
  ('free improvisation'),
  ('glitch'),
  ('glossolalia'),
  ('gothic'),
  ('harsh noise'),
  ('hauntology'),
  ('hip hop'),
  ('idm'),
  ('industrial'),
  ('jazz'),
  ('lo-fi'),
  ('lowercase'),
  ('math rock'),
  ('metal'),
  ('minimalism'),
  ('musique concrète'),
  ('new age'),
  ('no wave'),
  ('noise wall'),
  ('noisecore'),
  ('plunderphonics'),
  ('power electronics'),
  ('psychedelic'),
  ('ritual'),
  ('sludge'),
  ('sound art'),
  ('spoken word'),
  ('systems music');
```

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
1.  launch app → wallet-connect screen (MWA)
2.  app reads public key
3.  user selects 'standard' tier → taps 'generate'
4.  POST /generate { walletAddress, tier: 'standard' }
    → server calls ElevenLabs (1 call, 30s, loop: true)
    → returns presigned mp3 url
5.  user previews track (looping)
6.  user selects genre from list
7.  GET /price → display USD amount + token equivalent
8.  user selects payment method: usdc / sol / skr
9.  app builds transaction → MWA wallet signing on Seeker device
10. server verifies transaction confirmed on-chain
11. POST /upload → irys uploads mp3 + metadata json to arweave
12. metaplex mints token with arweave metadata uri
13. usi record saved to supabase
14. user lands on leaderboard showing their new usi
```

### flow 2 — pro usi mint

```
1-2. same as standard
3.   user selects 'pro' tier → taps 'generate'
4.   POST /generate { walletAddress, tier: 'pro' }
     → server makes 3 parallel elevenlabs calls (layer1, layer2, layer3)
     → returns 3 mp3 urls
5.   user enters block-mixer screen
     → three.js wireframe cube renders
     → 3 stem spheres at default positions
     → 5:00 countdown begins
     → user drags stems through 3d space via touch
     → paths recorded as [x, y, z, timestamp] arrays
     → web audio api pannernode applies spatial audio in real-time
6.   timer ends or user taps 'lock mix'
     → final path point interpolated back to origin (smooth loop)
     → spatial mix previewed as continuous loop
7.   user selects genre
8.   payment + signing (same as standard, $20 / $10 skr)
9-13. same as standard + spatial_path json saved to supabase
```

### flow 3 — seeker radio

```
1. user opens radio tab
2. GET /radio → leaderboard-ordered usi playlist
3. react-native-track-player loads queue + begins streaming
4. background playback continues when app is backgrounded
5. now-playing ui: wallet address + animated waveform bars
6. user can upvote current track directly from radio screen
7. queue advances automatically on track end
```

---

## api endpoints

| method | endpoint | auth | description |
|--------|----------|------|-------------|
| POST | `/generate` | tx signature | generate stems via elevenlabs |
| POST | `/upload` | tx signature | upload mp3 + metadata to arweave |
| GET | `/leaderboard` | none | ranked usi list with scores |
| POST | `/vote` | wallet signature | cast upvote (1 per wallet) |
| GET | `/radio` | none | ordered playlist for seeker radio |
| GET | `/price` | none | live skr / sol / usdc rates |
| GET | `/genres` | none | genre list from db |

Auth for generate and upload: client sends the confirmed transaction signature; server verifies it on-chain before proceeding.

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
    { "trait_type": "wallet", "value": "[full_address]" }
  ],
  "properties": {
    "files": [{ "uri": "ar://[arweave_tx_id]", "type": "audio/mpeg" }],
    "category": "audio",
    "spatial_path": "[...path_data_if_pro_or_null...]"
  }
}
```

---

## 3-day build plan

### day 1 — foundation

**morning**
- [ ] initialise monorepo with workspace root `package.json`
- [ ] `npx create-expo-app app --template bare-minimum`
- [ ] install and configure Solana Mobile Stack + MWA
- [ ] set up React Navigation (stack + tabs)
- [ ] set up NativeWind + theme tokens + fonts
- [ ] scaffold all screen files (empty but navigable)
- [ ] configure ESLint + Prettier + TypeScript strict
- [ ] set up `.gitignore` comprehensively from day one

**afternoon**
- [ ] scaffold Express server with TypeScript
- [ ] implement `/generate` endpoint (ElevenLabs proxy, key server-side only)
- [ ] test generation: wallet address string → 1 looping mp3
- [ ] set up Supabase project → run schema migrations → seed genres
- [ ] build `expo-av` audio player component with loop support
- [ ] connect Seeker device via ADB — verify APK installs and runs

**evening**
- [ ] Irys devnet integration — test upload, confirm `ar://` URI returned
- [ ] basic Metaplex NFT mint on devnet
- [ ] end-to-end on devnet: generate → upload → mint → confirm
- [ ] wallet connect flow working on Seeker device

---

### day 2 — core features

**morning**
- [ ] block-mixer screen — Three.js via `@react-three/fiber`
  - wireframe cube geometry (The Block)
  - 3 draggable stem spheres with `react-native-gesture-handler`
  - path recording as `[x, y, z, timestamp]` on touch move
  - 5-minute countdown timer
  - smooth cubic interpolation → loop closure on timer end
- [ ] spatial audio: Three.js positions → Web Audio API PannerNode via webview bridge
- [ ] test mixer on Seeker device (touch + audio)

**afternoon**
- [ ] genre selector screen (populated from `/genres`)
- [ ] payment flow
  - `/price` endpoint with Jupiter API
  - USD → token conversion display
  - transaction building for USDC / SOL / SKR
  - MWA signing on Seeker device
  - server-side transaction verification
- [ ] full standard + pro mint flow end-to-end on devnet (on Seeker)

**evening**
- [ ] leaderboard screen
  - Supabase realtime subscription
  - truncated wallet address display
  - tier badge (pro), genre tag, vote count, weighted score
  - upvote button (1 per wallet, SKR weighting)
  - inline audio playback per row

---

### day 3 — radio, polish, submission

**morning**
- [ ] Seeker Radio screen
  - `react-native-track-player` background queue
  - now-playing UI (wallet address, animated waveform)
  - auto-advance through leaderboard playlist
  - inline upvote from radio screen
- [ ] home screen: connect wallet CTA, tier selection with pricing, recent mints

**afternoon**
- [ ] switch all devnet → mainnet (RPC, Irys, Metaplex)
- [ ] full smoke test on Seeker: connect → generate → mix → mint → leaderboard → radio
- [ ] APK build: `eas build --platform android --profile preview`
- [ ] install APK on Seeker, test complete flow on device

**evening**
- [ ] record demo video on Seeker (2–3 mins covering full flow)
- [ ] clean repo: remove debug logs, stray files, unused imports
- [ ] write README.md
- [ ] final APK build for submission
- [ ] GitHub repo set to public

---

## hard rules for claude code

1. **blocknoise is always lowercase** — in all UI strings, variable names, comments, copy, and filenames
2. **api key never in client** — ElevenLabs key in `server/.env` only, proxied via Express
3. **one mint per wallet** — enforced at DB level (unique constraint on `wallet_address`) AND checked before generation triggers
4. **usd-pegged pricing always** — fetch live rate at mint time, never hardcode token amounts
5. **`loop: true` on all elevenlabs calls** — seamless looping is core to the product
6. **arweave is permanent** — no delete or update flows for minted usis
7. **android only** — no ios code, no ios-specific libraries
8. **physical device required for mwa** — emulator cannot complete wallet signing; use Seeker for all wallet tests
9. **clean repo at all times** — no unnecessary files committed at any point
10. **typescript strict mode** — `"strict": true`, no `any` without justification

---

## submission checklist

- [ ] functional APK (`eas build --platform android --profile preview`)
- [ ] public GitHub monorepo — clean, professional, documented
- [ ] demo video on Seeker device (2–3 minutes)
- [ ] pitch deck (`blocknoise_pitch.pptx` — already complete)
- [ ] README.md with full setup instructions
- [ ] `.env.example` committed with all keys documented
