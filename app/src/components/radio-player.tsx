import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface RadioPlayerProps {
  walletAddress: string;
  genre: string;
  isPlaying: boolean;
}

export function RadioPlayer({ walletAddress, genre, isPlaying }: RadioPlayerProps) {
  const shortWallet = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

  return (
    <View style={styles.container}>
      <Text style={styles.nowPlaying}>now playing</Text>
      <Text style={styles.wallet}>{shortWallet}</Text>
      <Text style={styles.genre}>{genre}</Text>
      <View style={styles.waveform}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: isPlaying ? Math.random() * 32 + 4 : 4,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  nowPlaying: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  wallet: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 18,
    color: colors.white,
    marginBottom: 4,
  },
  genre: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: colors.grey,
    marginBottom: 16,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 36,
    gap: 2,
  },
  bar: {
    width: 3,
    backgroundColor: colors.white,
  },
});
