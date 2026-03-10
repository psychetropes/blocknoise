import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Rect } from 'react-native-svg';
import { colors, typography } from '../theme';
import { useAppStore } from '../store';
import {
  fetchPrices,
  fetchDiscountEligibility,
  calculatePaymentAmount,
  type DiscountEligibility,
  type PriceData,
} from '../services/pricing';
import { ScreenFrame } from '../components/screen-frame';
import { DEMO_PRICES } from '../demo';

function PaymentCard({
  selected,
  onPress,
  label,
  amount,
  note,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  amount: string;
  note?: string;
}) {
  const [pressed, setPressed] = useState(selected);
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    setPressed(selected);
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [anim, selected]);

  const handlePressIn = () => {
    setPressed(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(selected);
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const coords = pressed || selected
    ? { x1: 4, y1: 2.5, x2: 89, y2: 91 }
    : { x1: 8, y1: 5, x2: 78, y2: 82 };
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });
  return (
    <TouchableOpacity
      style={styles.paymentPressable}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.95}
    >
      <Animated.View style={[styles.paymentBox, { transform: [{ translateY }] }]}>
        <Svg
          pointerEvents="none"
          viewBox="0 0 100 100"
          style={StyleSheet.absoluteFill}
          preserveAspectRatio="none"
        >
          <Polygon points={`0,0 100,0 ${coords.x2},${coords.y1} ${coords.x1},${coords.y1}`} fill="rgba(255,255,255,0.07)" />
          <Polygon points={`100,0 100,100 ${coords.x2},${coords.y2} ${coords.x2},${coords.y1}`} fill="rgba(255,255,255,0.05)" />
          <Polygon points={`0,100 100,100 ${coords.x2},${coords.y2} ${coords.x1},${coords.y2}`} fill="rgba(255,255,255,0.02)" />
          <Polygon points={`0,0 0,100 ${coords.x1},${coords.y2} ${coords.x1},${coords.y1}`} fill="rgba(255,255,255,0.035)" />
          <Line x1="0" y1="0" x2={coords.x1} y2={coords.y1} stroke="#444" strokeWidth="1" />
          <Line x1="100" y1="0" x2={coords.x2} y2={coords.y1} stroke="#444" strokeWidth="1" />
          <Line x1="0" y1="100" x2={coords.x1} y2={coords.y2} stroke="#444" strokeWidth="1" />
          <Line x1="100" y1="100" x2={coords.x2} y2={coords.y2} stroke="#444" strokeWidth="1" />
          <Rect x={coords.x1} y={coords.y1} width={coords.x2 - coords.x1} height={coords.y2 - coords.y1} fill="none" stroke="#444" strokeWidth="1" />
        </Svg>
        <View pointerEvents="none" style={styles.paymentInner}>
          <Text style={styles.paymentLabel}>{label}</Text>
          <Text style={styles.paymentAmount}>{amount}</Text>
          {note ? <Text style={styles.paymentNote}>{note}</Text> : null}
        </View>
        {selected ? <View pointerEvents="none" style={styles.paymentGlow} /> : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function PaymentScreen({ navigation }: { navigation: any }) {
  const { wallet, generation, setGeneration } = useAppStore();
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [eligibility, setEligibility] = useState<DiscountEligibility>({
    domain: null,
    skrDiscountEligible: false,
  });
  const [selectedPayment, setSelectedPayment] = useState<'usdc' | 'sol' | 'skr'>('usdc');

  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';

  useEffect(() => {
    fetchPrices().then(setPrices).catch(() => setPrices(null));
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

  const usdPrice = generation.tier === 'pro' ? 20 : 10;

  const getPaymentAmount = (method: 'usdc' | 'sol' | 'skr') => {
    const priceSource = prices ?? DEMO_PRICES;
    return calculatePaymentAmount(
      usdPrice,
      method,
      priceSource,
      eligibility.skrDiscountEligible
    ).display.replace(/ (usdc|sol|skr)$/i, '');
  };

  const handlePay = async () => {
    setGeneration({
      paymentMethod: selectedPayment,
      paymentSignature: null,
      audioUrl: null,
      stemUrls: [],
      stemWaveforms: [],
      genre: null,
    });
    navigation.navigate('payment-status');
  };

  return (
    <ScreenFrame headerLeft={shortWallet} headerRight="DISCONNECT">
      <View style={styles.stack}>
        {(['usdc', 'sol', 'skr'] as const).map((method) => (
          <View key={method} style={styles.paymentRow}>
            <PaymentCard
              selected={selectedPayment === method}
              onPress={() => setSelectedPayment(method)}
              label={method.toUpperCase()}
              amount={getPaymentAmount(method)}
              note={
                method === 'skr'
                  ? eligibility.skrDiscountEligible
                    ? '50% OFF'
                    : 'SNS REQUIRED'
                  : undefined
              }
            />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.btnW}
        onPress={handlePay}
      >
        <Text style={styles.btnWText}>pay & generate</Text>
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
    width: '100%',
    height: '100%',
    aspectRatio: 1,
    maxWidth: '100%',
    backgroundColor: colors.black,
    position: 'relative',
  },
  paymentPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInner: {
    position: 'absolute',
    left: '8%',
    right: '22%',
    top: '5%',
    bottom: '18%',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  paymentAmount: {
    fontFamily: typography.mono,
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 30,
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
  paymentGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
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
