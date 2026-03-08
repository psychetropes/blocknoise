import React, { useRef } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Svg, { Polygon, Line, Rect } from 'react-native-svg';
import { colors } from '../theme';

// rest and pressed inner rect coordinates (percentage of viewBox 0-100)
const REST = { x1: 8, y1: 5, x2: 78, y2: 82 };
const PRESSED = { x1: 4, y1: 2.5, x2: 89, y2: 91 };

interface RecessButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
  bg?: string;
}

export function RecessButton({
  children,
  onPress,
  selected = false,
  style,
  bg = colors.black,
}: RecessButtonProps) {
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  const handlePressIn = () => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    if (!selected) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: false,
      }).start();
    }
  };

  const coords = selected ? PRESSED : REST;

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[styles.container, { backgroundColor: bg }, style]}>
        <Svg
          viewBox="0 0 100 100"
          style={StyleSheet.absoluteFill}
          preserveAspectRatio="none"
        >
          {/* top wall */}
          <Polygon
            points={`0,0 100,0 ${coords.x2},${coords.y1} ${coords.x1},${coords.y1}`}
            fill="rgba(255,255,255,0.07)"
          />
          {/* right wall */}
          <Polygon
            points={`100,0 100,100 ${coords.x2},${coords.y2} ${coords.x2},${coords.y1}`}
            fill="rgba(255,255,255,0.05)"
          />
          {/* bottom wall */}
          <Polygon
            points={`0,100 100,100 ${coords.x2},${coords.y2} ${coords.x1},${coords.y2}`}
            fill="rgba(255,255,255,0.02)"
          />
          {/* left wall */}
          <Polygon
            points={`0,0 0,100 ${coords.x1},${coords.y2} ${coords.x1},${coords.y1}`}
            fill="rgba(255,255,255,0.035)"
          />
          {/* corner lines */}
          <Line x1="0" y1="0" x2={coords.x1} y2={coords.y1} stroke="#444" strokeWidth="1" />
          <Line x1="100" y1="0" x2={coords.x2} y2={coords.y1} stroke="#444" strokeWidth="1" />
          <Line x1="0" y1="100" x2={coords.x1} y2={coords.y2} stroke="#444" strokeWidth="1" />
          <Line x1="100" y1="100" x2={coords.x2} y2={coords.y2} stroke="#444" strokeWidth="1" />
          {/* inner rect */}
          <Rect
            x={coords.x1}
            y={coords.y1}
            width={coords.x2 - coords.x1}
            height={coords.y2 - coords.y1}
            fill="none"
            stroke="#444"
            strokeWidth="1"
          />
        </Svg>
        <View style={styles.content}>
          {children}
        </View>
        {selected && <View style={styles.glow} />}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    padding: '12%',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
