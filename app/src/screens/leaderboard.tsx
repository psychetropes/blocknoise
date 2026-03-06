import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { LeaderboardRow } from '../components/leaderboard-row';
import { useAppStore } from '../store';

interface LeaderboardEntry {
  id: string;
  wallet_address: string;
  arweave_url: string;
  tier: 'standard' | 'pro';
  genre: string;
  score: number;
  vote_count: number;
  created_at: string;
}

export function LeaderboardScreen() {
  const { wallet } = useAppStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/leaderboard`);
      const data = await res.json();
      setEntries(data);
    } catch {
      // silent fail — will show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (usiId: string) => {
    if (!wallet.publicKey) return;

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      await fetch(`${apiUrl}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usiId,
          voterWallet: wallet.publicKey.toBase58(),
        }),
      });
      fetchLeaderboard();
    } catch {
      // silent fail
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>leaderboard</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <LeaderboardRow
            entry={item}
            rank={index + 1}
            onVote={() => handleVote(item.id)}
            currentWallet={wallet.publicKey?.toBase58() ?? null}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'loading...' : 'no usis minted yet'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  title: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 28,
    color: theme.cream,
    padding: 24,
    paddingBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  empty: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: theme.muted,
    textAlign: 'center',
    marginTop: 48,
  },
});
