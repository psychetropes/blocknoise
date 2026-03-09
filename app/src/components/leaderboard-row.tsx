import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { colors, typography } from '../theme';
import { resolveArweaveUrl } from '../utils/arweave';

interface LeaderboardEntry {
  id: string;
  wallet_address: string;
  display_name: string | null;
  arweave_url: string;
  tier: 'standard' | 'pro';
  genre: string;
  score: number;
  vote_count: number;
  catalog_number: number;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
}

export function LeaderboardRow({ entry, rank }: LeaderboardRowProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const shortWallet = `${entry.wallet_address.slice(0, 4)}...${entry.wallet_address.slice(-4)}`;
  const displayLabel = entry.display_name ?? shortWallet;

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handlePlay = async () => {
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: resolveArweaveUrl(entry.arweave_url) },
        { shouldPlay: true, isLooping: true },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded) setIsPlaying(status.isPlaying);
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } else if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const seed = rank * 2.3;

  return (
    <View style={styles.container}>
      {/* play icon */}
      <TouchableOpacity onPress={handlePlay} style={styles.playCol}>
        <Text style={styles.playIcon}>{isPlaying ? '||' : '\u25B6'}</Text>
      </TouchableOpacity>

      {/* rank */}
      <Text style={styles.rank}>{rank}</Text>

      {/* info */}
      <View style={styles.info}>
        <View style={styles.walletRow}>
          <Text style={styles.wallet}>{displayLabel}</Text>
          <Text style={styles.catalog}>#blocknoise#{entry.catalog_number}</Text>
        </View>
        {/* mini waveform */}
        <View style={styles.waveRow}>
          {Array.from({ length: 30 }, (_, i) => (
            <View
              key={i}
              style={{
                width: 2,
                height: Math.round(1 + Math.abs(Math.sin(seed + i * 0.7) * 7)),
                backgroundColor: 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </View>
        <Text style={styles.meta}>{entry.genre}</Text>
      </View>

      {/* score */}
      <View style={styles.scoreCol}>
        <Text style={styles.score}>{entry.score}</Text>
        <Text style={styles.votes}>{entry.vote_count} votes</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  playCol: {
    width: 14,
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 10,
    color: colors.black,
    lineHeight: 14,
  },
  rank: {
    fontFamily: typography.mono,
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    width: 16,
    textAlign: 'right',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wallet: {
    fontFamily: typography.mono,
    fontSize: 8,
    fontWeight: '700',
    color: colors.white,
  },
  catalog: {
    fontFamily: typography.mono,
    fontSize: 7,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.3,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    height: 8,
    marginTop: 1,
  },
  meta: {
    fontFamily: typography.mono,
    fontSize: 5,
    color: colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreCol: {
    alignItems: 'flex-end',
    marginLeft: 'auto',
  },
  score: {
    fontFamily: typography.accent,
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 10,
  },
  votes: {
    fontFamily: typography.mono,
    fontSize: 5,
    color: colors.grey,
    lineHeight: 6,
  },
});
