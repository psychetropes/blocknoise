import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';
import { theme } from '../theme';
import { useAppStore } from '../store';
import { config } from '../config';

const APP_IDENTITY = {
  name: 'blocknoise',
  uri: 'https://blocknoise.xyz',
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

  if (wallet.connected && wallet.publicKey) {
    return (
      <View style={styles.connectedContainer}>
        <Text style={styles.walletAddress}>
          {wallet.publicKey.toBase58().slice(0, 4)}...
          {wallet.publicKey.toBase58().slice(-4)}
        </Text>
        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
          <Text style={styles.disconnectText}>disconnect</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.connectButton}
      onPress={handleConnect}
      disabled={wallet.connecting}
    >
      <Text style={styles.connectText}>
        {wallet.connecting ? 'connecting...' : 'connect wallet'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  connectButton: {
    backgroundColor: theme.cyan,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
  },
  connectText: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 18,
    color: theme.bg,
  },
  connectedContainer: {
    alignItems: 'center',
    gap: 12,
  },
  walletAddress: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: theme.cyan,
  },
  disconnectButton: {
    borderWidth: 1,
    borderColor: theme.muted,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disconnectText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: theme.muted,
  },
});
