import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Irys from '@irys/sdk';
import { getCachedAudio, clearCachedAudio } from '../audio-cache';
import { reverseSnsLookup } from '../sns';

const router = Router();

// treasury wallet — must match client-side EXPO_PUBLIC_TREASURY_ADDRESS
const TREASURY = process.env.TREASURY_ADDRESS;

interface UploadBody {
  walletAddress: string;
  tier: 'standard' | 'pro';
  genre: string;
  txSignature: string;
  spatialPath?: unknown;
  displayName?: string;
}

async function getIrys(): Promise<Irys> {
  const rpcUrl = process.env.SOLANA_RPC ?? 'https://api.devnet.solana.com';
  const network = process.env.SOLANA_NETWORK ?? 'devnet';
  const irysUrl =
    network === 'mainnet'
      ? 'https://node1.irys.xyz'
      : 'https://devnet.irys.xyz';

  const walletKey = process.env.IRYS_WALLET_KEY;
  if (!walletKey) {
    throw new Error('IRYS_WALLET_KEY not configured — cannot upload to arweave');
  }

  const irys = new Irys({
    url: irysUrl,
    token: 'solana',
    key: walletKey,
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

/**
 * Verify that a transaction:
 * 1. Exists on-chain and succeeded
 * 2. Was sent FROM the claimed wallet
 * 3. Has not already been used for a previous mint (replay protection)
 */
async function verifyPayment(
  connection: Connection,
  txSignature: string,
  walletAddress: string,
  supabase: ReturnType<typeof createClient<any>>
): Promise<{ valid: boolean; error?: string }> {
  // check for replay — has this tx signature already been used?
  const { data: existing } = await supabase
    .from('usis')
    .select('id')
    .eq('mint_address', txSignature)
    .maybeSingle();

  if (existing) {
    return { valid: false, error: 'transaction signature already used' };
  }

  // fetch transaction from chain
  const tx = await connection.getTransaction(txSignature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    return { valid: false, error: 'transaction not found on-chain' };
  }

  if (tx.meta?.err) {
    return { valid: false, error: 'transaction failed on-chain' };
  }

  // verify the sender matches the claimed wallet
  const accountKeys = tx.transaction.message.getAccountKeys();
  const feePayer = accountKeys.get(0)?.toBase58();
  if (feePayer !== walletAddress) {
    return { valid: false, error: 'transaction sender does not match wallet' };
  }

  // verify payment went to treasury (if treasury is configured)
  if (TREASURY) {
    const treasuryKey = new PublicKey(TREASURY);
    let treasuryFound = false;

    // check if treasury is in the account keys (SOL transfer or token destination)
    for (let i = 0; i < accountKeys.length; i++) {
      const key = accountKeys.get(i);
      if (key && key.equals(treasuryKey)) {
        treasuryFound = true;
        break;
      }
    }

    if (!treasuryFound) {
      return { valid: false, error: 'payment not sent to treasury' };
    }
  }

  return { valid: true };
}

router.post('/', async (req: Request, res: Response) => {
  const { walletAddress, tier, genre, txSignature, spatialPath, displayName } =
    req.body as UploadBody;

  if (!walletAddress || !tier || !genre || !txSignature) {
    res.status(400).json({ error: 'missing required fields' });
    return;
  }

  if (tier !== 'standard' && tier !== 'pro') {
    res.status(400).json({ error: 'invalid tier' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: 'supabase not configured' });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // verify transaction on-chain with full payment validation
    const rpcUrl = process.env.SOLANA_RPC ?? 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    const verification = await verifyPayment(
      connection,
      txSignature,
      walletAddress,
      supabase
    );

    if (!verification.valid) {
      res.status(400).json({ error: verification.error });
      return;
    }

    // retrieve cached audio from the generate step
    const cached = getCachedAudio(walletAddress);
    if (!cached) {
      res.status(400).json({ error: 'no generated audio found — generate first' });
      return;
    }

    // pre-allocate catalog number so it's baked into permanent arweave metadata
    const { data: seqRow, error: seqError } = await supabase.rpc('next_catalog_number');
    if (seqError) throw new Error(`failed to allocate catalog number: ${seqError.message}`);
    const catalogNumber = Number(seqRow);

    // resolve .skr / .sol display name — best-effort, never blocks minting
    const snsName = displayName ?? await reverseSnsLookup(walletAddress);

    // upload audio stems to arweave via irys
    let stemArweaveTxIds: string[] = [];
    let arweaveTxId: string;

    if (tier === 'pro' && cached.data.length > 1) {
      // pro: upload all stems in parallel
      const uploadPromises = cached.data.map((stemData, i) => {
        const stemBuffer = Buffer.from(stemData, 'base64');
        return uploadToArweave(stemBuffer, 'audio/mpeg', [
          { name: 'Wallet', value: walletAddress },
          { name: 'Tier', value: tier },
          { name: 'Catalog', value: String(catalogNumber) },
          { name: 'Stem-Index', value: String(i) },
        ]);
      });
      stemArweaveTxIds = await Promise.all(uploadPromises);
      arweaveTxId = stemArweaveTxIds[0];
    } else {
      // standard: upload single track
      const audioBuffer = Buffer.from(cached.data[0], 'base64');
      arweaveTxId = await uploadToArweave(audioBuffer, 'audio/mpeg', [
        { name: 'Wallet', value: walletAddress },
        { name: 'Tier', value: tier },
        { name: 'Catalog', value: String(catalogNumber) },
      ]);
    }

    // build nft metadata — catalog number is permanent on arweave
    const walletShort = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
    const displayLabel = snsName ?? walletShort;
    const stemUrls = stemArweaveTxIds.map((id) => `ar://${id}`);

    const metadata = {
      name: `#blocknoise#${catalogNumber} — ${displayLabel}`,
      description: `unique sound identifier #blocknoise#${catalogNumber} generated from solana wallet ${walletAddress}. part of the blocknoise research project — a psyché tropes imprint.`,
      image: 'https://blocknoise.io/cover.png',
      animation_url: `ar://${arweaveTxId}`,
      external_url: 'https://blocknoise.io',
      attributes: [
        { trait_type: 'catalog', value: String(catalogNumber) },
        { trait_type: 'tier', value: tier },
        { trait_type: 'genre', value: genre },
        { trait_type: 'season', value: '1' },
        { trait_type: 'wallet', value: walletAddress },
        ...(snsName ? [{ trait_type: 'domain', value: snsName }] : []),
      ],
      properties: {
        files:
          stemArweaveTxIds.length > 0
            ? stemArweaveTxIds.map((id) => ({
                uri: `ar://${id}`,
                type: 'audio/mpeg',
              }))
            : [{ uri: `ar://${arweaveTxId}`, type: 'audio/mpeg' }],
        category: 'audio',
        spatial_path: spatialPath ?? null,
        stem_count: tier === 'pro' ? cached.data.length : 1,
      },
    };

    // upload metadata json to arweave
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const metadataTxId = await uploadToArweave(metadataBuffer, 'application/json', [
      { name: 'Wallet', value: walletAddress },
      { name: 'Type', value: 'metadata' },
      { name: 'Catalog', value: String(catalogNumber) },
    ]);

    const arweaveUrl = `ar://${arweaveTxId}`;
    const metadataUrl = `ar://${metadataTxId}`;

    // save to supabase with pre-allocated catalog number + display name
    const { data, error } = await supabase
      .from('usis')
      .insert({
        wallet_address: walletAddress,
        arweave_url: arweaveUrl,
        metadata_url: metadataUrl,
        mint_address: txSignature,
        tier,
        genre,
        spatial_path: spatialPath ?? null,
        stem_urls: stemUrls.length > 0 ? stemUrls : null,
        catalog_number: catalogNumber,
        display_name: snsName ?? null,
      })
      .select('*, catalog_number, display_name')
      .single();

    if (error) throw error;

    // H6 fix: clear cache AFTER successful Supabase insert
    clearCachedAudio(walletAddress);

    res.json({
      id: data.id,
      catalogNumber: data.catalog_number,
      displayName: data.display_name ?? null,
      mintAddress: txSignature,
      arweaveUrl,
      metadataUrl,
      stemUrls: stemUrls.length > 0 ? stemUrls : undefined,
    });
  } catch (err) {
    console.error('upload error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'upload failed',
    });
  }
});

export { router as uploadRouter };
