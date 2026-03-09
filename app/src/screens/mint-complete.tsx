import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, typography } from '../theme';
import { useAppStore } from '../store';
import { ScreenFrame } from '../components/screen-frame';

export function MintCompleteScreen({ navigation, route }: { navigation: any; route: any }) {
  const { wallet } = useAppStore();
  const catalogNumber = route.params?.catalogNumber ?? '—';
  const mintAddress = route.params?.mintAddress ?? wallet.publicKey?.toBase58() ?? '';

  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';

  return (
    <ScreenFrame headerLeft={shortWallet} headerRight="LOCKED">
      <View style={styles.content}>
        <Text style={styles.title}>COMPOSITION{'\n'}MINTED</Text>

        <View style={{ height: 28 }} />

        <Text style={styles.catalog}>#blocknoise#{catalogNumber}</Text>
        <Text style={styles.wallet}>{mintAddress}</Text>

        <View style={{ height: 32 }} />

        <Text style={styles.body}>Your track has been saved to the permaweb.</Text>

        <View style={{ height: 40 }} />

        <View style={styles.links}>
          <TouchableOpacity onPress={() => navigation.replace('tabs', { screen: 'leaderboard' })}>
            <Text style={styles.link}>VIEW LEADERBOARD</Text>
          </TouchableOpacity>
          <Text style={styles.pipe}>|</Text>
          <TouchableOpacity onPress={() => navigation.replace('tabs', { screen: 'radio' })}>
            <Text style={styles.link}>SEEKER RADIO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 34,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 36,
    textAlign: 'center',
  },
  catalog: {
    fontFamily: typography.mono,
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 2,
    textAlign: 'center',
  },
  wallet: {
    marginTop: 10,
    fontFamily: typography.mono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
  body: {
    maxWidth: 280,
    fontFamily: typography.mono,
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 18,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    fontFamily: typography.mono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 2,
  },
  pipe: {
    marginHorizontal: 10,
    fontFamily: typography.mono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 2,
  },
});
