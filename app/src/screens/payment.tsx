import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';
import { useAppStore } from '../store';
import { RecessButton } from '../components/recess-button';
import { fetchPrices, calculatePaymentAmount, type PriceData } from '../services/pricing';
import { usePayment } from '../hooks/use-payment';
import { ScreenFrame } from '../components/screen-frame';
import { DEMO_PRICES } from '../demo';

export function PaymentScreen({ navigation }: { navigation: any }) {
  const { wallet, generation, setGeneration } = useAppStore();
  const { pay, paying, error } = usePayment();
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'usdc' | 'sol' | 'skr'>('usdc');

  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';

  useEffect(() => {
    fetchPrices().then(setPrices).catch(() => setPrices(null));
  }, []);

  const usdPrice = generation.tier === 'pro' ? 20 : 10;

  const getPaymentAmount = (method: 'usdc' | 'sol' | 'skr') => {
    const priceSource = prices ?? DEMO_PRICES;
    return calculatePaymentAmount(
      usdPrice,
      method,
      priceSource
    ).display.replace(/ (usdc|sol|skr)$/i, '');
  };

  const handlePay = async () => {
    const signature = await pay(selectedPayment);
    if (!signature) return;
    setGeneration({
      audioUrl: null,
      stemUrls: [],
      stemWaveforms: [],
      genre: null,
    });
    navigation.navigate('generate');
  };

  return (
    <ScreenFrame headerLeft={shortWallet} headerRight="DISCONNECT">
      <View style={styles.stack}>
        {(['usdc', 'sol', 'skr'] as const).map((method) => (
          <View key={method} style={styles.paymentRow}>
            <RecessButton
              selected={selectedPayment === method}
              onPress={() => setSelectedPayment(method)}
              style={styles.paymentBox}
              interactive={false}
            >
              <View style={styles.paymentOverlay}>
                <View pointerEvents="none" style={styles.paymentInner}>
                  <Text style={styles.paymentLabel}>{method.toUpperCase()}</Text>
                  <Text style={styles.paymentAmount}>{getPaymentAmount(method)}</Text>
                  {method === 'skr' ? (
                    <Text style={styles.paymentNote}>50% OFF</Text>
                  ) : null}
                </View>
              </View>
            </RecessButton>
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.btnW, paying && { opacity: 0.5 }]}
        onPress={handlePay}
        disabled={paying}
      >
        {paying ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.btnWText}>pay & generate</Text>
        )}
      </TouchableOpacity>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    gap: 28,
    paddingTop: 28,
    paddingBottom: 28,
  },
  paymentRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBox: {
    height: '100%',
    aspectRatio: 1,
    maxWidth: '100%',
  },
  paymentOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 3,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInner: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 12,
    transform: [{ translateY: 10 }],
  },
  paymentLabel: {
    fontFamily: typography.mono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    opacity: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 13,
    marginBottom: 12,
  },
  paymentAmount: {
    fontFamily: typography.mono,
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 28,
  },
  paymentNote: {
    fontFamily: typography.mono,
    fontSize: 8,
    fontWeight: '700',
    color: colors.white,
    opacity: 0.4,
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  error: {
    fontFamily: typography.mono,
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  btnW: {
    backgroundColor: colors.white,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 4,
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
