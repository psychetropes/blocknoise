import { Router, Request, Response } from 'express';

const router = Router();

const JUPITER_PRICE_API = 'https://lite-api.jup.ag/price/v3';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const SKR_MINT = 'SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3';

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

interface JupiterPriceEntry {
  usdPrice?: number;
  price?: number | string;
}

function readUsdPrice(
  payload: Record<string, JupiterPriceEntry> | undefined,
  key: string
): number {
  const entry = payload?.[key];
  if (!entry) return 0;

  if (typeof entry.usdPrice === 'number') {
    return entry.usdPrice;
  }

  if (typeof entry.price === 'number') {
    return entry.price;
  }

  if (typeof entry.price === 'string') {
    const parsed = Number(entry.price);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    // check cache
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
      res.json(priceCache.data);
      return;
    }

    const response = await fetch(`${JUPITER_PRICE_API}?ids=${SOL_MINT},${SKR_MINT}`);

    if (!response.ok) {
      throw new Error(`jupiter api error: ${response.status}`);
    }

    const jupiterData = (await response.json()) as {
      data?: Record<string, JupiterPriceEntry>;
    } & Record<string, JupiterPriceEntry>;

    const payload = jupiterData.data ?? jupiterData;
    const solPrice = readUsdPrice(payload, SOL_MINT);
    const skrPrice = readUsdPrice(payload, SKR_MINT);

    if (!solPrice || !skrPrice) {
      throw new Error('jupiter returned incomplete price data');
    }

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
