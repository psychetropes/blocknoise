import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

interface UploadBody {
  walletAddress: string;
  tier: 'standard' | 'pro';
  genre: string;
  txSignature: string;
  spatialPath?: unknown;
}

router.post('/', async (req: Request, res: Response) => {
  const { walletAddress, tier, genre, txSignature, spatialPath } =
    req.body as UploadBody;

  if (!walletAddress || !tier || !genre || !txSignature) {
    res.status(400).json({ error: 'missing required fields' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: 'supabase not configured' });
    return;
  }

  try {
    // todo: verify transaction on-chain using txSignature
    // todo: upload mp3 to arweave via irys
    // todo: upload metadata json to arweave
    // todo: mint nft via metaplex with arweave uri

    // placeholder arweave urls — will be replaced with real irys uploads
    const arweaveUrl = `ar://placeholder_${walletAddress.slice(0, 8)}`;
    const metadataUrl = `ar://metadata_${walletAddress.slice(0, 8)}`;
    const mintAddress = `mint_${walletAddress.slice(0, 8)}`;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.from('usis').insert({
      wallet_address: walletAddress,
      arweave_url: arweaveUrl,
      metadata_url: metadataUrl,
      mint_address: mintAddress,
      tier,
      genre,
      spatial_path: spatialPath ?? null,
    }).select().single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'one mint per wallet — already minted' });
        return;
      }
      throw error;
    }

    res.json({
      id: data.id,
      mintAddress,
      arweaveUrl,
      metadataUrl,
    });
  } catch (err) {
    console.error('upload error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'upload failed',
    });
  }
});

export { router as uploadRouter };
