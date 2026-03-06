import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useAppStore } from '../store';
import { WalletConnect } from '../components/wallet-connect';

export function HomeScreen({ navigation }: { navigation: any }) {
  const { wallet, generation, setGeneration } = useAppStore();

  const handleGenerate = (tier: 'standard' | 'pro') => {
    setGeneration({ tier });
    navigation.navigate('generate');
  };

  if (!wallet.connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>blocknoise</Text>
        <Text style={styles.subtitle}>
          your wallet. your sound. permanent.
        </Text>
        <WalletConnect />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>blocknoise</Text>
      <Text style={styles.walletLabel}>
        {wallet.publicKey?.toBase58().slice(0, 4)}...
        {wallet.publicKey?.toBase58().slice(-4)}
      </Text>

      <View style={styles.tierContainer}>
        <TouchableOpacity
          style={styles.tierCard}
          onPress={() => handleGenerate('standard')}
        >
          <Text style={styles.tierTitle}>standard usi</Text>
          <Text style={styles.tierPrice}>$10</Text>
          <Text style={styles.tierDesc}>1 × 30s looping track</Text>
          <Text style={styles.tierCredits}>1,200 credits</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tierCard, styles.proCard]}
          onPress={() => handleGenerate('pro')}
        >
          <Text style={styles.tierTitle}>pro usi</Text>
          <Text style={styles.tierPrice}>$20</Text>
          <Text style={styles.tierDesc}>3 × 30s stems + 3d mixer</Text>
          <Text style={styles.tierCredits}>3,600 credits</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.skrNote}>50% off with skr</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 36,
    color: theme.cream,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: theme.muted,
    marginBottom: 48,
    textAlign: 'center',
  },
  walletLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: theme.cyan,
    marginBottom: 40,
  },
  tierContainer: {
    width: '100%',
    gap: 16,
  },
  tierCard: {
    backgroundColor: theme.bg2,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.muted2,
  },
  proCard: {
    borderColor: theme.magenta,
  },
  tierTitle: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 20,
    color: theme.cream,
    marginBottom: 4,
  },
  tierPrice: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 28,
    color: theme.cyan,
    marginBottom: 8,
  },
  tierDesc: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: theme.muted,
  },
  tierCredits: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: theme.muted2,
    marginTop: 4,
  },
  skrNote: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: theme.magenta,
    marginTop: 24,
  },
});
