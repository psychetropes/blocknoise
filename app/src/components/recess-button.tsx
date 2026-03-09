import React, { useRef, useState } from 'react';
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
  sticky?: boolean;
  style?: ViewStyle;
  bg?: string;
  interactive?: boolean;
}

export function RecessButton({
  children,
  onPress,
  selected,
  sticky = true,
  style,
  bg = colors.black,
  interactive = true,
}: RecessButtonProps) {
  const controlled = selected !== undefined;
  const [latched, setLatched] = useState(false);
  const isSelected = controlled ? !!selected : latched;
  const [pressed, setPressed] = useState(isSelected);
  const anim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  const animateTo = (value: 0 | 1) => {
    Animated.timing(anim, {
      toValue: value,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  React.useEffect(() => {
    setPressed(isSelected);
    animateTo(isSelected ? 1 : 0);
  }, [isSelected]);

  const handlePressIn = () => {
    setPressed(true);
    animateTo(1);
  };

  const handlePressOut = () => {
    setPressed(isSelected);
    animateTo(isSelected ? 1 : 0);
  };

  const handlePress = () => {
    if (!controlled && sticky && onPress) {
      setLatched((prev) => !prev);
    }
    onPress?.();
  };
  const coords = pressed || isSelected ? PRESSED : REST;
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  const content = (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bg, transform: [{ translateY: interactive ? translateY : 0 }] },
        style,
      ]}
    >
      <Svg
        viewBox="0 0 100 100"
        style={StyleSheet.absoluteFill}
        preserveAspectRatio="none"
      >
        <Polygon
          points={`0,0 100,0 ${coords.x2},${coords.y1} ${coords.x1},${coords.y1}`}
          fill="rgba(255,255,255,0.07)"
        />
        <Polygon
          points={`100,0 100,100 ${coords.x2},${coords.y2} ${coords.x2},${coords.y1}`}
          fill="rgba(255,255,255,0.05)"
        />
        <Polygon
          points={`0,100 100,100 ${coords.x2},${coords.y2} ${coords.x1},${coords.y2}`}
          fill="rgba(255,255,255,0.02)"
        />
        <Polygon
          points={`0,0 0,100 ${coords.x1},${coords.y2} ${coords.x1},${coords.y1}`}
          fill="rgba(255,255,255,0.035)"
        />
        <Line x1="0" y1="0" x2={coords.x1} y2={coords.y1} stroke="#444" strokeWidth="1" />
        <Line x1="100" y1="0" x2={coords.x2} y2={coords.y1} stroke="#444" strokeWidth="1" />
        <Line x1="0" y1="100" x2={coords.x1} y2={coords.y2} stroke="#444" strokeWidth="1" />
        <Line x1="100" y1="100" x2={coords.x2} y2={coords.y2} stroke="#444" strokeWidth="1" />
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
      {(isSelected || pressed) && <View style={styles.glow} />}
    </Animated.View>
  );

  if (!interactive) {
    return content;
  }

  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {content}
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
