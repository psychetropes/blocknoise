import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';

// placeholder for three.js canvas — will use @react-three/fiber
// the three.js integration requires react-native-webview bridge for spatial audio

interface BlockCanvasProps {
  stems: string[];
  onPathUpdate: (stemIndex: number, point: [number, number, number, number]) => void;
  isActive: boolean;
}

export function BlockCanvas({ stems, onPathUpdate, isActive }: BlockCanvasProps) {
  return (
    <View style={styles.container}>
      {/* @react-three/fiber Canvas will be rendered here */}
      {/* wireframe cube + 3 draggable stem spheres */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg2,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
