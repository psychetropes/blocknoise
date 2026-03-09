// environment configuration — switch between devnet and mainnet

export const config = {
  // set to 'mainnet' for production
  network: (process.env.EXPO_PUBLIC_SOLANA_NETWORK ?? 'devnet') as 'devnet' | 'mainnet',
  demoMode:
    process.env.EXPO_PUBLIC_DEMO_MODE === 'true' ||
    !process.env.EXPO_PUBLIC_API_URL,
  fixedTestStems:
    process.env.EXPO_PUBLIC_FIXED_TEST_STEMS !== 'false',

  get rpcUrl() {
    return this.network === 'mainnet'
      ? (process.env.EXPO_PUBLIC_SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com')
      : 'https://api.devnet.solana.com';
  },

  get irysUrl() {
    return this.network === 'mainnet'
      ? 'https://node1.irys.xyz'
      : 'https://devnet.irys.xyz';
  },

  get solanaCluster() {
    return this.network === 'mainnet' ? 'mainnet-beta' : 'devnet';
  },
} as const;
