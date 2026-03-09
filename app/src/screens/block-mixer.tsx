import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors, typography } from '../theme';
import { useAppStore } from '../store';
import { BlockCanvas } from '../components/block/block-canvas';
import { SpatialAudioBridge } from '../components/block/spatial-audio-bridge';
import { ScreenFrame } from '../components/screen-frame';

type SpatialPoint = [number, number, number, number];
type AxisKey = 'x' | 'y' | 'z';
type WaveShape = 'sine' | 'tri' | 'square' | 'saw';

type LfoAxisState = {
  shape: WaveShape;
  rate: number;
  depth: number;
};

type LfoState = Record<AxisKey, LfoAxisState>;

const DEFAULT_POSITIONS: [number, number, number][] = [
  [-0.5, -0.55, 0.15],
  [0.2, -0.1, 0.05],
  [0.55, 0.25, -0.2],
];
const ROOM_BOUNDS = {
  x: 1.1,
  y: 1.55,
  z: 1.8,
} as const;

const AXES: AxisKey[] = ['x', 'y', 'z'];
const SHAPES: { label: string; value: WaveShape }[] = [
  { label: 'SIN', value: 'sine' },
  { label: 'TRI', value: 'tri' },
  { label: 'SQR', value: 'square' },
  { label: 'SAW', value: 'saw' },
];

const DEFAULT_LFO: LfoState = {
  x: { shape: 'sine', rate: 0.0, depth: 0.9 },
  y: { shape: 'sine', rate: 0.0, depth: 0.9 },
  z: { shape: 'sine', rate: 0.0, depth: 0.9 },
};

const cloneLfoState = (): LfoState => ({
  x: { ...DEFAULT_LFO.x },
  y: { ...DEFAULT_LFO.y },
  z: { ...DEFAULT_LFO.z },
});

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function buildWavePath(shape: WaveShape, width: number, height: number) {
  const steps = 32;
  const amplitude = height * 0.28;
  const centerY = height * 0.44;
  const points: string[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = t * width;
    let normalized = 0;

    if (shape === 'sine') {
      normalized = Math.sin(t * Math.PI * 2);
    } else if (shape === 'tri') {
      normalized = 1 - 4 * Math.abs(Math.round(t - 0.25) - (t - 0.25));
    } else if (shape === 'square') {
      normalized = t < 0.5 ? 1 : -1;
    } else {
      normalized = 1 - 2 * t;
    }

    const y = centerY - normalized * amplitude;
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return points.join(' ');
}

function axisToIndex(axis: AxisKey) {
  if (axis === 'x') return 0;
  if (axis === 'y') return 1;
  return 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function availableAxisOffset(base: number, bound: number, lfo: number) {
  if (lfo >= 0) {
    return (bound - base) * lfo;
  }
  return (base + bound) * lfo;
}

function compactSpatialTrack(track: SpatialPoint[], maxPoints = 120): SpatialPoint[] {
  if (track.length <= maxPoints) {
    return track;
  }

  const step = (track.length - 1) / (maxPoints - 1);
  const compacted: SpatialPoint[] = [];

  for (let i = 0; i < maxPoints; i += 1) {
    compacted.push(track[Math.round(i * step)]);
  }

  return compacted;
}

function lfoValue(shape: WaveShape, t: number) {
  const normalized = ((t % 1) + 1) % 1;
  if (shape === 'sine') return Math.sin(normalized * Math.PI * 2);
  if (shape === 'tri') return normalized < 0.5 ? normalized * 4 - 1 : 3 - normalized * 4;
  if (shape === 'square') return normalized < 0.5 ? 1 : -1;
  return normalized * 2 - 1;
}

function LfoWaveform({
  axis,
  config,
  elapsedSeconds,
}: {
  axis: AxisKey;
  config: LfoAxisState;
  elapsedSeconds: number;
}) {
  const width = 100;
  const height = 46;
  const path = useMemo(() => buildWavePath(config.shape, width, height), [config.shape]);
  const cyclePosition = ((elapsedSeconds * (0.15 + config.rate * 2.4)) % 1 + 1) % 1;
  const animatedValue = lfoValue(config.shape, cyclePosition);
  const handleX = 8 + cyclePosition * 84;
  const handleY = 23 - animatedValue * (6 + config.depth * 12);

  return (
    <View style={styles.waveCard}>
      <Text style={styles.waveAxisLabel}>{axis.toUpperCase()}</Text>
      <Svg width="100%" height={46} viewBox={`0 0 ${width} ${height}`}>
        <Rect x="0.5" y="0.5" width="99" height="45" fill="transparent" stroke="rgba(0,18,255,0.9)" />
        <Line x1="0" y1="23" x2="100" y2="23" stroke="rgba(255,255,255,0.08)" />
        <Path d={path} stroke={colors.blue} strokeWidth="2.2" fill="none" />
        <Circle cx={handleX} cy={handleY} r="6.5" fill={colors.white} />
        <Circle cx={handleX} cy={handleY} r="9" stroke={colors.blue} strokeWidth="1.5" fill="none" opacity="0.8" />
      </Svg>
    </View>
  );
}

function ShapeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.shapeButton, selected && styles.shapeButtonSelected]}>
      <Text style={[styles.shapeButtonText, selected && styles.shapeButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const trackRef = useRef<View | null>(null);
  const boundsRef = useRef({ x: 0, width: 0 });

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      boundsRef.current = { x, width };
    });
  }, []);

  const handleMove = useCallback(
    (pageX: number) => {
      const { x, width } = boundsRef.current;
      if (width <= 0) return;
      const next = clamp((pageX - x) / width, 0, 1);
      if (Math.abs(next - value) < 0.001) return;
      onChange(next);
    },
    [onChange, value]
  );

  const handleLayout = useCallback((_event: LayoutChangeEvent) => {
    measureTrack();
  }, [measureTrack]);

  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View
        ref={trackRef}
        style={styles.sliderTrackWrap}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          measureTrack();
          handleMove(event.nativeEvent.pageX);
        }}
        onResponderMove={(event) => handleMove(event.nativeEvent.pageX)}
      >
        <View pointerEvents="none" style={styles.sliderTrack} />
        <View pointerEvents="none" style={[styles.sliderFill, { width: `${value * 100}%` }]} />
        <View pointerEvents="none" style={[styles.sliderThumb, { left: `${value * 100}%` }]} />
      </View>
    </View>
  );
}

function LfoColumn({
  axis,
  config,
  onShapeChange,
  onRateChange,
  onDepthChange,
  elapsedSeconds,
}: {
  axis: AxisKey;
  config: LfoAxisState;
  onShapeChange: (shape: WaveShape) => void;
  onRateChange: (value: number) => void;
  onDepthChange: (value: number) => void;
  elapsedSeconds: number;
}) {
  return (
    <View style={styles.lfoColumn}>
      <LfoWaveform axis={axis} config={config} elapsedSeconds={elapsedSeconds} />
      <View style={styles.shapeRow}>
        {SHAPES.map((shape) => (
          <ShapeButton
            key={shape.value}
            label={shape.label}
            selected={config.shape === shape.value}
            onPress={() => onShapeChange(shape.value)}
          />
        ))}
      </View>
      <SliderRow label="RATE" value={config.rate} onChange={onRateChange} />
      <SliderRow label="DPTH" value={config.depth} onChange={onDepthChange} />
    </View>
  );
}

export function BlockMixerScreen({ navigation }: { navigation: any }) {
  const { generation } = useAppStore();
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isActive, setIsActive] = useState(false);
  const [basePositions, setBasePositions] = useState<[number, number, number][]>(DEFAULT_POSITIONS);
  const [positions, setPositions] = useState<[number, number, number][]>(DEFAULT_POSITIONS);
  const [activeStem, setActiveStem] = useState<number | null>(0);
  const [lockedBlocks, setLockedBlocks] = useState<Set<number>>(new Set());
  const [mutedBlocks, setMutedBlocks] = useState<Set<number>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lfoByBlock, setLfoByBlock] = useState<LfoState[]>([
    cloneLfoState(),
    cloneLfoState(),
    cloneLfoState(),
  ]);
  const pathsRef = useRef<SpatialPoint[][]>([[], [], []]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastRecordRef = useRef(0);
  const basePositionsRef = useRef(basePositions);
  const lfoByBlockRef = useRef(lfoByBlock);
  const lockedBlocksRef = useRef(lockedBlocks);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    basePositionsRef.current = basePositions;
  }, [basePositions]);

  useEffect(() => {
    lfoByBlockRef.current = lfoByBlock;
  }, [lfoByBlock]);

  useEffect(() => {
    lockedBlocksRef.current = lockedBlocks;
  }, [lockedBlocks]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!isActive || timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleLockAll();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeRemaining]);

  const activeBlockIndex = activeStem ?? 0;
  const activeLfo = lfoByBlock[activeBlockIndex];
  const visibleStems = useMemo(
    () =>
      [0, 1, 2].filter(
        (index) => lockedBlocks.has(index) || (activeStem !== null && index === activeStem)
      ),
    [activeStem, lockedBlocks]
  );
  const volumes = useMemo(
    () =>
      [0, 1, 2].map((index) =>
        visibleStems.includes(index) && !mutedBlocks.has(index) ? 1 : 0
      ),
    [mutedBlocks, visibleStems]
  );

  const handleStart = useCallback(() => {
    setIsActive(true);
    setTimeRemaining(300);
    lastRecordRef.current = 0;
    if (lockedBlocks.size === 3) {
      setLockedBlocks(new Set());
    }
    setActiveStem(0);
    startTimeRef.current = Date.now();
    pathsRef.current = [[], [], []];
  }, [lockedBlocks.size]);

  const handleDrag = useCallback(
    (stemIndex: number, position: [number, number, number]) => {
      if (!isActive || lockedBlocks.has(stemIndex)) return;
      setBasePositions((prev) => {
        const next = [...prev] as [number, number, number][];
        next[stemIndex] = position;
        return next;
      });
    },
    [isActive, lockedBlocks]
  );

  const handleLockAll = useCallback(() => {
    setIsActive(false);
    setActiveStem(null);
    if (timerRef.current) clearInterval(timerRef.current);
    const closedPaths = pathsRef.current.map((path) => {
      if (path.length > 0) return [...path, path[0]];
      return path;
    });
    const compactedPaths = closedPaths.map((path) => compactSpatialTrack(path));
    navigation.navigate('mint', { spatialPath: compactedPaths });
  }, [navigation]);

  const handleLockBlock = useCallback(() => {
    if (activeStem === null) return;
    const nextLocked = new Set(lockedBlocks);
    nextLocked.add(activeStem);
    setLockedBlocks(nextLocked);

    for (let i = 0; i < 3; i += 1) {
      const candidate = (activeStem + 1 + i) % 3;
      if (!nextLocked.has(candidate)) {
        setActiveStem(candidate);
        return;
      }
    }

    handleLockAll();
  }, [activeStem, handleLockAll, lockedBlocks]);

  const updateLfo = useCallback(
    (axis: AxisKey, patch: Partial<LfoAxisState>) => {
      setLfoByBlock((prev) =>
        prev.map((block, index) =>
          index === activeBlockIndex
            ? {
                ...block,
                [axis]: {
                  ...block[axis],
                  ...patch,
                },
              }
            : block
        )
      );
    },
    [activeBlockIndex]
  );

  const toggleMute = useCallback((index: number) => {
    setMutedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const elapsedSeconds = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
      setElapsedSeconds((prev) =>
        Math.abs(prev - elapsedSeconds) > 0.03 ? elapsedSeconds : prev
      );
      const nextPositions = basePositionsRef.current.map((base, index) => {
        let [x, y, z] = base;
        const blockLfo = lfoByBlockRef.current[index];

        if (lockedBlocksRef.current.has(index)) {
          x += Math.sin(elapsedSeconds * 0.8 + index) * 0.08;
          y += Math.cos(elapsedSeconds * 0.56 + index * 0.7) * 0.06;
          z += Math.sin(elapsedSeconds * 0.4 + index + 1) * 0.05;
        }

        if (blockLfo) {
          AXES.forEach((axis) => {
            const config = blockLfo[axis];
            const frequency = 0.1 + config.rate * 3.9;
            const value = lfoValue(config.shape, elapsedSeconds * frequency);
            const axisIndex = axisToIndex(axis);
            if (axisIndex === 0) {
              x += availableAxisOffset(base[0], ROOM_BOUNDS.x, value) * config.depth;
            }
            if (axisIndex === 1) {
              y += availableAxisOffset(base[1], ROOM_BOUNDS.y, value) * config.depth;
            }
            if (axisIndex === 2) {
              z += availableAxisOffset(base[2], ROOM_BOUNDS.z, value) * config.depth;
            }
          });
        }

        return [
          clamp(x, -ROOM_BOUNDS.x, ROOM_BOUNDS.x),
          clamp(y, -ROOM_BOUNDS.y, ROOM_BOUNDS.y),
          clamp(z, -ROOM_BOUNDS.z, ROOM_BOUNDS.z),
        ] as [number, number, number];
      });

      setPositions((prev) => {
        const changed = nextPositions.some(
          (position, index) =>
            Math.abs(position[0] - prev[index][0]) > 0.002 ||
            Math.abs(position[1] - prev[index][1]) > 0.002 ||
            Math.abs(position[2] - prev[index][2]) > 0.002
        );
        return changed ? nextPositions : prev;
      });

      if (isActiveRef.current && startTimeRef.current && now - lastRecordRef.current >= 80) {
        nextPositions.forEach((position, index) => {
          if (lockedBlocksRef.current.has(index)) return;
          pathsRef.current[index].push([...position, now - startTimeRef.current]);
        });
        lastRecordRef.current = now;
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <ScreenFrame
      backgroundColor={colors.pureBlack}
      contentStyle={styles.screenContent}
    >
      <>
        <View style={styles.roomWrap}>
        <BlockCanvas
          stems={generation.stemUrls}
          positions={positions}
          onDrag={handleDrag}
          isActive={isActive}
          activeStem={activeStem}
          visibleStems={visibleStems}
          onStemSelect={setActiveStem}
        />
          <View pointerEvents="none" style={styles.timerWrap}>
            <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <View style={styles.lfoSection}>
            <View style={styles.lfoHeader}>
              <Text style={styles.lfoTitle}>LFO</Text>
              <View style={styles.muteGroup}>
                {[0, 1, 2].map((index) => (
                  <Pressable
                    key={index}
                    onPress={() => toggleMute(index)}
                    style={[styles.muteButton, mutedBlocks.has(index) && styles.muteButtonMuted]}
                  >
                    <Text
                      style={[
                        styles.muteButtonText,
                        mutedBlocks.has(index) && styles.muteButtonTextMuted,
                      ]}
                    >
                      M{index + 1}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.blockIndicator}>BLOCK{activeBlockIndex + 1}</Text>
            </View>

            <View style={styles.columns}>
              {AXES.map((axis) => (
                <LfoColumn
                  key={axis}
                  axis={axis}
                  config={activeLfo[axis]}
                  elapsedSeconds={elapsedSeconds}
                  onShapeChange={(shape) => updateLfo(axis, { shape })}
                  onRateChange={(value) => updateLfo(axis, { rate: value })}
                  onDepthChange={(value) => updateLfo(axis, { depth: value })}
                />
              ))}
            </View>
          </View>

          <View style={styles.blockLabels}>
            {[0, 1, 2].map((index) => (
              <Pressable
                key={index}
                onPress={() => !lockedBlocks.has(index) && setActiveStem(index)}
              >
                <Text
                  style={[
                    styles.blockLabel,
                    activeStem === index && styles.blockLabelActive,
                    lockedBlocks.has(index) && styles.blockLabelLocked,
                  ]}
                >
                  BLOCK{index + 1}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.lockButton, !isActive && styles.lockButtonIdle]}
            onPress={isActive ? handleLockBlock : handleStart}
          >
            <Text style={[styles.lockButtonText, !isActive && styles.lockButtonTextIdle]}>
              {isActive ? `lock block ${activeBlockIndex + 1}` : 'start mixing'}
            </Text>
          </Pressable>
        </View>

        <SpatialAudioBridge
          stemUrls={generation.stemUrls}
          positions={positions}
          isPlaying={isActive}
          volumes={volumes}
        />
      </>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: 52,
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  roomWrap: {
    flex: 1.6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  timerWrap: {
    position: 'absolute',
    top: 10,
    right: 8,
  },
  timer: {
    color: colors.white,
    fontFamily: typography.mono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  controls: {
    flex: 1.05,
  },
  lfoSection: {
    marginBottom: 10,
  },
  lfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  lfoTitle: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: typography.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  muteGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  muteButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'transparent',
  },
  muteButtonMuted: {
    backgroundColor: 'rgba(255,50,50,0.25)',
    borderColor: 'rgba(255,50,50,0.6)',
  },
  muteButtonText: {
    color: 'rgba(255,255,255,0.25)',
    fontFamily: typography.mono,
    fontSize: 8,
    fontWeight: '700',
  },
  muteButtonTextMuted: {
    color: 'rgba(255,50,50,0.9)',
  },
  blockIndicator: {
    color: colors.blue,
    fontFamily: typography.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  columns: {
    flexDirection: 'row',
    gap: 6,
  },
  lfoColumn: {
    flex: 1,
  },
  waveCard: {
    borderWidth: 1,
    borderColor: 'rgba(0,18,255,0.9)',
    height: 58,
    justifyContent: 'center',
    paddingTop: 8,
    paddingHorizontal: 1,
    marginBottom: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  waveAxisLabel: {
    position: 'absolute',
    top: 3,
    left: 4,
    color: 'rgba(255,255,255,0.2)',
    fontFamily: typography.mono,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    zIndex: 1,
  },
  shapeRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 7,
  },
  shapeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,18,255,0.45)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  shapeButtonSelected: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  shapeButtonText: {
    color: 'rgba(255,255,255,0.25)',
    fontFamily: typography.mono,
    fontSize: 8,
    fontWeight: '700',
  },
  shapeButtonTextSelected: {
    color: colors.white,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 7,
  },
  sliderLabel: {
    width: 30,
    color: 'rgba(255,255,255,0.2)',
    fontFamily: typography.mono,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sliderTrackWrap: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 3,
    backgroundColor: 'rgba(0,18,255,0.45)',
    borderRadius: 2,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 3,
    backgroundColor: colors.blue,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: colors.blue,
    backgroundColor: colors.pureBlack,
    transform: [{ translateX: -7 }],
  },
  blockLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  blockLabel: {
    color: colors.grey,
    fontFamily: typography.mono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    paddingVertical: 8,
  },
  blockLabelActive: {
    color: colors.white,
  },
  blockLabelLocked: {
    color: colors.blue,
  },
  lockButton: {
    backgroundColor: colors.blue,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  lockButtonIdle: {
    backgroundColor: colors.white,
  },
  lockButtonText: {
    color: colors.white,
    fontFamily: typography.mono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
  lockButtonTextIdle: {
    color: colors.black,
  },
});
