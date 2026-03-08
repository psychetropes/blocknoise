import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme';

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
    fontFamily: 'ABCSolar-Bold',
    fontSize: 14,
    color: colors.white,
    marginBottom: 12,
  },
  scroll: {
    gap: 8,
    paddingRight: 24,
  },
  chip: {
    backgroundColor: colors.black,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 3,
    borderColor: colors.black,
  },
  chipActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  chipText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  chipTextActive: {
    color: colors.white,
  },
});
