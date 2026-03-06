// metaplex nft minting service
// minting happens server-side after arweave upload — this file contains metadata helpers

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  animation_url: string;
  external_url: string;
  attributes: Array<{ trait_type: string; value: string }>;
  properties: {
    files: Array<{ uri: string; type: string }>;
    category: string;
    spatial_path: unknown;
  };
}

export function buildNftMetadata(params: {
  walletAddress: string;
  arweaveTxId: string;
  tier: 'standard' | 'pro';
  genre: string;
  spatialPath?: unknown;
}): NftMetadata {
  const walletShort = `${params.walletAddress.slice(0, 4)}...${params.walletAddress.slice(-4)}`;
  const arweaveUri = `ar://${params.arweaveTxId}`;

  return {
    name: `blocknoise usi — ${walletShort}`,
    description: `a unique sound identifier generated from solana wallet ${params.walletAddress}. part of the blocknoise research project — a psyché tropes imprint.`,
    image: 'https://blocknoise.xyz/cover.png',
    animation_url: arweaveUri,
    external_url: 'https://blocknoise.xyz',
    attributes: [
      { trait_type: 'tier', value: params.tier },
      { trait_type: 'genre', value: params.genre },
      { trait_type: 'season', value: '1' },
      { trait_type: 'wallet', value: params.walletAddress },
    ],
    properties: {
      files: [{ uri: arweaveUri, type: 'audio/mpeg' }],
      category: 'audio',
      spatial_path: params.spatialPath ?? null,
    },
  };
}
