import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { colors, typography } from '../theme';
import { useAppStore } from '../store';
import { RecessButton } from '../components/recess-button';
import { useGenerate } from '../hooks/use-generate';
import { ScreenFrame } from '../components/screen-frame';
import { DEMO_WAVEFORMS } from '../demo';

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function fallbackWaveform(length: number, phase: number) {
  return Array.from({ length }, (_, index) =>
    0.2 + Math.abs(Math.sin(index * 0.21 + phase)) * 0.8
  );
}

export function GenerateScreen({ navigation }: { navigation: any }) {
  const { wallet, generation } = useAppStore();
  const { generate, loading, error } = useGenerate();
  const hasStartedRef = useRef(false);
  const soundRefs = useRef<Array<Audio.Sound | null>>([null, null, null]);
  const [playingStems, setPlayingStems] = useState<Set<number>>(new Set());
  const [stemPositions, setStemPositions] = useState<number[]>([0, 0, 0]);
  const [stemDurations, setStemDurations] = useState<number[]>([30000, 30000, 30000]);
  const lastSeekAtRef = useRef<number[]>([0, 0, 0]);
  const waveformHeightsRef = useRef<number[]>([0, 0, 0]);

  const shortWallet = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
    : '';

  const isSpatial = generation.tier === 'pro';
  const hasStemUrls = generation.stemUrls.length > 0;
  const hasAudio = !!generation.audioUrl;
  const showGenerate = !hasAudio && !hasStemUrls;
  const hasStandardTrack = hasAudio && !hasStemUrls;

  useEffect(() => {
    if (showGenerate) {
      hasStartedRef.current = false;
    }
  }, [generation.paymentSignature, generation.tier, showGenerate]);

  useEffect(() => {
    if (!generation.paymentSignature || hasStartedRef.current || !showGenerate) {
      return;
    }

    hasStartedRef.current = true;
    generate();
  }, [generate, generation.paymentSignature, showGenerate]);

  useEffect(() => {
    return () => {
      soundRefs.current.forEach((sound) => {
        if (sound) {
          void sound.unloadAsync();
        }
      });
    };
  }, []);

  const stopAllStems = async () => {
    await Promise.all(
      soundRefs.current.map(async (sound, index) => {
        if (!sound) return;
        await sound.pauseAsync();
        await sound.unloadAsync();
        soundRefs.current[index] = null;
      })
    );
    setPlayingStems(new Set());
    setStemPositions([0, 0, 0]);
  };

  const handleGenerate = () => {
    generate();
  };

  const handleContinue = async () => {
    await stopAllStems();
    if (isSpatial && hasStemUrls) {
      navigation.navigate('block-mixer');
    } else {
      navigation.navigate('mint');
    }
  };

  const handleStemStatusUpdate = (stemIndex: number) => (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setStemPositions((prev) => {
      const next = [...prev];
      next[stemIndex] = status.positionMillis;
      return next;
    });

    setStemDurations((prev) => {
      const next = [...prev];
      next[stemIndex] = status.durationMillis ?? prev[stemIndex] ?? 30000;
      return next;
    });

    if (status.didJustFinish) {
      setPlayingStems((prev) => {
        const next = new Set(prev);
        next.delete(stemIndex);
        return next;
      });
      setStemPositions((prev) => {
        const next = [...prev];
        next[stemIndex] = 0;
        return next;
      });
    } else if (!status.isPlaying) {
      setPlayingStems((prev) => {
        if (!prev.has(stemIndex)) return prev;
        const next = new Set(prev);
        next.delete(stemIndex);
        return next;
      });
    }
  };

  const stopStem = async (stemIndex: number) => {
    const sound = soundRefs.current[stemIndex];
    if (!sound) return;
    await sound.stopAsync();
    await sound.unloadAsync();
    soundRefs.current[stemIndex] = null;
    setPlayingStems((prev) => {
      const next = new Set(prev);
      next.delete(stemIndex);
      return next;
    });
    setStemPositions((prev) => {
      const next = [...prev];
      next[stemIndex] = 0;
      return next;
    });
  };

  const ensureStemLoaded = async (stemIndex: number, uri: string) => {
    const existing = soundRefs.current[stemIndex];
    if (existing) {
      return existing;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false, isLooping: true, progressUpdateIntervalMillis: 100 },
      handleStemStatusUpdate(stemIndex)
    );

    soundRefs.current[stemIndex] = sound;
    return sound;
  };

  const handleStemPress = async (stemIndex: number, uri: string) => {
    const sound = await ensureStemLoaded(stemIndex, uri);
    const status = await sound.getStatusAsync();

    if (!status.isLoaded) {
      return;
    }

    if (status.isPlaying) {
      await sound.pauseAsync();
      setPlayingStems((prev) => {
        const next = new Set(prev);
        next.delete(stemIndex);
        return next;
      });
      return;
    }

    await sound.playAsync();
    setPlayingStems((prev) => new Set(prev).add(stemIndex));
  };

  const handleStemSeek = async (stemIndex: number, locationY: number, waveformHeight: number) => {
    const sound = soundRefs.current[stemIndex];
    if (!sound || waveformHeight <= 0) return;

    const now = Date.now();
    if (now - lastSeekAtRef.current[stemIndex] < 40) {
      return;
    }

    const duration = stemDurations[stemIndex] || 30000;
    const progress = Math.max(0, Math.min(1, locationY / waveformHeight));
    const nextPosition = Math.round(progress * duration);

    lastSeekAtRef.current[stemIndex] = now;
    await sound.setPositionAsync(nextPosition, {
      toleranceMillisBefore: 80,
      toleranceMillisAfter: 80,
    });
    setStemPositions((prev) => {
      const next = [...prev];
      next[stemIndex] = nextPosition;
      return next;
    });
  };

  const getWaveform = (index: number, length: number) => {
    const waveform = generation.stemWaveforms[index];
    if (waveform?.length) return waveform;

    if (isSpatial) {
      return DEMO_WAVEFORMS.stems[index] ?? fallbackWaveform(length, index + 0.4);
    }

    return DEMO_WAVEFORMS.standard[0] ?? fallbackWaveform(length, 0.9);
  };

  const renderWaveform = (index: number, length: number) => {
    const waveform = getWaveform(index, length);
    const progress = stemDurations[index] > 0 ? stemPositions[index] / stemDurations[index] : 0;
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        void handleStemSeek(index, evt.nativeEvent.locationY, waveformHeightsRef.current[index] ?? 0);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        void handleStemSeek(index, evt.nativeEvent.locationY, waveformHeightsRef.current[index] ?? 0);
      },
    });

    return (
      <View
        style={styles.vertWaveform}
        {...responder.panHandlers}
        onLayout={(evt) => {
          waveformHeightsRef.current[index] = evt.nativeEvent.layout.height;
        }}
      >
        {waveform.map((point, barIndex) => (
          <View
            key={`${index}-${barIndex}`}
            style={[
              styles.vBar,
              {
                width: `${Math.max(18, point * 100)}%`,
                backgroundColor:
                  barIndex / waveform.length <= progress
                    ? colors.white
                    : 'rgba(255,255,255,0.25)',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <ScreenFrame headerLeft={shortWallet} headerRight="LOCKED">
      <View style={{ height: 24 }} />
      <Text style={styles.title}>
        {isSpatial ? 'SPATIAL\nCOMPOSITION' : 'STANDARD\nCOMPOSITION'}
      </Text>
      <View style={{ height: 8 }} />

      {showGenerate && (
        <>
          <Text style={styles.subtitle}>
            {loading ? 'generating...' : 'payment received'}
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
              <Text style={styles.btnWText}>retry generation</Text>
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

      {hasStemUrls && (
        <>
          <Text style={styles.subtitle}>3 stems generated</Text>
          <View style={{ height: 16 }} />
          <View style={styles.stemColumns}>
            {generation.stemUrls.map((url, i) => (
              <View key={i} style={styles.stemCol}>
                <RecessButton
                  selected={playingStems.has(i)}
                  onPress={() => {
                    void handleStemPress(i, url);
                  }}
                  style={styles.stemPlayButton}
                >
                  <View style={styles.playCenter}>
                    <Text style={styles.playIcon}>
                      {playingStems.has(i) ? '\u275A\u275A' : '\u25B6'}
                    </Text>
                  </View>
                </RecessButton>
                <Text style={styles.blockLabel}>BLOCK{i + 1}</Text>
                {renderWaveform(i, 64)}
                <Text style={styles.stemTime}>
                  {playingStems.has(i) ? formatTime(stemPositions[i]) : formatTime(stemDurations[i])}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ height: 24 }} />
          <TouchableOpacity style={styles.btnW} onPress={() => void handleContinue()}>
            <Text style={styles.btnWText}>open block mixer</Text>
          </TouchableOpacity>
        </>
      )}

      {hasStandardTrack && (
        <>
          <Text style={styles.subtitle}>1 track generated</Text>
          <View style={{ height: 24 }} />
          <View style={styles.singleTrackWrap}>
            <View style={styles.singleTrackCol}>
              <RecessButton
                selected={playingStems.has(0)}
                onPress={() => {
                  void handleStemPress(0, generation.audioUrl!);
                }}
                style={styles.stemPlayButton}
              >
                <View style={styles.playCenter}>
                  <Text style={styles.playIcon}>
                    {playingStems.has(0) ? '\u275A\u275A' : '\u25B6'}
                  </Text>
                </View>
              </RecessButton>
              <Text style={styles.blockLabel}>TRACK1</Text>
              {renderWaveform(0, 84)}
              <Text style={styles.stemTime}>
                {playingStems.has(0) ? formatTime(stemPositions[0]) : formatTime(stemDurations[0])}
              </Text>
            </View>
          </View>
          <View style={{ height: 24 }} />
          <TouchableOpacity style={styles.btnW} onPress={() => void handleContinue()}>
            <Text style={styles.btnWText}>continue to mint</Text>
          </TouchableOpacity>
        </>
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.display,
    fontSize: 36,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.mono,
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    opacity: 0.6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  error: {
    fontFamily: typography.mono,
    fontSize: 13,
    color: colors.white,
    textAlign: 'center',
  },
  stemColumns: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  singleTrackWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleTrackCol: {
    width: '32%',
    minWidth: 96,
    maxWidth: 132,
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minHeight: 0,
  },
  stemCol: {
    flex: 1,
    gap: 6,
    alignItems: 'center',
    minHeight: 0,
  },
  stemPlayButton: {
    width: '100%',
    aspectRatio: 1,
  },
  playCenter: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontFamily: typography.mono,
    fontSize: 28,
    lineHeight: 28,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  blockLabel: {
    fontFamily: typography.display,
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
    justifyContent: 'space-between',
    minHeight: 0,
  },
  vBar: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  stemTime: {
    fontFamily: typography.mono,
    fontSize: 9,
    color: colors.white,
    textAlign: 'center',
  },
  btnW: {
    backgroundColor: colors.white,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  btnWText: {
    fontFamily: typography.mono,
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'lowercase',
    letterSpacing: 2,
  },
});
