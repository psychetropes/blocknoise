import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TrackPlayer, {
  State,
  usePlaybackState,
  useTrackPlayerEvents,
  Event,
  Capability,
  RepeatMode,
} from 'react-native-track-player';
import { colors, typography } from '../theme';
import { useAppStore } from '../store';
import { RecessButton } from '../components/recess-button';
import { SpatialAudioBridge } from '../components/block/spatial-audio-bridge';
import { resolveArweaveUrl, resolveArweaveUrls } from '../utils/arweave';
import { config } from '../config';
import { DEMO_RADIO } from '../demo';
import { BrandTitle } from '../components/brand-title';
import { ScreenFrame } from '../components/screen-frame';

interface RadioTrack {
  wallet_address: string;
  display_name: string | null;
  arweave_url: string;
  genre: string;
  tier: 'standard' | 'pro';
  id: string;
  stem_urls: string[] | null;
  spatial_path: number[][][] | null;
  catalog_number: number;
}

let playerInitialized = false;

async function setupPlayer() {
  if (playerInitialized) return;
  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
    });
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
      notificationCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
    });
    await TrackPlayer.setRepeatMode(RepeatMode.Queue);
    playerInitialized = true;
  } catch {
    playerInitialized = true;
  }
}

const DEFAULT_POSITIONS: [number, number, number][] = [
  [-0.5, 0.3, 0],
  [0.5, -0.2, 0.3],
  [0, 0.5, -0.4],
];

export function RadioScreen() {
  const { wallet } = useAppStore();
  const playbackState = usePlaybackState();
  const [playlist, setPlaylist] = useState<RadioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spatialMode, setSpatialMode] = useState(false);
  const [spatialPositions, setSpatialPositions] = useState<[number, number, number][]>(DEFAULT_POSITIONS);
  const [waveHeights, setWaveHeights] = useState<number[]>(
    Array.from({ length: 20 }, () => 8)
  );
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPlaying = playbackState.state === State.Playing || spatialMode;
  const nowPlaying = playlist[currentIndex] ?? null;

  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';

  useEffect(() => {
    setupPlayer().then(fetchPlaylist);
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      animRef.current = setInterval(() => {
        setWaveHeights(Array.from({ length: 20 }, () => Math.random() * 40 + 8));
      }, 150);
    } else {
      if (animRef.current) clearInterval(animRef.current);
      setWaveHeights(Array.from({ length: 20 }, () => 8));
    }
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [isPlaying]);

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.index !== undefined) {
      setCurrentIndex(event.index);
      const track = playlist[event.index];
      if (track?.tier === 'pro' && track.stem_urls && track.stem_urls.length > 0) {
        await TrackPlayer.pause();
        setSpatialMode(true);
        if (track.spatial_path && track.spatial_path.length > 0) {
          setSpatialPositions(
            track.spatial_path.map((path) =>
              [path[0]?.[0] ?? 0, path[0]?.[1] ?? 0, path[0]?.[2] ?? 0] as [number, number, number]
            )
          );
        } else {
          setSpatialPositions(DEFAULT_POSITIONS);
        }
      } else {
        setSpatialMode(false);
      }
    }
  });

  const fetchPlaylist = async () => {
    try {
      if (config.demoMode) {
        const data = [...DEMO_RADIO];
        setPlaylist(data);
        await TrackPlayer.reset();
        await TrackPlayer.add(
          data.map((track) => ({
            id: track.id,
            url: resolveArweaveUrl(track.arweave_url),
            title: track.display_name ?? `${track.wallet_address.slice(0, 4)}...${track.wallet_address.slice(-4)}`,
            artist: `blocknoise — ${track.genre}`,
            artwork: 'https://blocknoise.io/cover.png',
          }))
        );
        return;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/radio`);
      const data: RadioTrack[] = await res.json();
      setPlaylist(data);
      if (data.length > 0) {
        await TrackPlayer.reset();
        const tracks = data.map((track) => ({
          id: track.id,
          url: resolveArweaveUrl(track.arweave_url),
          title: track.display_name ?? `${track.wallet_address.slice(0, 4)}...${track.wallet_address.slice(-4)}`,
          artist: `blocknoise — ${track.genre}`,
          artwork: 'https://blocknoise.io/cover.png',
        }));
        await TrackPlayer.add(tracks);
      }
    } catch (_error) {}
  };

  const handlePlayPause = async () => {
    if (spatialMode) {
      setSpatialMode(false);
      return;
    }
    if (playbackState.state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      const track = playlist[currentIndex];
      if (track?.tier === 'pro' && track.stem_urls && track.stem_urls.length > 0) {
        setSpatialMode(true);
      } else {
        await TrackPlayer.play();
      }
    }
  };

  const handleNext = async () => {
    setSpatialMode(false);
    await TrackPlayer.skipToNext();
  };

  const handlePrev = async () => {
    setSpatialMode(false);
    await TrackPlayer.skipToPrevious();
  };

  const trackWallet = nowPlaying
    ? `${nowPlaying.wallet_address.slice(0, 4)}...${nowPlaying.wallet_address.slice(-4)}`
    : '';

  return (
    <ScreenFrame headerLeft={shortWallet} headerRight="LOCKED">
      <View style={{ height: 24 }} />

      <BrandTitle />
      <Text style={styles.radioSubtitle}>seeker radio</Text>

      <View style={{ height: 24 }} />

      {/* visualizer recess box */}
      <RecessButton style={{ aspectRatio: 1 }}>
        <View style={styles.waveformContainer}>
          {waveHeights.map((h, i) => (
            <View
              key={i}
              style={[styles.waveBar, { height: h }]}
            />
          ))}
        </View>
      </RecessButton>

      <View style={{ height: 16 }} />

      {/* now playing info */}
      {nowPlaying && (
        <View style={styles.trackInfo}>
          <Text style={styles.trackWallet}>
            {nowPlaying.display_name ?? trackWallet}
          </Text>
          <Text style={styles.trackCatalog}>
            #blocknoise#{nowPlaying.catalog_number}
          </Text>
          <Text style={styles.trackGenre}>{nowPlaying.genre}</Text>
        </View>
      )}

      <View style={{ height: 16 }} />

      {/* transport controls — recess buttons */}
      <View style={styles.controls}>
        <RecessButton
          onPress={handlePrev}
          sticky={false}
          style={{ width: 48, height: 48 }}
        >
          <View style={styles.ctrlInner}>
            <Text style={styles.ctrlIcon}>{'\u25C0\u25C0'}</Text>
          </View>
        </RecessButton>

        <RecessButton
          onPress={handlePlayPause}
          selected={isPlaying}
          sticky={false}
          style={{ width: 60, height: 60 }}
        >
          <View style={styles.ctrlInner}>
            <Text style={styles.ctrlMainIcon}>
              {isPlaying ? '\u275A\u275A' : '\u25B6'}
            </Text>
          </View>
        </RecessButton>

        <RecessButton
          onPress={handleNext}
          sticky={false}
          style={{ width: 48, height: 48 }}
        >
          <View style={styles.ctrlInner}>
            <Text style={styles.ctrlIcon}>{'\u25B6\u25B6'}</Text>
          </View>
        </RecessButton>
      </View>

      <View style={{ flex: 1 }} />

      {/* spatial audio bridge */}
      {spatialMode && nowPlaying?.stem_urls && nowPlaying.stem_urls.length > 0 && (
        <SpatialAudioBridge
          stemUrls={resolveArweaveUrls(nowPlaying.stem_urls)}
          positions={spatialPositions}
          isPlaying={spatialMode}
        />
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  radioSubtitle: {
    fontFamily: typography.mono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  waveBar: {
    width: 4,
    backgroundColor: colors.white,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  trackWallet: {
    fontFamily: typography.mono,
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
  trackCatalog: {
    fontFamily: typography.mono,
    fontSize: 7,
    color: 'rgba(255,255,255,0.35)',
  },
  trackGenre: {
    fontFamily: typography.mono,
    fontSize: 8,
    color: colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  ctrlInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlIcon: {
    fontSize: 12,
    color: colors.white,
  },
  ctrlMainIcon: {
    fontSize: 18,
    color: colors.white,
  },
});
