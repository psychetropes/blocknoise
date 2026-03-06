import { useState, useCallback } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useAppStore } from '../store';
import { useWallet } from './use-wallet';

interface MintResult {
  mintAddress: string;
  arweaveUrl: string;
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
        const rpcUrl = process.env.EXPO_PUBLIC_SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');

        // fetch live price
        const priceRes = await fetch(`${apiUrl}/price`);
        const priceData = await priceRes.json();

        // todo: build proper spl-token transfer for usdc/skr
        // for now, build a sol transfer as placeholder
        const usdAmount = generation.tier === 'pro' ? 20 : 10;
        const solAmount = usdAmount / priceData.solUsd;

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey('11111111111111111111111111111112'), // placeholder treasury
            lamports: Math.ceil(solAmount * LAMPORTS_PER_SOL),
          })
        );

        transaction.recentBlockhash = (
          await connection.getLatestBlockhash()
        ).blockhash;
        transaction.feePayer = wallet.publicKey;

        // sign and send via mwa
        const signature = await signAndSendTransaction(transaction, connection);

        // upload to arweave
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
          throw new Error('upload failed');
        }

        const result = await uploadRes.json();
        return result;
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
