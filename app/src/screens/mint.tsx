import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useAppStore } from '../store';
import { GenreSelector } from '../components/genre-selector';

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
  const [minting, setMinting] = useState(false);
  const [mintComplete, setMintComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usdPrice = generation.tier === 'pro' ? 20 : 10;

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/price`);
      const data = await res.json();
      setPrices(data);
    } catch {
      setError('failed to fetch prices');
    }
  };

  const getPaymentAmount = () => {
    if (!prices) return '...';
    const amount = selectedPayment === 'skr' ? usdPrice / 2 : usdPrice;
    switch (selectedPayment) {
      case 'usdc':
        return `${amount} usdc`;
      case 'sol':
        return `${(amount / prices.solUsd).toFixed(4)} sol`;
      case 'skr':
        return `${(amount / prices.skrUsd).toFixed(2)} skr`;
    }
  };

  const handleMint = async () => {
    if (!wallet.publicKey || !generation.genre) return;
    setMinting(true);
    setError(null);

    try {
      // todo: build transaction, sign via mwa, verify, upload to arweave, mint nft
      setMintComplete(true);
      navigation.navigate('leaderboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'mint failed');
    } finally {
      setMinting(false);
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
        <Text style={styles.paymentAmount}>{getPaymentAmount()}</Text>
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
