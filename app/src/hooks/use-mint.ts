import { useState, useCallback } from 'react';
import { useAppStore } from '../store';
import { useWallet } from './use-wallet';
import { getConnection, buildPaymentTransaction } from '../services/solana';
import { fetchPrices } from '../services/pricing';

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
  const { signAndSendTransaction } = useWallet();
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mint = useCallback(
    async (
      paymentMethod: 'usdc' | 'sol' | 'skr',
      spatialPath?: unknown
    ): Promise<MintResult | null> => {
      if (!wallet.publicKey || !generation.genre) {
        setError('wallet not connected or genre not selected');
        return null;
      }

      setMinting(true);
      setError(null);

      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        const connection = getConnection();

        // fetch live prices — never cache longer than 60s
        const prices = await fetchPrices();

        // usd-pegged pricing
        const usdAmount = generation.tier === 'pro' ? 20 : 10;

        // build payment transaction for chosen method
        const transaction = await buildPaymentTransaction(
          wallet.publicKey,
          paymentMethod,
          usdAmount,
          prices
        );

        // sign and send via mwa on seeker device
        const signature = await signAndSendTransaction(transaction, connection);

        // wait for on-chain confirmation
        await connection.confirmTransaction(signature as string, 'confirmed');

        // upload to arweave + mint nft + save to supabase
        const uploadRes = await fetch(`${apiUrl}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: wallet.publicKey.toBase58(),
            tier: generation.tier,
            genre: generation.genre,
            txSignature: signature,
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
    [wallet.publicKey, generation.genre, generation.tier, signAndSendTransaction]
  );

  return { mint, minting, error };
}
