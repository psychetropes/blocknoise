const getApiUrl = () => process.env.EXPO_PUBLIC_API_URL ?? '';

interface PriceData {
  sol: number;
  usdc: number;
  skr: number;
  solUsd: number;
  skrUsd: number;
}

export async function fetchPrices(): Promise<PriceData> {
  const res = await fetch(`${getApiUrl()}/price`);
  if (!res.ok) {
    throw new Error('failed to fetch prices');
  }
  return res.json();
}

export function calculatePaymentAmount(
  usdPrice: number,
  paymentMethod: 'usdc' | 'sol' | 'skr',
  prices: PriceData
): { amount: number; display: string } {
  const effectivePrice = paymentMethod === 'skr' ? usdPrice / 2 : usdPrice;

  switch (paymentMethod) {
    case 'usdc':
      return { amount: effectivePrice, display: `${effectivePrice} usdc` };
    case 'sol': {
      const solAmount = effectivePrice / prices.solUsd;
      return { amount: solAmount, display: `${solAmount.toFixed(4)} sol` };
    }
    case 'skr': {
      const skrAmount = effectivePrice / prices.skrUsd;
      return { amount: skrAmount, display: `${skrAmount.toFixed(2)} skr` };
    }
  }
}
