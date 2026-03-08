import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TrackPlayer, {
  State,
  usePlaybackState,
  useTrackPlayerEvents,
  Event,
  Capability,
  RepeatMode,
} from 'react-native-track-player';
import { theme } from '../theme';
import { useAppStore } from '../store';
import { SpatialAudioBridge } from '../components/block/spatial-audio-bridge';
import { resolveArweaveUrl, resolveArweaveUrls } from '../utils/arweave';

interface RadioTrack {
  wallet_address: string;
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
    // player may already be set up
    playerInitialized = true;
  }
}

// default spatial positions for pro tracks without recorded paths
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

  useEffect(() => {
    setupPlayer().then(fetchPlaylist);
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  // animate waveform bars
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

  // track change — switch between spatial bridge and standard TrackPlayer
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.index !== undefined) {
      setCurrentIndex(event.index);

      const track = playlist[event.index];
      if (track?.tier === 'pro' && track.stem_urls && track.stem_urls.length > 0) {
        // pro track — pause TrackPlayer, use spatial audio bridge
        await TrackPlayer.pause();
        setSpatialMode(true);

        // use recorded spatial positions or defaults
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
        // standard track — tear down bridge, use TrackPlayer
        setSpatialMode(false);
      }
    }
  });

  const fetchPlaylist = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/radio`);
      const data: RadioTrack[] = await res.json();
      setPlaylist(data);

      if (data.length > 0) {
        await TrackPlayer.reset();
        const tracks = data.map((track) => ({
          id: track.id,
          url: resolveArweaveUrl(track.arweave_url),
          title: `${track.wallet_address.slice(0, 4)}...${track.wallet_address.slice(-4)}`,
          artist: `blocknoise — ${track.genre}`,
          artwork: 'https://blocknoise.xyz/cover.png',
        }));
        await TrackPlayer.add(tracks);
      }
    } catch {
      // silent fail
    }
  };

  const handlePlayPause = async () => {
    if (spatialMode) {
      // toggle spatial off to pause
      setSpatialMode(false);
      return;
    }

    if (playbackState.state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      // check if current track is pro with stems
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

  const handleVote = async () => {
    if (!wallet.publicKey || !nowPlaying) return;
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      await fetch(`${apiUrl}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usiId: nowPlaying.id,
          voterWallet: wallet.publicKey.toBase58(),
        }),
      });
    } catch {
      // silent fail
    }
  };

  const shortWallet = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>seeker radio</Text>

      <View style={styles.nowPlayingCard}>
        {nowPlaying ? (
          <>
            <Text style={styles.nowLabel}>now playing</Text>
            <Text style={styles.walletAddress}>
              {shortWallet(nowPlaying.wallet_address)}
            </Text>
            <Text style={styles.catalogLabel}>
              #blocknoise#{nowPlaying.catalog_number}
            </Text>
            <Text style={styles.genreTag}>{nowPlaying.genre}</Text>
            {nowPlaying.tier === 'pro' && (
              <Text style={styles.proBadge}>pro — spatial</Text>
            )}

            <View style={styles.waveform}>
              {waveHeights.map((h, i) => (
                <View
                  key={i}
                  style={[styles.waveBar, { height: h }]}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.empty}>no tracks available</Text>
        )}
      </View>

      {/* spatial audio bridge — hidden webview for pro HRTF playback */}
      {spatialMode && nowPlaying?.stem_urls && nowPlaying.stem_urls.length > 0 && (
        <SpatialAudioBridge
          stemUrls={resolveArweaveUrls(nowPlaying.stem_urls)}
          positions={spatialPositions}
          isPlaying={spatialMode}
        />
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.skipButton} onPress={handlePrev}>
          <Text style={styles.skipText}>prev</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
          <Text style={styles.playButtonText}>
            {isPlaying ? 'pause' : 'play'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
          <Text style={styles.skipText}>next</Text>
        </TouchableOpacity>
      </View>

      {nowPlaying && wallet.connected && (
        <TouchableOpacity style={styles.voteButton} onPress={handleVote}>
          <Text style={styles.voteButtonText}>upvote</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.queueInfo}>
        {playlist.length > 0
          ? `${currentIndex + 1} / ${playlist.length} tracks`
          : 'queue empty'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 28,
    color: theme.cream,
    marginTop: 24,
    marginBottom: 32,
  },
  nowPlayingCard: {
    width: '100%',
    backgroundColor: theme.bg2,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.muted2,
  },
  nowLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: theme.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  walletAddress: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 18,
    color: theme.cyan,
    marginBottom: 4,
  },
  catalogLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: theme.muted,
    marginBottom: 8,
  },
  genreTag: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: theme.muted,
    backgroundColor: theme.bg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  proBadge: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: theme.magenta,
    marginBottom: 24,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 48,
    gap: 3,
    marginTop: 16,
  },
  waveBar: {
    width: 4,
    backgroundColor: theme.cyan,
    borderRadius: 2,
  },
  empty: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: theme.muted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skipText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: theme.muted,
  },
  playButton: {
    backgroundColor: theme.cyan,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
  },
  playButtonText: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 18,
    color: theme.bg,
  },
  voteButton: {
    backgroundColor: theme.magenta,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  voteButtonText: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 16,
    color: theme.cream,
  },
  queueInfo: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: theme.muted,
    marginTop: 16,
  },
});
