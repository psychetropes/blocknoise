import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';
import { useAppStore } from '../store';
import { WalletConnect } from '../components/wallet-connect';
import { RecessButton } from '../components/recess-button';
import { BrandTitle } from '../components/brand-title';
import { ScreenFrame } from '../components/screen-frame';
import {
  fetchPrices,
  fetchDiscountEligibility,
  calculatePaymentAmount,
  type DiscountEligibility,
  type PriceData,
} from '../services/pricing';
import { DEMO_PRICES } from '../demo';

export function HomeScreen({ navigation }: { navigation: any }) {
  const { wallet, setGeneration } = useAppStore();
  const [prices, setPrices] = useState<PriceData>(DEMO_PRICES);
  const [eligibility, setEligibility] = useState<DiscountEligibility>({
    domain: null,
    skrDiscountEligible: false,
  });

  useEffect(() => {
    fetchPrices().then(setPrices).catch(() => setPrices(DEMO_PRICES));
  }, []);

  useEffect(() => {
    if (!wallet.publicKey) {
      setEligibility({ domain: null, skrDiscountEligible: false });
      return;
    }

    fetchDiscountEligibility(wallet.publicKey.toBase58())
      .then(setEligibility)
      .catch(() => setEligibility({ domain: null, skrDiscountEligible: false }));
  }, [wallet.publicKey]);

  const handleGenerate = (tier: 'standard' | 'pro') => {
    setGeneration({
      tier,
      audioUrl: null,
      stemUrls: [],
      stemWaveforms: [],
      genre: null,
      paymentMethod: null,
      paymentSignature: null,
    });
    setTimeout(() => {
      navigation.navigate('payment');
    }, 110);
  };

  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';

  const getDisplayAmount = (usdPrice: number, method: 'usdc' | 'sol' | 'skr') =>
    calculatePaymentAmount(
      usdPrice,
      method,
      prices,
      eligibility.skrDiscountEligible
    ).display.replace(/ (usdc|sol|skr)$/i, '');

  if (!wallet.connected) {
    return (
      <ScreenFrame>
        <View style={{ flex: 1 }} />
        <BrandTitle />
        <View style={{ flex: 1 }} />
        <WalletConnect />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      headerLeft={shortWallet}
      headerRight={<WalletConnect />}
    >
      <View style={styles.tierContainer}>
        <RecessButton
          onPress={() => handleGenerate('standard')}
          style={{ flex: 1 }}
        >
          <Text style={styles.tierTitle}>STANDARD COMPOSITION</Text>
          <Text style={styles.tierDesc}>{'1 x 30s looping track\n'}</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.priceRow}>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>USDC</Text>
              {'\n'}
              <Text style={styles.priceValue}>{getDisplayAmount(10, 'usdc')}</Text>
            </Text>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>SOL</Text>
              {'\n'}
              <Text style={styles.priceValue}>{getDisplayAmount(10, 'sol')}</Text>
            </Text>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>SKR</Text>
              {'\n'}
              <Text style={styles.priceValue}>{getDisplayAmount(10, 'skr')}</Text>
            </Text>
          </View>
        </RecessButton>

        <RecessButton
          onPress={() => handleGenerate('pro')}
          style={{ flex: 1 }}
        >
          <Text style={styles.tierTitle}>SPATIAL COMPOSITION</Text>
          <Text style={styles.tierDesc}>{'3 x 30s stems + 3D mixer\n'}</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.priceRow}>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>USDC</Text>
              {'\n'}
              <Text style={styles.priceValue}>{getDisplayAmount(20, 'usdc')}</Text>
            </Text>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>SOL</Text>
              {'\n'}
              <Text style={styles.priceValue}>{getDisplayAmount(20, 'sol')}</Text>
            </Text>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>SKR</Text>
              {'\n'}
              <Text style={styles.priceValue}>{getDisplayAmount(20, 'skr')}</Text>
            </Text>
          </View>
        </RecessButton>
      </View>

      <TouchableOpacity style={styles.btnW} onPress={() => handleGenerate('standard')}>
        <Text style={styles.btnWText}>choose composition</Text>
      </TouchableOpacity>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  tierContainer: {
    flex: 1,
    gap: 28,
    marginTop: 28,
  },
  tierTitle: {
    fontFamily: typography.mono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  tierDesc: {
    fontFamily: typography.mono,
    fontSize: 9,
    color: colors.grey,
    letterSpacing: 1,
    marginTop: 6,
  },
  priceRow: {
    gap: 8,
  },
  priceItem: {
    fontSize: 10,
    color: colors.white,
    textAlign: 'left',
    lineHeight: 15,
  },
  priceCurrency: {
    fontFamily: typography.mono,
    opacity: 0.5,
  },
  priceValue: {
    fontFamily: typography.mono,
    fontWeight: '700',
  },
  btnW: {
    backgroundColor: colors.white,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 28,
  },
  btnWText: {
    fontFamily: typography.mono,
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'lowercase',
    letterSpacing: 2,
  },
});
