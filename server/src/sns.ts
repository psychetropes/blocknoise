import { Connection, PublicKey } from '@solana/web3.js';

// solana name service program ids
const NAME_PROGRAM_ID = new PublicKey('namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX');
const SNS_RECORDS_CLASS = new PublicKey('2KBwVqpRGMRsFERRjNGSTev7mDUkEcxQzYhMnCNeedge');

// .sol tld parent — sns registry root
const SOL_TLD_AUTHORITY = new PublicKey('58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx');

/**
 * attempt reverse lookup of a solana public key to find a .sol or .skr domain.
 * returns the domain string (e.g. "artist.skr") or null if none found.
 * never throws — returns null on any failure so it never blocks minting.
 */
export async function reverseSnsLookup(
  walletAddress: string,
  rpcUrl?: string
): Promise<string | null> {
  try {
    const connection = new Connection(
      rpcUrl ?? process.env.SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com'
    );
    const owner = new PublicKey(walletAddress);

    // fetch all name service accounts owned by this wallet
    const accounts = await connection.getProgramAccounts(NAME_PROGRAM_ID, {
      filters: [
        { memcmp: { offset: 32, bytes: owner.toBase58() } },
      ],
    });

    if (accounts.length === 0) return null;

    // find the first .skr or .sol domain
    for (const account of accounts) {
      const data = account.account.data;
      if (data.length < 96) continue;

      // name service account layout:
      // 0-32: parent name hash
      // 32-64: owner
      // 64-96: class
      // 96+: name data (length-prefixed string)
      const nameLen = data.readUInt32LE(96);
      if (nameLen === 0 || nameLen > 100) continue;

      const nameBytes = data.subarray(100, 100 + nameLen);
      const name = Buffer.from(nameBytes).toString('utf-8').replace(/\0/g, '');

      if (!name || name.length === 0) continue;

      // check parent key to determine tld
      const parentKey = new PublicKey(data.subarray(0, 32));

      // return first valid domain found — prefer .skr
      if (name.endsWith('.skr') || parentKey.equals(SOL_TLD_AUTHORITY)) {
        return name.includes('.') ? name : `${name}.sol`;
      }
    }

    return null;
  } catch {
    // sns lookup is best-effort — never block minting
    return null;
  }
}
