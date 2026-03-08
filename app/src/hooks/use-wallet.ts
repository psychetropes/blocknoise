import { useCallback } from 'react';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  PublicKey,
  Transaction,
  Connection,
} from '@solana/web3.js';
import { useAppStore } from '../store';
import { config } from '../config';

const APP_IDENTITY = {
  name: 'blocknoise',
  uri: 'https://blocknoise.io',
  icon: 'favicon.ico',
};

export function useWallet() {
  const { wallet, setWallet } = useAppStore();

  const connect = useCallback(async () => {
    setWallet({ connecting: true });
    try {
      await transact(async (mobileWallet: Web3MobileWallet) => {
        const authResult = await mobileWallet.authorize({
          cluster: config.solanaCluster,
          identity: APP_IDENTITY,
        });
        const pubkey = new PublicKey(authResult.accounts[0].address);
        setWallet({ publicKey: pubkey, connected: true, connecting: false });
      });
    } catch {
      setWallet({ connecting: false });
      throw new Error('wallet connection failed');
    }
  }, [setWallet]);

  const disconnect = useCallback(() => {
    setWallet({ publicKey: null, connected: false, connecting: false });
  }, [setWallet]);

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction, connection: Connection) => {
      return transact(async (mobileWallet: Web3MobileWallet) => {
        await mobileWallet.authorize({
          cluster: config.solanaCluster,
          identity: APP_IDENTITY,
        });

        const signedTxs = await mobileWallet.signAndSendTransactions({
          transactions: [transaction],
        });

        return signedTxs[0];
      });
    },
    []
  );

  return {
    ...wallet,
    connect,
    disconnect,
    signAndSendTransaction,
  };
}
