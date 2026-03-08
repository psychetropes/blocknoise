import React, { useCallback } from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';
import { colors } from '../theme';
import { useAppStore } from '../store';
import { config } from '../config';

const APP_IDENTITY = {
  name: 'blocknoise',
  uri: 'https://blocknoise.io',
  icon: 'favicon.ico',
};

export function WalletConnect() {
  const { wallet, setWallet } = useAppStore();

  const handleConnect = useCallback(async () => {
    setWallet({ connecting: true });

    try {
      await transact(async (mobileWallet: Web3MobileWallet) => {
        const authResult = await mobileWallet.authorize({
          cluster: config.solanaCluster,
          identity: APP_IDENTITY,
        });

        const pubkey = new PublicKey(authResult.accounts[0].address);
        setWallet({
          publicKey: pubkey,
          connected: true,
          connecting: false,
        });
      });
    } catch (err) {
      setWallet({ connecting: false });
      Alert.alert(
        'connection failed',
        err instanceof Error ? err.message : 'could not connect wallet'
      );
    }
  }, [setWallet]);

  const handleDisconnect = useCallback(() => {
    setWallet({
      publicKey: null,
      connected: false,
      connecting: false,
    });
  }, [setWallet]);

  // connected — just show disconnect label (wallet addr shown by parent)
  if (wallet.connected && wallet.publicKey) {
    return (
      <TouchableOpacity onPress={handleDisconnect}>
        <Text style={styles.disconnectText}>DISCONNECT</Text>
      </TouchableOpacity>
    );
  }

  // disconnected — full-width white button
  return (
    <TouchableOpacity
      style={styles.btnW}
      onPress={handleConnect}
      disabled={wallet.connecting}
    >
      <Text style={styles.btnWText}>
        {wallet.connecting ? 'connecting...' : 'connect wallet'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btnW: {
    backgroundColor: colors.white,
    paddingVertical: 20,
    alignItems: 'center',
    marginHorizontal: 28,
  },
  btnWText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'lowercase',
    letterSpacing: 2,
  },
  disconnectText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
});
