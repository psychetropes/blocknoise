import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useAppStore } from '../store';
import { AudioPlayer } from '../components/audio-player';
import { RecessButton } from '../components/recess-button';
import { useGenerate } from '../hooks/use-generate';

export function GenerateScreen({ navigation }: { navigation: any }) {
  const { wallet, generation } = useAppStore();
  const { generate, loading, error } = useGenerate();

  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';

  const isSpatial = generation.tier === 'pro';
  const hasStemUrls = generation.stemUrls.length > 0;
  const hasAudio = !!generation.audioUrl;
  const showGenerate = !hasAudio && !hasStemUrls;

  const handleGenerate = () => {
    generate();
  };

  const handleContinue = () => {
    if (isSpatial && hasStemUrls) {
      navigation.navigate('block-mixer');
    } else {
      navigation.navigate('mint');
    }
  };

  return (
    <View style={styles.screen}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.walletAddr}>{shortWallet}</Text>
        <Text style={styles.lockedLabel}>LOCKED</Text>
      </View>

      <View style={{ height: 24 }} />
      <Text style={styles.title}>
        {isSpatial ? 'SPATIAL\nCOMPOSITION' : 'STANDARD\nCOMPOSITION'}
      </Text>
      <View style={{ height: 8 }} />

      {showGenerate && (
        <>
          <Text style={styles.subtitle}>
            {loading ? 'generating...' : 'ready to generate'}
          </Text>
          <View style={{ height: 24 }} />
          <TouchableOpacity
            style={[styles.btnW, loading && { opacity: 0.5 }]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <Text style={styles.btnWText}>generate</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {error && (
        <>
          <View style={{ height: 16 }} />
          <Text style={styles.error}>{error}</Text>
        </>
      )}

      {/* spatial: 3-column stem layout */}
      {hasStemUrls && (
        <>
          <Text style={styles.subtitle}>3 stems generated</Text>
          <View style={{ height: 16 }} />
          <View style={styles.stemColumns}>
            {generation.stemUrls.map((url, i) => (
              <View key={i} style={styles.stemCol}>
                <RecessButton style={{ width: '100%', aspectRatio: 1 }}>
                  <View style={styles.playCenter}>
                    <Text style={styles.playIcon}>{'\u25B6'}</Text>
                  </View>
                </RecessButton>
                <Text style={styles.blockLabel}>BLOCK{i + 1}</Text>
                {/* vertical waveform placeholder */}
                <View style={styles.vertWaveform}>
                  {Array.from({ length: 40 }, (_, j) => (
                    <View
                      key={j}
                      style={[
                        styles.vBar,
                        {
                          width: `${15 + Math.abs(Math.sin(i * 3 + j * 0.5)) * 70}%`,
                          backgroundColor: j / 40 < 0.5
                            ? colors.white
                            : 'rgba(255,255,255,0.25)',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.stemTime}>0:30</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 24 }} />
          <TouchableOpacity style={styles.btnW} onPress={handleContinue}>
            <Text style={styles.btnWText}>open block mixer</Text>
          </TouchableOpacity>
        </>
      )}

      {/* standard: single player */}
      {hasAudio && !hasStemUrls && (
        <>
          <View style={{ height: 24 }} />
          <AudioPlayer uri={generation.audioUrl!} />
          <View style={{ height: 24 }} />
          <TouchableOpacity style={styles.btnW} onPress={handleContinue}>
            <Text style={styles.btnWText}>continue to mint</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.blue,
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 28,
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
  subtitle: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    opacity: 0.6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  error: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: colors.white,
    textAlign: 'center',
  },
  stemColumns: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  stemCol: {
    flex: 1,
    gap: 8,
    alignItems: 'center',
  },
  playCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 18,
    color: colors.white,
  },
  blockLabel: {
    fontFamily: 'ABCSolar-Bold',
    fontSize: 18,
    color: colors.white,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0,
  },
  vertWaveform: {
    flex: 1,
    width: '100%',
    gap: 1,
    alignItems: 'center',
  },
  vBar: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  stemTime: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: colors.white,
    textAlign: 'center',
  },
  btnW: {
    backgroundColor: colors.white,
    paddingVertical: 20,
    alignItems: 'center',
  },
  btnWText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'lowercase',
    letterSpacing: 2,
  },
});
