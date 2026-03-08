import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useAppStore } from '../store';
import { GenreSelector } from '../components/genre-selector';
import { useMint } from '../hooks/use-mint';
import { fetchPrices, calculatePaymentAmount } from '../services/pricing';

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

  const usdPrice = generation.tier === 'pro' ? 20 : 10;

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      const data = await fetchPrices();
      setPrices(data);
    } catch {
      // will show "..." for amounts
    }
  };

  const getPaymentDisplay = () => {
    if (!prices) return '...';
    return calculatePaymentAmount(usdPrice, selectedPayment, prices).display;
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
    <View style={styles.container}>
      <Text style={styles.title}>mint your usi</Text>
      <Text style={styles.tier}>{generation.tier} — ${usdPrice}</Text>

      <GenreSelector
        selected={generation.genre}
        onSelect={(genre) => setGeneration({ genre })}
      />

      <View style={styles.paymentSection}>
        <Text style={styles.sectionLabel}>payment method</Text>
        <View style={styles.paymentOptions}>
          {(['usdc', 'sol', 'skr'] as const).map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentOption,
                selectedPayment === method && styles.paymentOptionActive,
              ]}
              onPress={() => setSelectedPayment(method)}
            >
              <Text
                style={[
                  styles.paymentText,
                  selectedPayment === method && styles.paymentTextActive,
                ]}
              >
                {method}
              </Text>
              {method === 'skr' && (
                <Text style={styles.discountBadge}>50% off</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.paymentAmount}>{getPaymentDisplay()}</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.mintButton, (!generation.genre || minting) && styles.mintButtonDisabled]}
        onPress={handleMint}
        disabled={!generation.genre || minting}
      >
        {minting ? (
          <ActivityIndicator color={theme.bg} />
        ) : (
          <Text style={styles.mintButtonText}>
            {generation.genre ? 'mint to arweave' : 'select a genre first'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    padding: 24,
  },
  title: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 28,
    color: theme.cream,
    marginBottom: 4,
    marginTop: 24,
  },
  tier: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: theme.cyan,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 14,
    color: theme.cream,
    marginBottom: 12,
  },
  paymentSection: {
    marginTop: 24,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  paymentOption: {
    flex: 1,
    backgroundColor: theme.bg2,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.muted2,
  },
  paymentOptionActive: {
    borderColor: theme.cyan,
  },
  paymentText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: theme.muted,
    textTransform: 'uppercase',
  },
  paymentTextActive: {
    color: theme.cyan,
  },
  discountBadge: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: theme.magenta,
    marginTop: 4,
  },
  paymentAmount: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 20,
    color: theme.cream,
    textAlign: 'center',
    marginTop: 8,
  },
  error: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: theme.magenta,
    marginTop: 16,
    textAlign: 'center',
  },
  mintButton: {
    backgroundColor: theme.cyan,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  mintButtonDisabled: {
    opacity: 0.5,
  },
  mintButtonText: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 18,
    color: theme.bg,
  },
});
