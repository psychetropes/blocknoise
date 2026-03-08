import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useAppStore } from '../store';
import { AudioPlayer } from '../components/audio-player';
import { useGenerate } from '../hooks/use-generate';

export function GenerateScreen({ navigation }: { navigation: any }) {
  const { wallet, generation } = useAppStore();
  const { generate, loading, error } = useGenerate();

  const handleGenerate = () => {
    generate();
  };

  const handleContinue = () => {
    if (generation.tier === 'pro' && generation.stemUrls.length > 0) {
      navigation.navigate('block-mixer');
    } else {
      navigation.navigate('mint');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {generation.tier} usi
      </Text>
      <Text style={styles.subtitle}>
        generating from {wallet.publicKey?.toBase58().slice(0, 8)}...
      </Text>

      {!generation.audioUrl && generation.stemUrls.length === 0 && (
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.bg} />
          ) : (
            <Text style={styles.generateButtonText}>generate</Text>
          )}
        </TouchableOpacity>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {generation.audioUrl && (
        <View style={styles.playerContainer}>
          <AudioPlayer uri={generation.audioUrl} />
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>continue to mint</Text>
          </TouchableOpacity>
        </View>
      )}

      {generation.stemUrls.length > 0 && (
        <View style={styles.playerContainer}>
          <Text style={styles.stemsLabel}>3 stems generated</Text>
          {generation.stemUrls.map((url, i) => (
            <AudioPlayer key={i} uri={url} label={`stem ${i + 1}`} />
          ))}
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>open block mixer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 28,
    color: theme.cream,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: theme.muted,
    marginBottom: 32,
  },
  generateButton: {
    backgroundColor: theme.cyan,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
  },
  generateButtonText: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 18,
    color: theme.bg,
  },
  error: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: theme.magenta,
    marginTop: 16,
  },
  playerContainer: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  stemsLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: theme.cyan,
    marginBottom: 8,
  },
  continueButton: {
    backgroundColor: theme.magenta,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  continueButtonText: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 16,
    color: theme.cream,
  },
});
