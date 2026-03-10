# blocknoise

`blocknoise` is a Solana Mobile dApp designed for the Solana Seeker and the Solana dApp Store. It turns a connected wallet's public key into a unique sound composition, then lets the user catalog it, play it back, and surface it inside the blocknoise ecosystem.

blocknoise is a research imprint of psyché tropes, an experimental audiovisual label. Top leaderboard compositions are intended to feed into real-world releases.

## how it works

1. Connect a Solana wallet through Mobile Wallet Adapter on the Seeker.
2. Choose a composition type and payment method (`USDC`, `SOL`, or `SKR`).
3. Wait for payment confirmation.
4. Generate audio from the connected wallet's public key.
5. For spatial compositions, place the three stems inside the 3D mixer.
6. Choose a genre and mint the composition to the permaweb.
7. Play the result from the leaderboard and Seeker Radio.

## composition types

**standard composition**

- 1 x 30-second looping track
- $10 USD equivalent
- 50% discount for .skr or .sol addresses when paying with `SKR`

**spatial composition**

- 3 x 30-second stems
- 3D spatial mixer
- $20 USD equivalent
- 50% discount for .skr or .sol addresses when paying with `SKR`

## current product flow

- wallet connect
- composition selection
- payment selection
- payment processing / payment complete
- waveform generation
- optional spatial mixing
- genre cataloging
- mint complete
- leaderboard playback
- seeker radio playback

## tech stack

| layer | technology |
| --- | --- |
| app | React Native + Expo (Android only) |
| target device | Solana Seeker / Solana Mobile |
| wallet | Solana Mobile Wallet Adapter |
| audio generation | ElevenLabs sound generation API (server-side proxy) |
| spatial mixer | custom 3D mixer UI + spatial audio bridge |
| spatial audio | Web Audio `PannerNode` via hidden WebView bridge |
| permanent storage | Arweave via Irys |
| backend | Node.js + Express + TypeScript |
| database | Supabase |
| state | Zustand |
| pricing | Jupiter price API |
| radio playback | `react-native-track-player` |

## monorepo structure

```text
blocknoise/
├── app/
│   ├── assets/
│   ├── android/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── screens/
│       ├── services/
│       ├── store/
│       ├── theme/
│       └── utils/
├── server/
│   └── src/
│       └── routes/
└── preview/
```

## local setup

### prerequisites

- Node.js 18+
- Android SDK / `adb`
- Solana Seeker device
- Supabase project
- ElevenLabs API key

### install

```bash
git clone https://github.com/psychetropes/blocknoise.git
cd blocknoise
npm install
```

### environment variables

Copy `.env.example` into `server/.env` and `app/.env`, then set real values.

```bash
# server/.env
ELEVENLABS_API_KEY=your_key_here
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
SOLANA_RPC=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
IRYS_WALLET_KEY=your_base58_private_key
TREASURY_ADDRESS=your_solana_wallet_pubkey

# app/.env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3001
EXPO_PUBLIC_SOLANA_NETWORK=devnet
EXPO_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_TREASURY_ADDRESS=your_solana_wallet_pubkey
```

### run development

```bash
# backend
npm run dev --workspace=server

# metro
npm run start --workspace=app
```

### install on a connected Seeker

```bash
cd app/android
./gradlew :app:installDebug
```

## api endpoints

| method | endpoint | description |
| --- | --- | --- |
| POST | `/generate` | generate standard or spatial audio |
| POST | `/upload` | upload composition data and catalog the mint |
| GET | `/leaderboard` | list minted compositions |
| POST | `/vote` | submit a vote for a composition |
| GET | `/radio` | list compositions for Seeker Radio |
| GET | `/price` | fetch live `SOL` / `SKR` pricing |
| GET | `/genres` | fetch available genres |

## notes

- Pricing is USD-pegged and converted live for `SOL` and `SKR`.
- The `SKR` half-price discount is only applied for wallets that resolve to a `.skr` or `.sol` domain.
- ElevenLabs keys stay server-side.
- Generated audio is requested as looping audio.
- The app includes devnet-safe fallback behavior for demo flows.
- The visual source of truth for the app lives in `preview/index.html`.

## license

MIT
