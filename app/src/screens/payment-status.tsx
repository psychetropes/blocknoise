import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, typography } from '../theme';
import { useAppStore } from '../store';
import { ScreenFrame } from '../components/screen-frame';
import { usePayment } from '../hooks/use-payment';

const MIN_PAYMENT_DELAY_MS = 2400;

function ProcessingAnimation() {
  const bars = useMemo(
    () => [new Animated.Value(0.35), new Animated.Value(0.55), new Animated.Value(0.75)],
    []
  );

  useEffect(() => {
    const loops = bars.map((bar, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 120),
          Animated.timing(bar, {
            toValue: 1,
            duration: 420,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.35,
            duration: 420,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      )
    );

    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [bars]);

  return (
    <View style={styles.animationRow}>
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.animationBar,
            {
              transform: [{ scaleY: bar }],
              opacity: bar,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function PaymentStatusScreen({ navigation }: { navigation: any }) {
  const { wallet, generation } = useAppStore();
  const { pay, error } = usePayment();
  const [completed, setCompleted] = useState(false);
  const startedRef = useRef(false);

  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';

  useEffect(() => {
    if (startedRef.current || !generation.paymentMethod) {
      return;
    }

    startedRef.current = true;

    const run = async () => {
      const startedAt = Date.now();
      const signature = await pay(generation.paymentMethod!);
      if (!signature) {
        startedRef.current = false;
        return;
      }

      const elapsed = Date.now() - startedAt;
      const waitRemaining = Math.max(0, MIN_PAYMENT_DELAY_MS - elapsed);
      if (waitRemaining > 0) {
        await new Promise<void>((resolve) => setTimeout(() => resolve(), waitRemaining));
      }

      setCompleted(true);
      setTimeout(() => {
        navigation.replace('generate');
      }, 900);
    };

    void run();
  }, [generation.paymentMethod, navigation, pay]);

  const retry = () => {
    startedRef.current = false;
    setCompleted(false);
  };

  return (
    <ScreenFrame headerLeft={shortWallet} headerRight="DISCONNECT">
      <View style={styles.content}>
        {!completed ? (
          <>
            <ProcessingAnimation />
            <View style={{ height: 28 }} />
            <Text style={styles.processingLabel}>payment processing</Text>
          </>
        ) : (
          <Text style={styles.completeTitle}>{'PAYMENT\nCOMPLETE'}</Text>
        )}
        {error ? (
          <>
            <View style={{ height: 28 }} />
            <Text style={styles.error}>{error}</Text>
            <View style={{ height: 18 }} />
            <TouchableOpacity style={styles.retryButton} onPress={retry}>
              <Text style={styles.retryText}>retry payment</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  animationBar: {
    width: 8,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  processingLabel: {
    fontFamily: typography.mono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 3,
    textAlign: 'center',
  },
  completeTitle: {
    fontFamily: typography.display,
    fontSize: 34,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 36,
    textAlign: 'center',
  },
  error: {
    fontFamily: typography.mono,
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: colors.white,
    paddingVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  retryText: {
    fontFamily: typography.mono,
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'lowercase',
    letterSpacing: 2,
  },
});
