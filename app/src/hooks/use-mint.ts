import { useState, useCallback } from 'react';
import { useAppStore } from '../store';
import { config } from '../config';
import { DEMO_AUDIO_URLS } from '../demo';

interface MintResult {
  id: string;
  catalogNumber: number;
  displayName: string | null;
  mintAddress: string;
  arweaveUrl: string;
  metadataUrl: string;
  stemUrls?: string[];
}

export function useMint() {
  const { wallet, generation } = useAppStore();
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mint = useCallback(
    async (
      paymentMethod: 'usdc' | 'sol' | 'skr',
      spatialPath?: unknown
    ): Promise<MintResult | null> => {
      if (!wallet.publicKey || !generation.genre || !generation.paymentSignature) {
        setError('wallet, genre, or payment not ready');
        return null;
      }

      setMinting(true);
      setError(null);

      try {
        if (config.demoMode || config.network !== 'mainnet') {
          return {
            id: `demo-${Date.now()}`,
            catalogNumber: Math.floor(Date.now() / 1000),
            displayName: generation.genre,
            mintAddress: wallet.publicKey.toBase58(),
            arweaveUrl: generation.audioUrl ?? DEMO_AUDIO_URLS.standard,
            metadataUrl: 'https://example.com/blocknoise-demo.json',
            stemUrls: generation.stemUrls.length > 0 ? generation.stemUrls : undefined,
          };
        }

        const apiUrl = process.env.EXPO_PUBLIC_API_URL;

        // upload to arweave + mint nft + save to supabase
        const uploadRes = await fetch(`${apiUrl}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: wallet.publicKey.toBase58(),
            tier: generation.tier,
            genre: generation.genre,
            txSignature: generation.paymentSignature,
            spatialPath: spatialPath ?? null,
          }),
        });

        if (!uploadRes.ok) {
          const body = await uploadRes.text();
          throw new Error(body || 'upload failed');
        }

        return (await uploadRes.json()) as MintResult;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'mint failed';
        setError(msg);
        return null;
      } finally {
        setMinting(false);
      }
    },
    [wallet.publicKey, generation.genre, generation.paymentSignature, generation.tier]
  );

  return { mint, minting, error };
}
