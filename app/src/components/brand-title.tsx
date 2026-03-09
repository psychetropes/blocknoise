import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

interface BrandTitleProps {
  size?: number;
  lineHeight?: number;
}

export function BrandTitle({ size = 68, lineHeight = 68 }: BrandTitleProps) {
  const [blockWidth, setBlockWidth] = useState<number | null>(null);

  const handleBlockLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.ceil(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== blockWidth) {
      setBlockWidth(nextWidth);
    }
  };

  return (
    <View style={styles.outer}>
      <View style={[styles.wrapper, blockWidth ? { width: blockWidth, opacity: 1 } : styles.hiddenWordmark]}>
        <Text onLayout={handleBlockLayout} style={[styles.line, { fontSize: size, lineHeight }]}>
          BLOCK
        </Text>
        <View style={[styles.noiseRow, blockWidth ? { width: blockWidth } : null]}>
          {['N', 'O', 'I', 'S', 'E'].map((letter, index) => (
            <Text
              key={`${letter}-${index}`}
              style={[
                styles.line,
                styles.noiseLetter,
                { fontSize: size, lineHeight },
                index === 4 && styles.lastNoiseLetter,
              ]}
            >
              {letter}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
  },
  wrapper: {
    alignItems: 'flex-start',
  },
  hiddenWordmark: {
    opacity: 0,
  },
  line: {
    fontFamily: typography.display,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  noiseRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noiseLetter: {
    letterSpacing: 2,
  },
  lastNoiseLetter: {
    marginRight: -3,
  },
});
