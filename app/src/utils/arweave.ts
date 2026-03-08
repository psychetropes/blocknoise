const ARWEAVE_GATEWAY = 'https://arweave.net';

/**
 * Resolve ar:// protocol URLs to HTTP gateway URLs.
 * TrackPlayer and expo-av cannot resolve ar:// natively.
 *
 * ar://txId → https://arweave.net/txId
 * https://... → passthrough unchanged
 */
export function resolveArweaveUrl(url: string): string {
  if (url.startsWith('ar://')) {
    return `${ARWEAVE_GATEWAY}/${url.slice(5)}`;
  }
  return url;
}

/**
 * Resolve an array of ar:// URLs to HTTP gateway URLs.
 */
export function resolveArweaveUrls(urls: string[]): string[] {
  return urls.map(resolveArweaveUrl);
}
