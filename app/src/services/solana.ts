import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const getRpcUrl = () =>
  process.env.EXPO_PUBLIC_SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com';

export function getConnection(): Connection {
  return new Connection(getRpcUrl(), 'confirmed');
}

export async function buildPaymentTransaction(
  fromPubkey: PublicKey,
  treasuryPubkey: PublicKey,
  solAmount: number
): Promise<Transaction> {
  const connection = getConnection();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: treasuryPubkey,
      lamports: Math.ceil(solAmount * LAMPORTS_PER_SOL),
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  return transaction;
}
