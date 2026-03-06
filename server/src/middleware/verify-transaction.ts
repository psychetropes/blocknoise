import { Request, Response, NextFunction } from 'express';
import { Connection } from '@solana/web3.js';

export async function verifyTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { txSignature } = req.body;

  if (!txSignature) {
    res.status(400).json({ error: 'transaction signature required' });
    return;
  }

  try {
    const rpcUrl =
      process.env.SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    const tx = await connection.getTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      res.status(404).json({ error: 'transaction not found on-chain' });
      return;
    }

    if (tx.meta?.err) {
      res.status(400).json({ error: 'transaction failed on-chain' });
      return;
    }

    next();
  } catch (err) {
    console.error('transaction verification error:', err);
    res.status(500).json({ error: 'failed to verify transaction' });
  }
}
