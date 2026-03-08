import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { colors } from '../theme';
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

  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';

  const fetchLeaderboard = useCallback(async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/leaderboard`);
      const data = await res.json();
      setEntries(data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    if (!supabase) return;
    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchLeaderboard())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'usis' }, () => fetchLeaderboard())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeaderboard]);

  return (
    <View style={styles.screen}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.walletAddr}>{shortWallet}</Text>
        <Text style={styles.lockedLabel}>LOCKED</Text>
      </View>

      <View style={{ height: 16 }} />
      <Text style={styles.title}>LEADERBOARD</Text>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <LeaderboardRow
            entry={item}
            rank={index + 1}
          />
        )}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchLeaderboard(); }}
            tintColor={colors.white}
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
  screen: {
    flex: 1,
    backgroundColor: colors.blue,
    paddingTop: 28,
    paddingHorizontal: 28,
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
  lockedLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  title: {
    fontFamily: 'ABCSolar-Bold',
    fontSize: 36,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 38,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    marginTop: 12,
    marginHorizontal: -4,
  },
  empty: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    marginTop: 48,
  },
});
