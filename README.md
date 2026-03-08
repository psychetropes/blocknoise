# blocknoise

a solana mobile dApp that transforms your wallet into a unique sound identifier (usi). built exclusively for the solana seeker device and the solana dApp store.

blocknoise is a research imprint of [psyché tropes](https://psychetropes.xyz) — an internationally exhibited experimental sound and film label. qualifying seasons result in a real vinyl release with pr and distribution.

## how it works

1. connect your solana wallet via mobile wallet adapter
2. generate a unique audio composition from your public key hash
3. optionally mix it spatially in the block — a 3d audio mixer
4. select a genre, pay in usdc / sol / skr
5. your usi is permanently minted to arweave as an nft

**standard usi** — 1 × 30s looping track ($10, or $5 with skr)
**pro usi** — 3 × 30s stems + 3d spatial mixer ($20, or $10 with skr)

## tech stack

| layer | technology |
|-------|-----------|
| app | react native (expo bare workflow), android only |
| blockchain | solana, mobile wallet adapter (mwa) |
| audio generation | elevenlabs sound effects api (server-proxied) |
| 3d mixer | three.js via @react-three/fiber |
| spatial audio | web audio api pannernode via webview bridge |
| permanent storage | arweave via irys sdk |
| nft minting | metaplex mpl-token-metadata |
| database | supabase (postgresql + realtime) |
| backend | node.js + express + typescript |
| state | zustand |
| styling | react native stylesheet + custom theme tokens |
| price oracle | jupiter price api (live usd conversion) |
| background audio | react-native-track-player (seeker radio) |

## monorepo structure

```
blocknoise/
├── app/                 # react native / expo (android)
│   ├── src/
│   │   ├── screens/     # home, generate, block-mixer, mint, leaderboard, radio
│   │   ├── components/  # wallet-connect, audio-player, genre-selector, block/*
│   │   ├── hooks/       # use-wallet, use-generate, use-mint, use-leaderboard, use-radio
│   │   ├── services/    # elevenlabs, arweave, solana, metaplex, pricing
│   │   ├── store/       # zustand global state
│   │   └── theme/       # color tokens
│   └── android/         # native build files
├── server/              # express api (typescript)
│   └── src/
│       ├── routes/      # generate, upload, leaderboard, vote, radio, price, genres
│       └── middleware/   # rate-limit, verify-transaction
├── supabase/            # database schema + genre seeds
└── .github/workflows/   # ci (lint + typecheck)
```

## local setup

### prerequisites

- node.js >= 18
- android studio (for emulator / adb)
- solana seeker device (required for wallet signing flows)
- supabase project (free tier)
- elevenlabs api key

### install

```bash
git clone https://github.com/psychetropes/blocknoise.git
cd blocknoise
npm install
```

### environment variables

copy `.env.example` to `server/.env` and `app/.env`, then fill in values:

```bash
# server/.env
ELEVENLABS_API_KEY=your_key_here
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
SOLANA_NETWORK=devnet
IRYS_WALLET_KEY=your_base58_private_key
TREASURY_ADDRESS=your_solana_wallet_pubkey

# app/.env
EXPO_PUBLIC_API_URL=http://192.168.1.x:3001
EXPO_PUBLIC_SOLANA_NETWORK=devnet
EXPO_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_TREASURY_ADDRESS=your_solana_wallet_pubkey
```

### database setup

run `supabase/schema.sql` in your supabase sql editor to create tables, views, and seed genres.

### run development servers

```bash
# api server (port 3001)
npm run dev --workspace=server

# expo metro bundler (port 8081)
npm run start --workspace=app
```

### build apk

```bash
cd app
npx eas build --platform android --profile preview
```

### test on seeker device

```bash
adb install path/to/blocknoise.apk
```

## api endpoints

| method | endpoint | description |
|--------|----------|-------------|
| POST | /generate | generate stems via elevenlabs |
| POST | /upload | upload to arweave + save to supabase |
| GET | /leaderboard | ranked usi list with scores |
| POST | /vote | cast upvote (1 per wallet) |
| GET | /radio | ordered playlist for seeker radio |
| GET | /price | live skr / sol / usdc rates |
| GET | /genres | genre list from db |

## key design decisions

- **multiple mints per wallet** — each mint gets a serial catalog number (#blocknoise#N)
- **usd-pegged pricing** — live conversion at mint time via jupiter
- **api key server-side only** — elevenlabs key never leaves the express server
- **loop: true on all generation** — seamless audio looping at source
- **arweave = permanent** — no delete or update flows
- **skr holders get 2× vote weight** — checked on-chain at vote time
- **spatial audio via webview bridge** — hrtf panning, lfo modulation, 3d stem placement
- **payment replay protection** — tx signatures stored to prevent double-mint
- **rate limiting** — global 30 req/min + generate endpoint 5 req/min

## licence

mit
