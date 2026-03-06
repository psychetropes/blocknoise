// all elevenlabs calls go through the server — this service wraps the api calls

const getApiUrl = () => process.env.EXPO_PUBLIC_API_URL ?? '';

interface GenerateResult {
  url?: string;
  urls?: string[];
}

export async function generateUsi(
  walletAddress: string,
  tier: 'standard' | 'pro'
): Promise<GenerateResult> {
  const res = await fetch(`${getApiUrl()}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, tier }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `generation failed: ${res.status}`);
  }

  return res.json();
}
