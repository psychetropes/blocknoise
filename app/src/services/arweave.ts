// arweave upload service — uploads go through the server which handles irys

const getApiUrl = () => process.env.EXPO_PUBLIC_API_URL ?? '';

interface UploadParams {
  walletAddress: string;
  tier: 'standard' | 'pro';
  genre: string;
  txSignature: string;
  spatialPath?: unknown;
}

interface UploadResult {
  id: string;
  mintAddress: string;
  arweaveUrl: string;
  metadataUrl: string;
}

export async function uploadToArweave(params: UploadParams): Promise<UploadResult> {
  const res = await fetch(`${getApiUrl()}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `upload failed: ${res.status}`);
  }

  return res.json();
}
