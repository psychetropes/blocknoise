import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
const GENRE_ROW_HEIGHT = 24;
const GENRE_PICKER_HEIGHT = GENRE_ROW_HEIGHT * 5;

export function MintScreen({ navigation, route }: { navigation: any; route: any }) {
  const { wallet, generation, setGeneration } = useAppStore();
  const spatialPath = route.params?.spatialPath ?? null;
  const { mint, minting, error } = useMint();

  const [nextCatalog, setNextCatalog] = useState<number | null>(null);
  const [selectedGenreIndex, setSelectedGenreIndex] = useState(
    Math.max(0, generation.genre ? GENRES.indexOf(generation.genre) : 0)
  );
  const genreListRef = useRef<FlatList<string> | null>(null);
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
    if (!genreListRef.current) {
      return;
    }

    genreListRef.current.scrollToOffset({
      offset: selectedGenreIndex * GENRE_ROW_HEIGHT,
      animated: false,
    });
  }, [selectedGenreIndex]);

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
      navigation.replace('mint-complete', {
        catalogNumber: result.catalogNumber,
        mintAddress: result.mintAddress,
      });
    }
  };

  const handleGenreScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.max(
      0,
      Math.min(GENRES.length - 1, Math.round(event.nativeEvent.contentOffset.y / GENRE_ROW_HEIGHT))
    );
    if (nextIndex !== selectedGenreIndex) {
      setSelectedGenreIndex(nextIndex);
    }
    genreListRef.current?.scrollToOffset({
      offset: nextIndex * GENRE_ROW_HEIGHT,
      animated: true,
    });
  };

  const selectGenre = (index: number) => {
    setSelectedGenreIndex(index);
    genreListRef.current?.scrollToOffset({
      offset: index * GENRE_ROW_HEIGHT,
      animated: true,
    });
  };

  return (
    <ScreenFrame headerLeft={shortWallet} headerRight="LOCKED">
      <View style={{ height: 24 }} />
      <Text style={styles.title}>{'CATALOG YOUR\nCOMPOSITION'}</Text>
      <View style={{ height: 8 }} />
      <Text style={styles.subtitle}>choose a genre</Text>
      <View style={{ height: 16 }} />

      <RecessButton style={styles.genreBox} interactive={false}>
        <View style={styles.genreOverlay}>
          <View style={styles.genreViewport}>
            <View style={styles.genreCenterBand} />
            <FlatList
              ref={genreListRef}
              data={GENRES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              snapToInterval={GENRE_ROW_HEIGHT}
              decelerationRate="fast"
              bounces={false}
              onMomentumScrollEnd={handleGenreScrollEnd}
              onScrollEndDrag={handleGenreScrollEnd}
              getItemLayout={(_data, index) => ({
                length: GENRE_ROW_HEIGHT,
                offset: GENRE_ROW_HEIGHT * index,
                index,
              })}
              contentContainerStyle={styles.genreScrollContent}
              renderItem={({ item: genre, index }) => {
                const isCentered = index === selectedGenreIndex;
                return (
                  <TouchableOpacity
                    key={genre}
                    activeOpacity={0.85}
                    style={styles.genreRow}
                    onPress={() => selectGenre(index)}
                  >
                    <Text style={[styles.genreItem, isCentered && styles.genreItemSelected]}>
                      {genre.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
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
          <Text style={styles.btnWText}>mint composition</Text>
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
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  genreItemSelected: {
    color: colors.white,
  },
  genreBox: {
    aspectRatio: 1,
    overflow: 'hidden',
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
    paddingTop: '18%',
    paddingBottom: '18%',
    paddingHorizontal: '10%',
  },
  genreCenterBand: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '50%',
    height: GENRE_ROW_HEIGHT,
    marginTop: -(GENRE_ROW_HEIGHT / 2),
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  genreScrollContent: {
    paddingTop: (GENRE_PICKER_HEIGHT - GENRE_ROW_HEIGHT) / 2,
    paddingBottom: (GENRE_PICKER_HEIGHT - GENRE_ROW_HEIGHT) / 2,
  },
  genreRow: {
    width: '100%',
    height: GENRE_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
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
