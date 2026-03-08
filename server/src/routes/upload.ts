import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Connection } from '@solana/web3.js';
import Irys from '@irys/sdk';
import { getCachedAudio, clearCachedAudio } from '../audio-cache';

const router = Router();

interface UploadBody {
  walletAddress: string;
  tier: 'standard' | 'pro';
  genre: string;
  txSignature: string;
  spatialPath?: unknown;
}

async function getIrys(): Promise<Irys> {
  const rpcUrl = process.env.SOLANA_RPC ?? 'https://api.devnet.solana.com';
  const irys = new Irys({
    url: 'https://devnet.irys.xyz', // switch to 'https://node1.irys.xyz' for mainnet
    token: 'solana',
    config: {
      providerUrl: rpcUrl,
    },
  });
  return irys;
}

async function uploadToArweave(
  data: Buffer,
  contentType: string,
  tags: Array<{ name: string; value: string }>
): Promise<string> {
  const irys = await getIrys();

  const receipt = await irys.upload(data, {
    tags: [
      { name: 'Content-Type', value: contentType },
      { name: 'App-Name', value: 'blocknoise' },
      ...tags,
    ],
  });

  return receipt.id;
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
    // verify transaction on-chain
    const rpcUrl = process.env.SOLANA_RPC ?? 'https://api.devnet.solana.com';
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

    // retrieve cached audio from the generate step
    const cached = getCachedAudio(walletAddress);
    if (!cached) {
      res.status(400).json({ error: 'no generated audio found — generate first' });
      return;
    }

    // upload audio to arweave via irys
    // for standard: upload single track; for pro: concatenate or upload primary
    const audioBuffer = Buffer.from(cached.data[0], 'base64');
    const arweaveTxId = await uploadToArweave(audioBuffer, 'audio/mpeg', [
      { name: 'Wallet', value: walletAddress },
      { name: 'Tier', value: tier },
    ]);

    // build nft metadata
    const walletShort = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
    const metadata = {
      name: `blocknoise usi — ${walletShort}`,
      description: `a unique sound identifier generated from solana wallet ${walletAddress}. part of the blocknoise research project — a psyché tropes imprint.`,
      image: 'https://blocknoise.xyz/cover.png',
      animation_url: `ar://${arweaveTxId}`,
      external_url: 'https://blocknoise.xyz',
      attributes: [
        { trait_type: 'tier', value: tier },
        { trait_type: 'genre', value: genre },
        { trait_type: 'season', value: '1' },
        { trait_type: 'wallet', value: walletAddress },
      ],
      properties: {
        files: [{ uri: `ar://${arweaveTxId}`, type: 'audio/mpeg' }],
        category: 'audio',
        spatial_path: spatialPath ?? null,
      },
    };

    // upload metadata json to arweave
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const metadataTxId = await uploadToArweave(metadataBuffer, 'application/json', [
      { name: 'Wallet', value: walletAddress },
      { name: 'Type', value: 'metadata' },
    ]);

    const arweaveUrl = `ar://${arweaveTxId}`;
    const metadataUrl = `ar://${metadataTxId}`;
    const mintAddress = `mint_${Date.now().toString(36)}`;

    // clear the audio cache after successful upload
    clearCachedAudio(walletAddress);

    // save to supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('usis')
      .insert({
        wallet_address: walletAddress,
        arweave_url: arweaveUrl,
        metadata_url: metadataUrl,
        mint_address: mintAddress,
        tier,
        genre,
        spatial_path: spatialPath ?? null,
      })
      .select()
      .single();

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
