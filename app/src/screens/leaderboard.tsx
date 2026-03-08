import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { theme } from '../theme';
import { LeaderboardRow } from '../components/leaderboard-row';
import { useAppStore } from '../store';

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
  created_at: string;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function LeaderboardScreen() {
  const { wallet } = useAppStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/leaderboard`);
      const data = await res.json();
      setEntries(data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    // supabase realtime — live leaderboard updates
    if (!supabase) return;

    const channel = supabase
      .channel('leaderboard-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => fetchLeaderboard()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'usis' },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

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
      // optimistic refresh
      fetchLeaderboard();
    } catch {
      // silent fail
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.cyan}
          />
        }
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
