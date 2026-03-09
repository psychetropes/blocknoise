import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, typography } from '../theme';

interface ScreenFrameProps {
  children: React.ReactNode;
  backgroundColor?: string;
  contentStyle?: StyleProp<ViewStyle>;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function ScreenFrame({
  children,
  backgroundColor = colors.blue,
  contentStyle,
  headerLeft,
  headerRight,
}: ScreenFrameProps) {
  const hasHeader = headerLeft || headerRight;

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { backgroundColor }]}>
        <View pointerEvents="none" style={styles.frameStroke} />
        <View style={[styles.content, contentStyle]}>
          {hasHeader ? (
            <View style={styles.header}>
              <View style={styles.headerSide}>
                {typeof headerLeft === 'string' ? (
                  <Text style={styles.headerLeftText}>{headerLeft}</Text>
                ) : (
                  headerLeft
                )}
              </View>
              <View style={[styles.headerSide, styles.headerSideRight]}>
                {typeof headerRight === 'string' ? (
                  <Text style={styles.headerRightText}>{headerRight}</Text>
                ) : (
                  headerRight
                )}
              </View>
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 3,
  },
  inner: {
    flex: 1,
    position: 'relative',
  },
  frameStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    flex: 1,
    paddingTop: 52,
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
  },
  headerSide: {
    minHeight: 16,
    justifyContent: 'center',
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  headerLeftText: {
    fontFamily: typography.mono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  headerRightText: {
    fontFamily: typography.mono,
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
});
