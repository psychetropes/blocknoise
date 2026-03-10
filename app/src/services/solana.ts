import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

import { config } from '../config';
import { DEMO_WALLET_ADDRESS } from '../demo';

const getRpcUrl = () => config.rpcUrl;

function getTreasury(): PublicKey {
  const treasuryAddress = process.env.EXPO_PUBLIC_TREASURY_ADDRESS;
  if (treasuryAddress) {
    return new PublicKey(treasuryAddress);
  }

  if (config.demoMode) {
    return new PublicKey(DEMO_WALLET_ADDRESS);
  }

  throw new Error(
    'EXPO_PUBLIC_TREASURY_ADDRESS not set — cannot build payment transactions'
  );
}

// token mints
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const SKR_MINT = new PublicKey('SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3');

export function getConnection(): Connection {
  return new Connection(getRpcUrl(), 'confirmed');
}

export async function buildSolPaymentTransaction(
  fromPubkey: PublicKey,
  solAmount: number
): Promise<Transaction> {
  const connection = getConnection();
  const treasury = getTreasury();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: treasury,
      lamports: Math.ceil(solAmount * LAMPORTS_PER_SOL),
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  return transaction;
}

export async function buildTokenPaymentTransaction(
  fromPubkey: PublicKey,
  tokenMint: 'usdc' | 'skr',
  amount: number
): Promise<Transaction> {
  const connection = getConnection();
  const treasury = getTreasury();
  const mint = tokenMint === 'usdc' ? USDC_MINT : SKR_MINT;
  const decimals = tokenMint === 'usdc' ? 6 : 9;

  const fromAta = await getAssociatedTokenAddress(mint, fromPubkey);
  const toAta = await getAssociatedTokenAddress(mint, treasury);

  const rawAmount = Math.ceil(amount * 10 ** decimals);

  const transaction = new Transaction().add(
    createTransferInstruction(
      fromAta,
      toAta,
      fromPubkey,
      BigInt(rawAmount),
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  return transaction;
}

export async function buildPaymentTransaction(
  fromPubkey: PublicKey,
  paymentMethod: 'usdc' | 'sol' | 'skr',
  usdAmount: number,
  prices: { solUsd: number; skrUsd: number },
  skrDiscountEligible = false
): Promise<Transaction> {
  const effectiveUsdAmount =
    paymentMethod === 'skr' && skrDiscountEligible ? usdAmount / 2 : usdAmount;

  switch (paymentMethod) {
    case 'sol': {
      const solAmount = effectiveUsdAmount / prices.solUsd;
      return buildSolPaymentTransaction(fromPubkey, solAmount);
    }
    case 'usdc':
      return buildTokenPaymentTransaction(fromPubkey, 'usdc', effectiveUsdAmount);
    case 'skr': {
      const skrAmount = effectiveUsdAmount / prices.skrUsd;
      return buildTokenPaymentTransaction(fromPubkey, 'skr', skrAmount);
    }
  }
}
