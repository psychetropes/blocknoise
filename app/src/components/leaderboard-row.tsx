import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { AudioPlayer } from './audio-player';

interface LeaderboardEntry {
  id: string;
  wallet_address: string;
  arweave_url: string;
  tier: 'standard' | 'pro';
  genre: string;
  score: number;
  vote_count: number;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  onVote: () => void;
  currentWallet: string | null;
}

export function LeaderboardRow({ entry, rank, onVote, currentWallet }: LeaderboardRowProps) {
  const [expanded, setExpanded] = useState(false);

  const shortWallet = `${entry.wallet_address.slice(0, 4)}...${entry.wallet_address.slice(-4)}`;
  const isOwnEntry = currentWallet === entry.wallet_address;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.rank}>#{rank}</Text>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.wallet}>{shortWallet}</Text>
            {entry.tier === 'pro' && (
              <Text style={styles.proBadge}>pro</Text>
            )}
          </View>
          <Text style={styles.genre}>{entry.genre}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{entry.score}</Text>
          <Text style={styles.votes}>{entry.vote_count} votes</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <AudioPlayer uri={entry.arweave_url} />
          {!isOwnEntry && currentWallet && (
            <TouchableOpacity style={styles.voteButton} onPress={onVote}>
              <Text style={styles.voteText}>upvote</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.bg2,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.muted2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  rank: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 16,
    color: theme.muted,
    width: 32,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wallet: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: theme.cream,
  },
  proBadge: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: theme.magenta,
    backgroundColor: theme.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  genre: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: theme.muted,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 20,
    color: theme.cyan,
  },
  votes: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: theme.muted,
  },
  expandedContent: {
    padding: 12,
    paddingTop: 0,
    gap: 12,
  },
  voteButton: {
    backgroundColor: theme.magenta,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  voteText: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 14,
    color: theme.cream,
  },
});
