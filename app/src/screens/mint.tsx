import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  PanResponder,
  Animated,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { colors, typography } from '../theme';
import { useAppStore } from '../store';
import { RecessButton } from '../components/recess-button';
import { useMint } from '../hooks/use-mint';
import { config } from '../config';
import { DEMO_LEADERBOARD } from '../demo';
import { ScreenFrame } from '../components/screen-frame';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const GENRES = [
  'ambient', 'drone', 'industrial', 'noise', 'glitch',
  'dark ambient', 'field recording', 'musique concrète', 'electroacoustic',
  'sound art', 'lo-fi', 'harsh noise', 'power electronics', 'tape music',
  'generative', 'modular', 'microsound', 'acousmatic', 'dark techno', 'ritual',
];

export function MintScreen({ navigation, route }: { navigation: any; route: any }) {
  const { wallet, generation, setGeneration } = useAppStore();
  const spatialPath = route.params?.spatialPath ?? null;
  const { mint, minting, error } = useMint();

  const [nextCatalog, setNextCatalog] = useState<number | null>(null);
  const [selectedGenreIndex, setSelectedGenreIndex] = useState(
    Math.max(0, generation.genre ? GENRES.indexOf(generation.genre) : 0)
  );
  const dragOffset = useRef(new Animated.Value(0)).current;
  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';
  const fullWallet = wallet.publicKey?.toBase58() ?? '';

  useEffect(() => {
    if (generation.genre && GENRES.includes(generation.genre)) {
      setSelectedGenreIndex(GENRES.indexOf(generation.genre));
    }
  }, [generation.genre]);

  useEffect(() => {
    fetchNextCatalog();
  }, []);

  useEffect(() => {
    const nextGenre = GENRES[selectedGenreIndex];
    if (nextGenre && generation.genre !== nextGenre) {
      setGeneration({ genre: nextGenre });
    }
  }, [generation.genre, selectedGenreIndex, setGeneration]);

  const fetchNextCatalog = async () => {
    if (config.demoMode || !supabase) {
      setNextCatalog(DEMO_LEADERBOARD.length + 1);
      return;
    }

    try {
      const { count } = await supabase
        .from('usis')
        .select('*', { count: 'exact', head: true });
      if (count !== null) setNextCatalog(count + 1);
    } catch (_error) {
      setNextCatalog(DEMO_LEADERBOARD.length + 1);
    }
  };

  const handleMint = async () => {
    if (!wallet.publicKey || !generation.genre) return;
    const result = await mint(generation.paymentMethod ?? 'usdc', spatialPath);
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

  const wrapIndex = (value: number) => {
    const length = GENRES.length;
    return ((value % length) + length) % length;
  };

  const visibleGenres = useMemo(
    () =>
      Array.from({ length: 5 }, (_, visibleIndex) => {
        const offset = visibleIndex - 2;
        const genreIndex = wrapIndex(selectedGenreIndex + offset);
        return {
          genre: GENRES[genreIndex],
          offset,
        };
      }),
    [selectedGenreIndex]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          const clamped = Math.max(-120, Math.min(120, gestureState.dy));
          dragOffset.setValue(clamped);
        },
        onPanResponderRelease: (_, gestureState) => {
          const step = Math.round(gestureState.dy / 34);
          setSelectedGenreIndex((prev) => wrapIndex(prev - step));
          Animated.spring(dragOffset, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 4,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragOffset, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 4,
          }).start();
        },
      }),
    [dragOffset]
  );

  return (
    <ScreenFrame headerLeft={shortWallet} headerRight="LOCKED">
      <View style={{ height: 24 }} />
      <Text style={styles.title}>{'CATALOG YOUR\nCOMPOSITION'}</Text>
      <View style={{ height: 8 }} />
      <Text style={styles.subtitle}>choose a genre</Text>
      <View style={{ height: 16 }} />

      <RecessButton style={styles.genreBox} interactive={false}>
        <View style={styles.genreOverlay}>
          <View style={styles.genreViewport} {...panResponder.panHandlers}>
            <View style={styles.genreCenterBand} />
            {visibleGenres.map(({ genre, offset }) => {
              const distance = Math.abs(offset);
              const isCentered = offset === 0;

              return (
                <Animated.View
                  key={`${genre}-${offset}`}
                  style={[
                    styles.genreRow,
                    {
                      transform: [
                        { translateY: offset * 34 },
                        { translateY: dragOffset },
                      ],
                      opacity: isCentered ? 1 : Math.max(0.18, 0.7 - distance * 0.14),
                    },
                  ]}
                >
                  <Text style={[styles.genreItem, isCentered && styles.genreItemSelected]}>
                    {genre.toUpperCase()}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </View>
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

      <View style={styles.paymentMeta}>
        <Text style={styles.paymentMetaLabel}>PAID VIA {generation.paymentMethod?.toUpperCase() ?? '—'}</Text>
        <Text style={styles.paymentMetaValue}>{generation.paymentSignature ? 'payment confirmed' : 'payment missing'}</Text>
      </View>

      <View style={{ flex: 1 }} />

      {error && <Text style={styles.error}>{error}</Text>}

      {/* mint button */}
      <TouchableOpacity
        style={[styles.btnW, (!generation.genre || !generation.paymentSignature || minting) && { opacity: 0.5 }]}
        onPress={handleMint}
        disabled={!generation.genre || !generation.paymentSignature || minting}
      >
        {minting ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.btnWText}>mint to arweave</Text>
        )}
      </TouchableOpacity>
      <View style={{ height: 28 }} />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.display,
    fontSize: 34,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.mono,
    fontSize: 12,
    color: colors.grey,
    textAlign: 'center',
  },
  genreItem: {
    fontFamily: typography.mono,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  genreItemSelected: {
    color: colors.white,
  },
  genreBox: {
    aspectRatio: 1,
  },
  genreOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 3,
    elevation: 3,
  },
  genreViewport: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  genreCenterBand: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '48%',
    height: '12%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  genreRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '54%',
    marginTop: -9,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWallet: {
    fontFamily: typography.mono,
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
  },
  catalogPreview: {
    fontFamily: typography.mono,
    fontSize: 7,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  paymentMeta: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  paymentMetaLabel: {
    fontFamily: typography.mono,
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.5,
  },
  paymentMetaValue: {
    fontFamily: typography.mono,
    fontSize: 9,
    color: colors.white,
    opacity: 0.7,
  },
  error: {
    fontFamily: typography.mono,
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
    fontFamily: typography.mono,
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'lowercase',
    letterSpacing: 2,
  },
});
