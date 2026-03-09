import { config } from '../config';
import { DEMO_PRICES } from '../demo';

const getApiUrl = () => process.env.EXPO_PUBLIC_API_URL ?? '';
const JUPITER_PRICE_API = 'https://lite-api.jup.ag/price/v3';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const SKR_MINT = 'SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3';

export interface PriceData {
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

async function fetchJupiterPrices(): Promise<PriceData> {
  const res = await fetch(`${JUPITER_PRICE_API}?ids=${SOL_MINT},${SKR_MINT}`);
  if (!res.ok) {
    throw new Error('failed to fetch live prices');
  }

  const jupiterData = (await res.json()) as {
    data?: Record<string, JupiterPriceEntry>;
  } & Record<string, JupiterPriceEntry>;

  const payload = jupiterData.data ?? jupiterData;
  const solUsd = readUsdPrice(payload, SOL_MINT);
  const skrUsd = readUsdPrice(payload, SKR_MINT);

  if (!solUsd || !skrUsd) {
    throw new Error('live price response was incomplete');
  }

  return {
    sol: solUsd,
    usdc: 1,
    skr: skrUsd,
    solUsd,
    skrUsd,
  };
}

export async function fetchPrices(): Promise<PriceData> {
  const apiUrl = getApiUrl();

  if (apiUrl) {
    const res = await fetch(`${apiUrl}/price`);
    if (!res.ok) {
      throw new Error('failed to fetch prices');
    }
    return res.json();
  }

  try {
    return await fetchJupiterPrices();
  } catch {
    if (config.demoMode) {
      return { ...DEMO_PRICES };
    }
    throw new Error('failed to fetch prices');
  }
}

export function calculatePaymentAmount(
  usdPrice: number,
  paymentMethod: 'usdc' | 'sol' | 'skr',
  prices: PriceData
): { amount: number; display: string } {
  switch (paymentMethod) {
    case 'usdc':
      return { amount: usdPrice, display: `${usdPrice.toFixed(2)} usdc` };
    case 'sol': {
      const solAmount = usdPrice / prices.solUsd;
      return { amount: solAmount, display: `${solAmount.toFixed(4)} sol` };
    }
    case 'skr': {
      const skrAmount = usdPrice / prices.skrUsd;
      return { amount: skrAmount, display: `${skrAmount.toFixed(2)} skr` };
    }
  }
}
