import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useAppStore } from '../store';
import { BlockCanvas } from '../components/block/block-canvas';
import { AudioPlayer } from '../components/audio-player';
import { SpatialAudioBridge } from '../components/block/spatial-audio-bridge';

type SpatialPoint = [number, number, number, number]; // x, y, z, timestamp

const DEFAULT_POSITIONS: [number, number, number][] = [
  [-0.5, 0.3, 0],
  [0.5, -0.2, 0.3],
  [0, 0.5, -0.4],
];

export function BlockMixerScreen({ navigation }: { navigation: any }) {
  const { generation } = useAppStore();
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [isActive, setIsActive] = useState(false);
  const [positions, setPositions] = useState<[number, number, number][]>(DEFAULT_POSITIONS);
  const [activeStem, setActiveStem] = useState<number | null>(null);
  const pathsRef = useRef<SpatialPoint[][]>([[], [], []]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleLockMix();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsActive(true);
    startTimeRef.current = Date.now();
  };

  const handleDrag = useCallback(
    (stemIndex: number, position: [number, number, number]) => {
      if (!isActive) return;

      setPositions((prev) => {
        const next = [...prev] as [number, number, number][];
        next[stemIndex] = position;
        return next;
      });

      // record path point
      const timestamp = Date.now() - startTimeRef.current;
      pathsRef.current[stemIndex].push([...position, timestamp]);
    },
    [isActive]
  );

  const handleLockMix = useCallback(() => {
    setIsActive(false);
    setActiveStem(null);
    if (timerRef.current) clearInterval(timerRef.current);

    // close paths back to origin for seamless loop
    const closedPaths = pathsRef.current.map((path) => {
      if (path.length > 0) {
        return [...path, path[0]];
      }
      return path;
    });

    navigation.navigate('mint', { spatialPath: closedPaths });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>the block</Text>
        <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
      </View>

      <View style={styles.canvasWrapper}>
        <BlockCanvas
          stems={generation.stemUrls}
          positions={positions}
          onDrag={handleDrag}
          isActive={isActive}
          activeStem={activeStem}
          onStemSelect={setActiveStem}
        />
      </View>

      {/* stem indicators */}
      <View style={styles.stemRow}>
        {generation.stemUrls.map((url, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.stemIndicator,
              activeStem === i && styles.stemIndicatorActive,
              { borderColor: [theme.cyan, theme.magenta, '#FFD700'][i] },
            ]}
            onPress={() => setActiveStem(activeStem === i ? null : i)}
          >
            <Text
              style={[
                styles.stemLabel,
                { color: [theme.cyan, theme.magenta, '#FFD700'][i] },
              ]}
            >
              stem {i + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* mini players */}
      <View style={styles.playersRow}>
        {generation.stemUrls.map((url, i) => (
          <View key={i} style={styles.miniPlayer}>
            <AudioPlayer uri={url} label={`s${i + 1}`} />
          </View>
        ))}
      </View>

      <SpatialAudioBridge
        stemUrls={generation.stemUrls}
        positions={positions}
        isPlaying={isActive}
      />

      {!isActive ? (
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.buttonText}>start mixing</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.lockButton} onPress={handleLockMix}>
          <Text style={styles.buttonText}>lock mix</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 24,
    color: theme.cream,
  },
  timer: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 40,
    color: theme.cyan,
    marginTop: 4,
  },
  canvasWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.muted2,
    marginVertical: 8,
  },
  stemRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  stemIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: theme.bg2,
  },
  stemIndicatorActive: {
    backgroundColor: theme.bg,
  },
  stemLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
  },
  playersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  miniPlayer: {
    flex: 1,
  },
  startButton: {
    backgroundColor: theme.cyan,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  lockButton: {
    backgroundColor: theme.magenta,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 16,
    color: theme.bg,
  },
});
