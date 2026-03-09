export const DEMO_WALLET_ADDRESS = '7KUbR8fkK6uNh9W4EcYguPeK3ijUbwz9n6BhV5orU1ep';
export const PRIMARY_WALLET_ADDRESS = '7KUbR8fkK6uNh9W4EcYguPeK3ijUbwz9n6BhV5orU1ep';

export const DEMO_AUDIO_URLS = {
  standard: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  stems: [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  ],
} as const;

function buildDemoWaveform(length: number, phase: number) {
  return Array.from({ length }, (_, index) => {
    const envelope = 0.24 + Math.abs(Math.sin(index * 0.17 + phase)) * 0.76;
    return Number(envelope.toFixed(3));
  });
}

export const DEMO_WAVEFORMS = {
  standard: [buildDemoWaveform(84, 0.6)],
  stems: [
    buildDemoWaveform(64, 0.1),
    buildDemoWaveform(64, 1.3),
    buildDemoWaveform(64, 2.4),
  ],
} as const;

export const DEMO_PRICES = {
  sol: 0.07,
  usdc: 1,
  skr: 5,
  solUsd: 140,
  skrUsd: 1,
} as const;

export const DEMO_LEADERBOARD = [
  {
    id: 'demo-1',
    wallet_address: '7YF4LQv2oEw3dNnD3C9aG4qYq4XbX9fyvB8fYxWjXg6s',
    display_name: 'psyche.tropes',
    arweave_url: DEMO_AUDIO_URLS.standard,
    tier: 'pro' as const,
    genre: 'ritual',
    score: 18,
    vote_count: 11,
    catalog_number: 12,
    created_at: new Date('2026-03-08T12:00:00Z').toISOString(),
  },
  {
    id: 'demo-2',
    wallet_address: 'D8mVJQw4mG9u4QGhYg1q5Lr2wYv5HxQvNn1mM3oT8pZc',
    display_name: 'field.operator',
    arweave_url: DEMO_AUDIO_URLS.standard,
    tier: 'standard' as const,
    genre: 'dark ambient',
    score: 12,
    vote_count: 8,
    catalog_number: 11,
    created_at: new Date('2026-03-08T11:00:00Z').toISOString(),
  },
  {
    id: 'demo-3',
    wallet_address: '4wKXK6QZ1r8tQ2qfF5q4A6xR7zW2nB1mV3kT9uY5rP2a',
    display_name: null,
    arweave_url: DEMO_AUDIO_URLS.standard,
    tier: 'standard' as const,
    genre: 'glitch',
    score: 7,
    vote_count: 5,
    catalog_number: 10,
    created_at: new Date('2026-03-08T10:00:00Z').toISOString(),
  },
] as const;

export const DEMO_RADIO = DEMO_LEADERBOARD.map((entry, index) => ({
  wallet_address: entry.wallet_address,
  display_name: entry.display_name,
  arweave_url: entry.arweave_url,
  genre: entry.genre,
  tier: index === 0 ? 'pro' as const : entry.tier,
  id: entry.id,
  stem_urls: index === 0 ? [...DEMO_AUDIO_URLS.stems] : null,
  spatial_path:
    index === 0
      ? [
          [[-0.5, 0.3, 0, 0]],
          [[0.5, -0.2, 0.3, 0]],
          [[0, 0.5, -0.4, 0]],
        ]
      : null,
  catalog_number: entry.catalog_number,
}));
