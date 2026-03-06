import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useAppStore } from '../store';

type SpatialPoint = [number, number, number, number]; // x, y, z, timestamp

interface StemPath {
  points: SpatialPoint[];
}

export function BlockMixerScreen({ navigation }: { navigation: any }) {
  const { generation } = useAppStore();
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [isActive, setIsActive] = useState(false);
  const [paths, setPaths] = useState<StemPath[]>([
    { points: [] },
    { points: [] },
    { points: [] },
  ]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  };

  const handleLockMix = useCallback(() => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    // close paths back to origin for seamless loop
    const closedPaths = paths.map((p) => {
      if (p.points.length > 0) {
        const first = p.points[0];
        return { points: [...p.points, first] };
      }
      return p;
    });
    setPaths(closedPaths);
    navigation.navigate('mint', { spatialPath: closedPaths });
  }, [paths, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>the block</Text>
      <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>

      <View style={styles.canvas}>
        {/* three.js canvas will be rendered here via @react-three/fiber */}
        <Text style={styles.placeholder}>
          3d mixer — drag stems through the block
        </Text>
        <Text style={styles.stemCount}>
          {generation.stemUrls.length} stems loaded
        </Text>
      </View>

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
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 28,
    color: theme.cream,
    marginTop: 24,
  },
  timer: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 48,
    color: theme.cyan,
    marginVertical: 16,
  },
  canvas: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.muted2,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  placeholder: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: theme.muted,
    textAlign: 'center',
  },
  stemCount: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: theme.cyan,
    marginTop: 8,
  },
  startButton: {
    backgroundColor: theme.cyan,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  lockButton: {
    backgroundColor: theme.magenta,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonText: {
    fontFamily: 'ABCFavorit-Bold',
    fontSize: 18,
    color: theme.bg,
  },
});
