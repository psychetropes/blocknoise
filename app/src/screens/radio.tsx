import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useAppStore } from '../store';

interface NowPlaying {
  wallet_address: string;
  arweave_url: string;
  genre: string;
  tier: 'standard' | 'pro';
  id: string;
}

export function RadioScreen() {
  const { wallet } = useAppStore();
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<NowPlaying[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchPlaylist();
  }, []);

  const fetchPlaylist = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/radio`);
      const data = await res.json();
      setPlaylist(data);
      if (data.length > 0) {
        setNowPlaying(data[0]);
      }
    } catch {
      // silent fail
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // todo: integrate react-native-track-player
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
            <Text style={styles.walletAddress}>
              {shortWallet(nowPlaying.wallet_address)}
            </Text>
            <Text style={styles.genreTag}>{nowPlaying.genre}</Text>
            {nowPlaying.tier === 'pro' && (
              <Text style={styles.proBadge}>pro</Text>
            )}

            <View style={styles.waveform}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: isPlaying
                        ? Math.random() * 40 + 8
                        : 8,
                    },
                  ]}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.empty}>no tracks available</Text>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
          <Text style={styles.playButtonText}>
            {isPlaying ? 'pause' : 'play'}
          </Text>
        </TouchableOpacity>

        {nowPlaying && wallet.connected && (
          <TouchableOpacity style={styles.voteButton} onPress={handleVote}>
            <Text style={styles.voteButtonText}>upvote</Text>
          </TouchableOpacity>
        )}
      </View>
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
  walletAddress: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 18,
    color: theme.cyan,
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
    gap: 16,
    marginTop: 32,
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
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  voteButtonText: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 18,
    color: theme.cream,
  },
});
