import { Router, Request, Response } from 'express';
import { setCachedAudio } from '../audio-cache';

const router = Router();

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/sound-generation';
const MAX_PROMPT_LENGTH = 440;

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
  'rubbery bass stabs',
  'synthetic choir swells',
  'shredded guitar particles',
  'FM bell tones',
  'sequenced arpeggio fragments',
  'vocoder breaths',
  'sub bass throbs',
  'contact-mic rattles',
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
  'minimal techno tools',
  'broken pop abstraction',
  'mechanical dub pulses',
  'mutant club rhythm',
  'digital chamber music',
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
  'bone white',
  'violet black',
  'toxic yellow',
];

const STRUCTURES = [
  'tight loop with one strong recurring motif',
  'asymmetric loop with unstable accents',
  'evolving loop with one sudden rupture',
  'call-and-response loop with contrasting layers',
  'minimal loop with aggressive negative space',
  'dense loop with interlocking fragments',
];

const TEMPOS = [
  'slow',
  'mid-tempo',
  'fast',
  'lurching',
  'stuttering',
  'driving',
];

const ENERGY = [
  'tense',
  'playful',
  'ominous',
  'euphoric',
  'mechanical',
  'unsettled',
];

const EXCLUSIONS = [
  'water',
  'ocean ambience',
  'rain',
  'stream textures',
  'nature ambience',
  'watery whooshes',
  'cinematic swells',
  'vocal phrases',
  'meditation ambience',
  'spa textures',
];

const STEM_BLUEPRINTS = [
  {
    role: 'low rhythmic foundation',
    palette: 'percussive electronic rhythm',
    instruction: 'Percussive, dry, pulse-driven, and non-ambient.',
  },
  {
    role: 'midrange tonal and voice layer',
    palette: 'tonal melodic and voice-based material',
    instruction: 'Tonal, melodic, or voice-led with clear pitch movement.',
  },
  {
    role: 'high detail texture and glitch layer',
    palette: 'noise texture and glitch detail',
    instruction: 'Sharp, brittle, noisy, detailed, and never a soft wash.',
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
  const structure = pickFromSeed(STRUCTURES, seed, 8);
  const tempo = pickFromSeed(TEMPOS, seed, 9);
  const energy = pickFromSeed(ENERGY, seed, 10);

  if (tier === 'standard') {
    return clampPrompt([
      'Looping 30-second experimental electronic composition.',
      `${palette}; ${material}; ${motion}; ${structure}.`,
      `${tempo}, ${energy}, ${color}, ${space}.`,
      'Use rhythm, melody, tones, voice, percussion, or glitch.',
      'No water, rain, ocean, nature, spa, or soft ambient wash.',
    ].join(' '));
  }

  const blueprint = STEM_BLUEPRINTS[index] ?? STEM_BLUEPRINTS[0];

  return clampPrompt([
    `Looping 30-second stem for ${blueprint.role}.`,
    `${blueprint.palette}. ${blueprint.instruction}`,
    `${palette}; ${material}; ${motion}; ${structure}.`,
    `${tempo}, ${energy}, ${color}, ${space}.`,
    'Use rhythm, melody, tones, percussion, voice, or glitch.',
    `Avoid ${exclusionA} and ${exclusionB}.`,
  ].join(' '));
}

function clampPrompt(prompt: string) {
  if (prompt.length <= MAX_PROMPT_LENGTH) {
    return prompt;
  }

  return `${prompt.slice(0, MAX_PROMPT_LENGTH - 1).trimEnd()}.`;
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
  console.log('elevenlabs prompt', {
    length: promptText.length,
    preview: promptText.slice(0, 140),
  });

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
