// metaplex nft metadata types
// metadata is now built server-side in upload.ts with pre-allocated catalog numbers
// this file provides the type definition for reference

export interface NftMetadata {
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
    stem_count: number;
  };
}
