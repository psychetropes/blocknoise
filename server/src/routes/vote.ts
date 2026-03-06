import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';

const router = Router();

// skr token mint address (solana mainnet)
const SKR_MINT = 'SKRu3tAuSFsFbcBYcBFBYeRe7M2GGFMTqWELN7epump';

interface VoteBody {
  usiId: string;
  voterWallet: string;
}

router.post('/', async (req: Request, res: Response) => {
  const { usiId, voterWallet } = req.body as VoteBody;

  if (!usiId || !voterWallet) {
    res.status(400).json({ error: 'usiId and voterWallet are required' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: 'supabase not configured' });
    return;
  }

  try {
    // check if voter holds skr tokens
    const rpcUrl = process.env.SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    let voterHasSkr = false;

    try {
      const pubkey = new PublicKey(voterWallet);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        pubkey,
        { mint: new PublicKey(SKR_MINT) }
      );
      voterHasSkr = tokenAccounts.value.some(
        (ta) =>
          ta.account.data.parsed.info.tokenAmount.uiAmount > 0
      );
    } catch {
      // if rpc fails, default to no skr
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('votes').insert({
      usi_id: usiId,
      voter_wallet: voterWallet,
      voter_has_skr: voterHasSkr,
    });

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'already voted for this usi' });
        return;
      }
      throw error;
    }

    res.json({ success: true, skrWeighted: voterHasSkr });
  } catch (err) {
    console.error('vote error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'vote failed',
    });
  }
});

export { router as voteRouter };
