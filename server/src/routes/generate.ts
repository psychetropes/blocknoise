import { Router, Request, Response } from 'express';
import { setCachedAudio } from '../audio-cache';

const router = Router();

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/sound-generation';

const MATERIALS = [
  'granular metallic percussion',
  'dusty tape hiss textures',
  'mutated modular pulses',
  'broken drum machine fragments',
  'glassy resonant tones',
  'distorted low-frequency drones',
  'radio static bursts',
  'hollow industrial knocks',
  'detuned synth clouds',
  'shortwave interference flickers',
  'clipped transistor buzz',
  'resonant spring impacts',
  'mechanical servo chatter',
  'bitcrushed digital shards',
  'processed human vowel tones',
  'fragmented spoken-word syllables',
  'choir-like synthetic pads',
  'plucked string fragments',
  'bowed harmonic tones',
  'detuned piano fragments',
];

const PALETTES = [
  'rhythmic electronic music',
  'synthetic voice textures',
  'tonal harmonic drones',
  'percussive machine music',
  'glitch collage',
  'abstract melodic fragments',
  'spoken-word micro-samples',
  'hybrid electroacoustic textures',
];

const MOTIONS = [
  'slow breathing motion',
  'uneven polyrhythmic motion',
  'staggered cyclical motion',
  'nervous syncopated motion',
  'minimal locked-groove repetition',
  'drifting suspended motion',
  'restless fractured motion',
  'ritual pulse repetition',
  'stuttering stop-start motion',
  'off-grid lopsided pulse',
];

const SPACES = [
  'close dry room',
  'black box studio',
  'abandoned concrete chamber',
  'small resonant tunnel',
  'muted industrial corridor',
  'intimate dead-air booth',
  'wide nocturnal warehouse',
  'airless machine cabinet',
  'sealed rehearsal bunker',
];

const COLORS = [
  'cold blue',
  'charcoal grey',
  'corroded silver',
  'burnt amber',
  'faded chrome',
  'neon white',
  'rust black',
  'acid green',
  'sodium orange',
];

const EXCLUSIONS = [
  'do not use water sounds',
  'do not use ocean ambience',
  'do not use rain recordings',
  'do not use stream textures',
  'do not use any field-recorded nature ambience',
  'do not use whale-like pads or watery whooshes',
  'do not use cinematic swell endings',
  'do not use vocal phrases',
  'do not use meditation ambience',
  'do not use spa or relaxation textures',
];

const STEM_BLUEPRINTS = [
  {
    role: 'low rhythmic foundation',
    palette: 'percussive electronic rhythm',
    instruction:
      'Make it percussive, dry, physical, and pulse-driven. Use drums, impacts, clipped kicks, bass pulses, or machine rhythm. Do not make this ambient.',
  },
  {
    role: 'midrange tonal and voice layer',
    palette: 'tonal melodic and voice-based material',
    instruction:
      'Make it tonal, melodic, or voice-based. Use synthetic voice, chopped syllables, chords, melody fragments, pitched tones, or harmonic movement. Do not make this watery ambience.',
  },
  {
    role: 'high detail texture and glitch layer',
    palette: 'noise texture and glitch detail',
    instruction:
      'Make it sharp, brittle, noisy, and detailed. Use hiss, crackle, distortion, glitch shards, digital errors, or bright synthetic top-end. Do not make this soft ambient wash.',
  },
];

interface GenerateBody {
  walletAddress: string;
  tier: 'standard' | 'pro';
  promptText?: string;
}

function pickFromSeed<T>(items: T[], seed: number, offset: number) {
  return items[Math.abs((seed + offset * 17) % items.length)];
}

function seedFromText(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function buildPrompt(walletAddress: string, tier: 'standard' | 'pro', index = 0) {
  const seed = seedFromText(`${walletAddress}:${tier}:${Date.now()}:${index}`);
  const material = pickFromSeed(MATERIALS, seed, 1);
  const palette = pickFromSeed(PALETTES, seed, 7);
  const motion = pickFromSeed(MOTIONS, seed, 2);
  const space = pickFromSeed(SPACES, seed, 3);
  const color = pickFromSeed(COLORS, seed, 4);
  const exclusionA = pickFromSeed(EXCLUSIONS, seed, 5);
  const exclusionB = pickFromSeed(EXCLUSIONS, seed + 11, 6);

  if (tier === 'standard') {
    return [
      'Create one looping 30-second experimental electronic composition.',
      `Base it on ${palette}. Use ${material} with ${motion}.`,
      `Keep the atmosphere ${color} inside a ${space}.`,
      'Use a wide palette that may include music, voice-like material, tones, melody fragments, rhythm, percussion, and synthetic textures.',
      'Make it synthetic, textural, memorable, and clearly not ambient water music.',
      'Favor contrast, motion, and identifiable sonic character over soft ambience.',
      exclusionA,
      exclusionB,
    ].join(' ');
  }

  const blueprint = STEM_BLUEPRINTS[index] ?? STEM_BLUEPRINTS[0];

  return [
    `Create one looping 30-second stem for a three-stem spatial composition: ${blueprint.role}.`,
    `This stem must belong clearly to the sound family: ${blueprint.palette}.`,
    `Base it on ${palette}. Use ${material} with ${motion}.`,
    `Keep the atmosphere ${color} inside a ${space}.`,
    blueprint.instruction,
    'Use a wide palette that may include music, voice-like material, tones, melody fragments, rhythm, percussion, and synthetic textures.',
    'The stem must stand alone clearly and also combine with the other stems without turning into ambient wash.',
    'Keep the sound synthetic, sharply characterized, and obviously different from the other stem families.',
    exclusionA,
    exclusionB,
  ].join(' ');
}

router.post('/', async (req: Request, res: Response) => {
  const { walletAddress, tier, promptText } = req.body as GenerateBody;

  if (!walletAddress || !tier) {
    res.status(400).json({ error: 'walletAddress and tier are required' });
    return;
  }

  if (tier !== 'standard' && tier !== 'pro') {
    res.status(400).json({ error: 'tier must be standard or pro' });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'elevenlabs api key not configured' });
    return;
  }

  try {
    const generationPrompt = promptText?.trim();

    if (tier === 'standard') {
      const audio = await generateStem(
        apiKey,
        generationPrompt || buildPrompt(walletAddress, tier, 0)
      );

      // cache raw base64 for the upload step
      setCachedAudio(walletAddress, [audio.raw], tier);

      res.json({ url: audio.dataUrl, waveform: audio.waveform });
    } else {
      // pro: 3 parallel stem generations
      const stems = await Promise.all([
        generateStem(apiKey, generationPrompt || buildPrompt(walletAddress, tier, 0)),
        generateStem(apiKey, generationPrompt || buildPrompt(walletAddress, tier, 1)),
        generateStem(apiKey, generationPrompt || buildPrompt(walletAddress, tier, 2)),
      ]);

      // cache all stems for the upload step
      setCachedAudio(walletAddress, stems.map((s) => s.raw), tier);

      res.json({
        urls: stems.map((s) => s.dataUrl),
        waveforms: stems.map((s) => s.waveform),
      });
    }
  } catch (err) {
    console.error('generation error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'generation failed',
    });
  }
});

async function generateStem(
  apiKey: string,
  promptText: string
): Promise<{ dataUrl: string; raw: string; waveform: number[] }> {
  const response = await fetch(ELEVENLABS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: promptText,
      duration_seconds: 30,
      prompt_influence: 0.85,
      loop: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`elevenlabs api error: ${response.status} — ${body}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = Buffer.from(buffer);
  const base64 = bytes.toString('base64');
  return {
    dataUrl: `data:audio/mpeg;base64,${base64}`,
    raw: base64,
    waveform: extractWaveform(bytes),
  };
}

function extractWaveform(buffer: Buffer, points = 64): number[] {
  if (buffer.length === 0) {
    return Array.from({ length: points }, () => 0.2);
  }

  const chunkSize = Math.max(1, Math.floor(buffer.length / points));

  return Array.from({ length: points }, (_, index) => {
    const start = index * chunkSize;
    const end = Math.min(buffer.length, start + chunkSize);

    if (start >= buffer.length) {
      return 0.2;
    }

    let total = 0;
    for (let i = start; i < end; i += 1) {
      total += Math.abs(buffer[i] - 128);
    }

    const average = total / Math.max(1, end - start);
    const normalized = Math.max(0.16, Math.min(1, average / 96));
    return Number(normalized.toFixed(3));
  });
}

export { router as generateRouter };
