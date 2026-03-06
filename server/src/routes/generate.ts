import { Router, Request, Response } from 'express';

const router = Router();

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/sound-generation';

interface GenerateBody {
  walletAddress: string;
  tier: 'standard' | 'pro';
}

router.post('/', async (req: Request, res: Response) => {
  const { walletAddress, tier } = req.body as GenerateBody;

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
    if (tier === 'standard') {
      const audio = await generateStem(apiKey, walletAddress, 1);
      res.json({ url: audio });
    } else {
      // pro: 3 parallel stem generations
      const stems = await Promise.all([
        generateStem(apiKey, walletAddress, 1),
        generateStem(apiKey, walletAddress, 2),
        generateStem(apiKey, walletAddress, 3),
      ]);
      res.json({ urls: stems });
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
  walletAddress: string,
  layer: number
): Promise<string> {
  const response = await fetch(ELEVENLABS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: `${walletAddress}_layer${layer}`,
      duration_seconds: 30,
      prompt_influence: 0.3,
      loop: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`elevenlabs api error: ${response.status} — ${body}`);
  }

  // elevenlabs returns audio binary — convert to base64 data url
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:audio/mpeg;base64,${base64}`;
}

export { router as generateRouter };
