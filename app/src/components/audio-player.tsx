import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { colors, typography } from '../theme';

interface AudioPlayerProps {
  uri: string;
  label?: string;
}

export function AudioPlayer({ uri, label }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handlePlayPause = async () => {
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: true },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } else if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPosition(status.positionMillis);
    setDuration(status.durationMillis ?? 0);
    setIsPlaying(status.isPlaying);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;
  const barCount = 40;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
        <Text style={styles.playIcon}>{isPlaying ? '||' : '\u25B6'}</Text>
      </TouchableOpacity>
      <View style={styles.waveformTrack}>
        {Array.from({ length: barCount }, (_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: 4 + Math.abs(Math.sin(1.5 + i * 0.7) * 20) + Math.abs(Math.cos(3 + i * 1.3) * 6),
                backgroundColor: i / barCount < progress
                  ? colors.white
                  : 'rgba(0,0,0,0.3)',
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.time}>{formatTime(position)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  playButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontFamily: typography.mono,
    fontSize: 12,
    color: colors.white,
  },
  waveformTrack: {
    flex: 1,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  bar: {
    flex: 1,
    minWidth: 2,
  },
  time: {
    fontFamily: typography.mono,
    fontSize: 10,
    color: colors.white,
  },
});
