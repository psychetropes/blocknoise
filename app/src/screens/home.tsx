import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useAppStore } from '../store';
import { WalletConnect } from '../components/wallet-connect';
import { RecessButton } from '../components/recess-button';

export function HomeScreen({ navigation }: { navigation: any }) {
  const { wallet, setGeneration } = useAppStore();

  const handleGenerate = (tier: 'standard' | 'pro') => {
    setGeneration({ tier });
    navigation.navigate('generate');
  };

  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';

  // disconnected — show BLOCK NOISE title + connect button
  if (!wallet.connected) {
    return (
      <View style={styles.screen}>
        <View style={{ flex: 1 }} />
        <View style={styles.titleBlock}>
          <Text style={styles.titleLine}>BLOCK</Text>
          <Text style={styles.titleLine}>NOISE</Text>
        </View>
        <View style={{ flex: 1 }} />
        <WalletConnect />
        <View style={{ height: 28 }} />
      </View>
    );
  }

  // connected — show wallet + tier cards + mint button
  return (
    <View style={styles.screen}>
      {/* header: wallet + disconnect */}
      <View style={styles.header}>
        <Text style={styles.walletAddr}>{shortWallet}</Text>
        <WalletConnect />
      </View>

      {/* tier cards */}
      <View style={styles.tierContainer}>
        <RecessButton
          onPress={() => handleGenerate('standard')}
          style={{ flex: 1 }}
        >
          <Text style={styles.tierTitle}>STANDARD COMPOSITION</Text>
          <Text style={styles.tierDesc}>1 x 30s looping track</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.priceRow}>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>USDC </Text>
              <Text style={styles.priceValue}>10</Text>
            </Text>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>SOL </Text>
              <Text style={styles.priceValue}>0.07</Text>
            </Text>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>SKR </Text>
              <Text style={styles.priceValue}>5</Text>
            </Text>
          </View>
        </RecessButton>

        <RecessButton
          onPress={() => handleGenerate('pro')}
          style={{ flex: 1 }}
        >
          <Text style={styles.tierTitle}>SPATIAL COMPOSITION</Text>
          <Text style={styles.tierDesc}>3 x 30s stems + 3D mixer</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.priceRow}>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>USDC </Text>
              <Text style={styles.priceValue}>20</Text>
            </Text>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>SOL </Text>
              <Text style={styles.priceValue}>0.14</Text>
            </Text>
            <Text style={styles.priceItem}>
              <Text style={styles.priceCurrency}>SKR </Text>
              <Text style={styles.priceValue}>10</Text>
            </Text>
          </View>
        </RecessButton>
      </View>

      {/* mint button */}
      <TouchableOpacity style={styles.btnW} onPress={() => handleGenerate('standard')}>
        <Text style={styles.btnWText}>mint composition</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.blue,
    paddingTop: 52,
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  titleBlock: {
    alignItems: 'center',
  },
  titleLine: {
    fontFamily: 'ABCSolar-Bold',
    fontSize: 68,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 68,
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
  tierContainer: {
    flex: 1,
    gap: 28,
    marginTop: 28,
  },
  tierTitle: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  tierDesc: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: colors.grey,
    letterSpacing: 1,
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceItem: {
    fontSize: 10,
    color: colors.white,
  },
  priceCurrency: {
    fontFamily: 'JetBrainsMono-Regular',
    opacity: 0.5,
  },
  priceValue: {
    fontFamily: 'JetBrainsMono-Regular',
    fontWeight: '700',
  },
  btnW: {
    backgroundColor: colors.white,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 28,
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
