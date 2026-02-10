// @ts-nocheck
// src/presentation/components/scanner/ScanLine.jsx

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export default function ScanLine({
  visible,
  paused,
  color = '#2F80FF',
  travelDistance = 0,
  topOffset = 110,
  horizontalInset = 18,
  height = 2,
  glowHeight = 12,
  glowOpacity = 0.22,
  sweepDurationMs,
  resetDelayMs = 120,
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);

  const duration = useMemo(() => {
    if (typeof sweepDurationMs === 'number') return sweepDurationMs;
    return Math.max(1400, travelDistance * 6);
  }, [sweepDurationMs, travelDistance]);

  useEffect(() => {
    const stopLoop = () => {
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current = null;
      }
    };

    if (!visible) {
      stopLoop();
      translateY.setValue(0);
      return undefined;
    }

    if (paused || travelDistance <= 0) {
      stopLoop();
      return undefined;
    }

    translateY.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: travelDistance,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(resetDelayMs),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    loopRef.current = loop;
    loop.start();

    return () => stopLoop();
  }, [visible, paused, travelDistance, duration, resetDelayMs, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.lineBase,
        {
          left: horizontalInset,
          right: horizontalInset,
          top: topOffset,
          height,
          backgroundColor: color,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.glowBase,
          {
            backgroundColor: color,
            height: glowHeight,
            top: -(glowHeight - height) / 2,
            opacity: glowOpacity,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.glowSoft,
          {
            backgroundColor: color,
            height: glowHeight * 1.6,
            top: -(glowHeight * 1.6 - height) / 2,
            opacity: glowOpacity * 0.45,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lineBase: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowBase: {
    position: 'absolute',
    left: -2,
    right: -2,
    borderRadius: 999,
  },
  glowSoft: {
    position: 'absolute',
    left: -10,
    right: -10,
    borderRadius: 999,
  },
});
