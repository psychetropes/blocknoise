import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useAppStore } from '../store';
import { WalletConnect } from '../components/wallet-connect';

interface RecentMint {
  id: string;
  wallet_address: string;
  tier: 'standard' | 'pro';
  genre: string;
}

export function HomeScreen({ navigation }: { navigation: any }) {
  const { wallet, setGeneration } = useAppStore();
  const [recentMints, setRecentMints] = useState<RecentMint[]>([]);

  useEffect(() => {
    fetchRecentMints();
  }, []);

  const fetchRecentMints = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/leaderboard`);
      const data = await res.json();
      setRecentMints(data.slice(0, 5));
    } catch {
      // silent
    }
  };

  const handleGenerate = (tier: 'standard' | 'pro') => {
    setGeneration({ tier });
    navigation.navigate('generate');
  };

  const shortWallet = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (!wallet.connected) {
    return (
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>blocknoise</Text>
          <Text style={styles.subtitle}>
            your wallet. your sound. permanent.
          </Text>
          <Text style={styles.tagline}>
            a psyché tropes research imprint
          </Text>
        </View>
        <WalletConnect />

        {recentMints.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>recent mints</Text>
            {recentMints.map((mint) => (
              <View key={mint.id} style={styles.recentRow}>
                <Text style={styles.recentWallet}>{shortWallet(mint.wallet_address)}</Text>
                <Text style={styles.recentGenre}>{mint.genre}</Text>
                {mint.tier === 'pro' && <Text style={styles.recentPro}>pro</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
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

      {recentMints.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>recent mints</Text>
          {recentMints.map((mint) => (
            <View key={mint.id} style={styles.recentRow}>
              <Text style={styles.recentWallet}>{shortWallet(mint.wallet_address)}</Text>
              <Text style={styles.recentGenre}>{mint.genre}</Text>
              {mint.tier === 'pro' && <Text style={styles.recentPro}>pro</Text>}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
  scroll: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scrollContent: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
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
    textAlign: 'center',
  },
  tagline: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: theme.muted2,
    marginTop: 8,
  },
  walletLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: theme.cyan,
    marginBottom: 32,
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
  recentSection: {
    width: '100%',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: theme.muted2,
  },
  recentTitle: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 14,
    color: theme.cream,
    marginBottom: 12,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  recentWallet: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: theme.cyan,
  },
  recentGenre: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: theme.muted,
    flex: 1,
  },
  recentPro: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: theme.magenta,
  },
});
