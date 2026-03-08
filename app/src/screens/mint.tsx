import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, ScrollView } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { colors } from '../theme';
import { useAppStore } from '../store';
import { RecessButton } from '../components/recess-button';
import { useMint } from '../hooks/use-mint';
import { fetchPrices, calculatePaymentAmount } from '../services/pricing';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
);

const GENRES = [
  'ambient', 'drone', 'industrial', 'noise', 'glitch',
  'dark ambient', 'field recording', 'musique concrète', 'electroacoustic',
  'sound art', 'lo-fi', 'harsh noise', 'power electronics', 'tape music',
  'generative', 'modular', 'microsound', 'acousmatic', 'dark techno', 'ritual',
];

interface PriceData {
  sol: number;
  usdc: number;
  skr: number;
  solUsd: number;
  skrUsd: number;
}

export function MintScreen({ navigation, route }: { navigation: any; route: any }) {
  const { wallet, generation, setGeneration } = useAppStore();
  const spatialPath = route.params?.spatialPath ?? null;
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'usdc' | 'sol' | 'skr'>('usdc');
  const { mint, minting, error } = useMint();

  const [nextCatalog, setNextCatalog] = useState<number | null>(null);
  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';
  const fullWallet = wallet.publicKey?.toBase58() ?? '';

  useEffect(() => {
    loadPrices();
    fetchNextCatalog();
  }, []);

  const loadPrices = async () => {
    try {
      const data = await fetchPrices();
      setPrices(data);
    } catch {}
  };

  const fetchNextCatalog = async () => {
    try {
      const { count } = await supabase
        .from('usis')
        .select('*', { count: 'exact', head: true });
      if (count !== null) setNextCatalog(count + 1);
    } catch {}
  };

  const getPaymentAmount = (method: 'usdc' | 'sol' | 'skr') => {
    if (!prices) return '...';
    return calculatePaymentAmount(
      generation.tier === 'pro' ? 20 : 10,
      method,
      prices
    ).display;
  };

  const handleMint = async () => {
    if (!wallet.publicKey || !generation.genre) return;
    const result = await mint(selectedPayment, spatialPath);
    if (result) {
      const label = result.displayName
        ? `#blocknoise#${result.catalogNumber} — ${result.displayName}`
        : `#blocknoise#${result.catalogNumber}`;
      Alert.alert(
        'minted!',
        `${label} — your ${generation.tier} usi has been permanently stored on arweave.`,
        [{ text: 'view leaderboard', onPress: () => navigation.navigate('tabs', { screen: 'leaderboard' }) }]
      );
    }
  };

  return (
    <View style={styles.screen}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.walletAddr}>{shortWallet}</Text>
        <Text style={styles.lockedLabel}>LOCKED</Text>
      </View>

      <View style={{ height: 24 }} />
      <Text style={styles.title}>{'CATALOG YOUR\nCOMPOSITION'}</Text>
      <View style={{ height: 8 }} />
      <Text style={styles.subtitle}>choose a genre</Text>
      <View style={{ height: 16 }} />

      {/* genre selector — recess box with scrollable genres */}
      <RecessButton style={{ aspectRatio: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 18, paddingVertical: 12 }}
        >
          {GENRES.map((genre) => (
            <TouchableOpacity key={genre} onPress={() => setGeneration({ genre })}>
              <Text style={[
                styles.genreItem,
                generation.genre === genre && styles.genreItemSelected,
              ]}>
                {genre.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </RecessButton>

      <View style={{ height: 24 }} />

      {/* wallet + catalog number */}
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.fullWallet}>{fullWallet}</Text>
        <Text style={styles.catalogPreview}>
          {nextCatalog ? `#blocknoise#${nextCatalog}` : '#blocknoise#—'}
        </Text>
      </View>

      <View style={{ height: 24 }} />

      {/* payment method selector */}
      <View style={styles.paymentRow}>
        {(['usdc', 'sol', 'skr'] as const).map((method) => (
          <RecessButton
            key={method}
            selected={selectedPayment === method}
            onPress={() => setSelectedPayment(method)}
            style={{ flex: 1 }}
          >
            <View style={styles.paymentCard}>
              <Text style={styles.paymentLabel}>{method.toUpperCase()}</Text>
              <Text style={styles.paymentAmount}>{getPaymentAmount(method)}</Text>
              {method === 'skr' && (
                <Text style={styles.paymentNote}>50% off</Text>
              )}
            </View>
          </RecessButton>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      {error && <Text style={styles.error}>{error}</Text>}

      {/* mint button */}
      <TouchableOpacity
        style={[styles.btnW, (!generation.genre || minting) && { opacity: 0.5 }]}
        onPress={handleMint}
        disabled={!generation.genre || minting}
      >
        {minting ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.btnWText}>mint to arweave</Text>
        )}
      </TouchableOpacity>
      <View style={{ height: 28 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.blue,
    paddingTop: 28,
    paddingHorizontal: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
  },
  walletAddr: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  lockedLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  title: {
    fontFamily: 'ABCSolar-Bold',
    fontSize: 34,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: colors.grey,
    textAlign: 'center',
  },
  genreItem: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    fontWeight: '700',
    color: colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  genreItemSelected: {
    color: colors.white,
  },
  fullWallet: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
  },
  catalogPreview: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 7,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  paymentLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.5,
  },
  paymentAmount: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  paymentNote: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8,
    color: colors.white,
    opacity: 0.4,
  },
  error: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  btnW: {
    backgroundColor: colors.white,
    paddingVertical: 20,
    alignItems: 'center',
  },
  btnWText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'lowercase',
    letterSpacing: 2,
  },
});
