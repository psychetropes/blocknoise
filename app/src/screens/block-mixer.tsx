import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useAppStore } from '../store';
import { BlockCanvas } from '../components/block/block-canvas';
import { SpatialAudioBridge } from '../components/block/spatial-audio-bridge';

type SpatialPoint = [number, number, number, number]; // x, y, z, timestamp

const DEFAULT_POSITIONS: [number, number, number][] = [
  [-0.5, 0.3, 0],
  [0.5, -0.2, 0.3],
  [0, 0.5, -0.4],
];

export function BlockMixerScreen({ navigation }: { navigation: any }) {
  const { generation } = useAppStore();
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isActive, setIsActive] = useState(false);
  const [positions, setPositions] = useState<[number, number, number][]>(DEFAULT_POSITIONS);
  const [activeStem, setActiveStem] = useState<number | null>(null);
  const pathsRef = useRef<SpatialPoint[][]>([[], [], []]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const [lockedBlocks, setLockedBlocks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleLockAll();
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
    setActiveStem(0);
    startTimeRef.current = Date.now();
  };

  const handleDrag = useCallback(
    (stemIndex: number, position: [number, number, number]) => {
      if (!isActive || lockedBlocks.has(stemIndex)) return;
      setPositions((prev) => {
        const next = [...prev] as [number, number, number][];
        next[stemIndex] = position;
        return next;
      });
      const timestamp = Date.now() - startTimeRef.current;
      pathsRef.current[stemIndex].push([...position, timestamp]);
    },
    [isActive, lockedBlocks]
  );

  const handleLockBlock = useCallback(() => {
    if (activeStem === null) return;
    setLockedBlocks((prev) => {
      const next = new Set(prev);
      next.add(activeStem);
      // auto-advance to next unlocked block
      for (let i = 0; i < 3; i++) {
        const candidate = (activeStem + 1 + i) % 3;
        if (!next.has(candidate)) {
          setActiveStem(candidate);
          return next;
        }
      }
      // all locked — navigate to mint
      handleLockAll();
      return next;
    });
  }, [activeStem]);

  const handleLockAll = useCallback(() => {
    setIsActive(false);
    setActiveStem(null);
    if (timerRef.current) clearInterval(timerRef.current);
    const closedPaths = pathsRef.current.map((path) => {
      if (path.length > 0) return [...path, path[0]];
      return path;
    });
    navigation.navigate('mint', { spatialPath: closedPaths });
  }, [navigation]);

  return (
    <View style={styles.screen}>
      {/* 3D room — the tron room canvas */}
      <View style={styles.tronRoom}>
        <BlockCanvas
          stems={generation.stemUrls}
          positions={positions}
          onDrag={handleDrag}
          isActive={isActive}
          activeStem={activeStem}
          onStemSelect={setActiveStem}
        />
        {/* inner border frame */}
        <View style={styles.roomBorder} pointerEvents="none" />
      </View>

      {/* timer — top right overlay */}
      <View style={styles.timerRow}>
        <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* block labels */}
      <View style={styles.blockLabels}>
        {[0, 1, 2].map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => !lockedBlocks.has(i) && setActiveStem(i)}
          >
            <Text
              style={[
                styles.blockLabel,
                activeStem === i && styles.blockLabelActive,
                lockedBlocks.has(i) && styles.blockLabelLocked,
              ]}
            >
              BLOCK{i + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 8 }} />

      {/* action button */}
      {!isActive ? (
        <TouchableOpacity style={styles.btnW} onPress={handleStart}>
          <Text style={styles.btnWText}>start mixing</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.btnLock} onPress={handleLockBlock}>
          <Text style={styles.btnLockText}>
            lock block {activeStem !== null ? activeStem + 1 : ''}
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 28 }} />

      <SpatialAudioBridge
        stemUrls={generation.stemUrls}
        positions={positions}
        isPlaying={isActive}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pureBlack,
    paddingTop: 28,
    paddingHorizontal: 25,
    paddingBottom: 0,
  },
  tronRoom: {
    position: 'absolute',
    top: 25,
    left: 25,
    right: 25,
    bottom: 340,
    backgroundColor: colors.pureBlack,
    borderWidth: 2,
    borderColor: 'rgba(0,18,255,0.25)',
    overflow: 'hidden',
  },
  roomBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,18,255,0.15)',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: -4,
  },
  timer: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  blockLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  blockLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    fontWeight: '700',
    color: colors.grey,
    letterSpacing: 1,
    paddingVertical: 8,
  },
  blockLabelActive: {
    color: colors.white,
  },
  blockLabelLocked: {
    color: colors.blue,
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
  btnLock: {
    backgroundColor: colors.blue,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.dark,
  },
  btnLockText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'lowercase',
    letterSpacing: 2,
  },
});
