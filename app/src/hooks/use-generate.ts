import { useState, useCallback } from 'react';
import { useAppStore } from '../store';

export function useGenerate() {
  const { wallet, generation, setGeneration } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!wallet.publicKey) {
      setError('wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.publicKey.toBase58(),
          tier: generation.tier,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `generation failed: ${res.status}`);
      }

      const data = await res.json();

      if (generation.tier === 'standard') {
        setGeneration({ audioUrl: data.url });
      } else {
        setGeneration({ stemUrls: data.urls });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'generation failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, generation.tier, setGeneration]);

  return { generate, loading, error };
}
