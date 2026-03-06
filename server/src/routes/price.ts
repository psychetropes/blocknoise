import { Router, Request, Response } from 'express';

const router = Router();

const JUPITER_PRICE_API = 'https://price.jup.ag/v6/price';

// cache prices for max 60 seconds
let priceCache: { data: PriceResponse; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

interface PriceResponse {
  sol: number;
  usdc: number;
  skr: number;
  solUsd: number;
  skrUsd: number;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    // check cache
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
      res.json(priceCache.data);
      return;
    }

    const response = await fetch(
      `${JUPITER_PRICE_API}?ids=SOL,SKRu3tAuSFsFbcBYcBFBYeRe7M2GGFMTqWELN7epump`
    );

    if (!response.ok) {
      throw new Error(`jupiter api error: ${response.status}`);
    }

    const jupiterData = (await response.json()) as {
      data?: Record<string, { price?: number }>;
    };

    const solPrice = jupiterData.data?.SOL?.price ?? 0;
    const skrPrice =
      jupiterData.data?.['SKRu3tAuSFsFbcBYcBFBYeRe7M2GGFMTqWELN7epump']?.price ?? 0;

    const data: PriceResponse = {
      sol: solPrice,
      usdc: 1,
      skr: skrPrice,
      solUsd: solPrice,
      skrUsd: skrPrice,
    };

    priceCache = { data, timestamp: Date.now() };
    res.json(data);
  } catch (err) {
    console.error('price error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'failed to fetch prices',
    });
  }
});

export { router as priceRouter };
