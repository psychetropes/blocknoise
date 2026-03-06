import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface GenreSelectorProps {
  selected: string | null;
  onSelect: (genre: string) => void;
}

export function GenreSelector({ selected, onSelect }: GenreSelectorProps) {
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/genres`);
      const data = await res.json();
      setGenres(data.map((g: { name: string }) => g.name));
    } catch {
      // fallback genres
      setGenres([
        'ambient', 'drone', 'experimental pop', 'glitch', 'harsh noise',
        'idm', 'industrial', 'lo-fi', 'minimalism', 'noise wall',
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>genre</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {genres.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[
              styles.chip,
              selected === genre && styles.chipActive,
            ]}
            onPress={() => onSelect(genre)}
          >
            <Text
              style={[
                styles.chipText,
                selected === genre && styles.chipTextActive,
              ]}
            >
              {genre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 14,
    color: theme.cream,
    marginBottom: 12,
  },
  scroll: {
    gap: 8,
    paddingRight: 24,
  },
  chip: {
    backgroundColor: theme.bg2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.muted2,
  },
  chipActive: {
    borderColor: theme.cyan,
    backgroundColor: theme.bg,
  },
  chipText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: theme.muted,
  },
  chipTextActive: {
    color: theme.cyan,
  },
});
