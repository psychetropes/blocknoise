import { useState, useCallback } from 'react';
import { useAppStore } from '../store';
import { useWallet } from './use-wallet';
import { getConnection, buildPaymentTransaction } from '../services/solana';
import { fetchDiscountEligibility, fetchPrices } from '../services/pricing';
import { config } from '../config';

export function usePayment() {
  const { wallet, generation, setGeneration } = useAppStore();
  const { signAndSendTransaction } = useWallet();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = useCallback(
    async (paymentMethod: 'usdc' | 'sol' | 'skr'): Promise<string | null> => {
      if (!wallet.publicKey) {
        setError('wallet not connected');
        return null;
      }

      setPaying(true);
      setError(null);

      try {
        if (config.demoMode || config.network !== 'mainnet') {
          const signature = `demo-payment-${Date.now()}`;
          setGeneration({
            paymentMethod,
            paymentSignature: signature,
            stemWaveforms: [],
          });
          return signature;
        }

        const connection = getConnection();
        const prices = await fetchPrices();
        const eligibility = await fetchDiscountEligibility(wallet.publicKey.toBase58());
        const usdAmount = generation.tier === 'pro' ? 20 : 10;
        const transaction = await buildPaymentTransaction(
          wallet.publicKey,
          paymentMethod,
          usdAmount,
          prices,
          eligibility.skrDiscountEligible
        );

        const signature = await signAndSendTransaction(transaction, connection);
        await connection.confirmTransaction(signature as string, 'confirmed');

        setGeneration({
          paymentMethod,
          paymentSignature: signature as string,
          stemWaveforms: [],
        });

        return signature as string;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'payment failed';
        setError(msg);
        return null;
      } finally {
        setPaying(false);
      }
    },
    [wallet.publicKey, generation.tier, setGeneration, signAndSendTransaction]
  );

  return { pay, paying, error };
}
