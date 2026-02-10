// src/presentation/components/scanner/SideSegments.jsx

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

function clampProgress(progressPct) {
  if (!Number.isFinite(progressPct)) return 0;
  return Math.max(0, Math.min(100, progressPct));
}

export default function SideSegments({
  progressPct,
  segmentsCount = 18,
  activeColor = '#22C55E',
  inactiveColor = 'transparent',
  segmentWidth = 34,
  segmentHeight = 10,
  segmentRadius = 999,
  segmentGap = 0,
  animationDurationMs = 280,
  staggerMs = 36,
  progress,
  color,
  height,
  isScanning = false,
  isComplete = false,
  style,
}) {
  const resolvedProgressPct = clampProgress(progressPct ?? progress ?? 0);
  const resolvedActiveColor = color ?? activeColor;

  const revealValuesRef = useRef([]);
  const revealedOnceRef = useRef([]);

  if (revealValuesRef.current.length !== segmentsCount) {
    const currentValues = revealValuesRef.current;
    const currentRevealed = revealedOnceRef.current;

    revealValuesRef.current = Array.from(
      { length: segmentsCount },
      (_, index) => {
        if (currentValues[index]) return currentValues[index];
        return new Animated.Value(currentRevealed[index] ? 1 : 0);
      },
    );

    revealedOnceRef.current = Array.from(
      { length: segmentsCount },
      (_, index) => currentRevealed[index] || false,
    );
  }

  useEffect(() => {
    if (!isScanning || isComplete) {
      revealValuesRef.current.forEach(v => {
        v.stopAnimation();
        v.setValue(0);
      });
      revealedOnceRef.current = Array.from(
        { length: segmentsCount },
        () => false,
      );
    }
  }, [isComplete, isScanning, segmentsCount]);

  useEffect(() => {
    if (!isScanning || isComplete) return;

    const progressRatio = resolvedProgressPct / 100;

    revealValuesRef.current.forEach((value, index) => {
      const threshold = (index + 1) / segmentsCount;
      const shouldReveal = progressRatio >= threshold;

      if (shouldReveal && !revealedOnceRef.current[index]) {
        revealedOnceRef.current[index] = true;

        Animated.timing(value, {
          toValue: 1,
          duration: animationDurationMs,
          delay: index * staggerMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    });
  }, [
    animationDurationMs,
    isComplete,
    isScanning,
    resolvedProgressPct,
    segmentsCount,
    staggerMs,
  ]);

  const rowIndexes = useMemo(
    () => Array.from({ length: segmentsCount }, (_, index) => index),
    [segmentsCount],
  );

  if (isComplete) return null;

  const containerHeight = Math.max(0, height ?? 0);
  const w = segmentWidth;

  const availableGaps = Math.max(segmentsCount - 1, 1);

  const computedGap =
    segmentGap && segmentGap > 0
      ? segmentGap
      : containerHeight > 0
      ? Math.max(
          6,
          Math.min(
            18,
            (containerHeight - segmentsCount * segmentHeight) / availableGaps,
          ),
        )
      : 12;

  const needed =
    segmentsCount * segmentHeight + (segmentsCount - 1) * computedGap;
  const scale =
    containerHeight > 0 && needed > containerHeight
      ? containerHeight / needed
      : 1;

  const h = Math.max(6, segmentHeight * scale);
  const gap = Math.max(0, computedGap * scale);

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { width: w, height: containerHeight }, style]}
    >
      <View style={[styles.stack, { height: containerHeight, width: w }]}>
        {rowIndexes.map(index => {
          const reveal = revealValuesRef.current[index];
          const translateX = reveal.interpolate({
            inputRange: [0, 1],
            outputRange: [w, 0],
          });

          return (
            <View
              key={`segment-${String(index)}`}
              style={[
                styles.row,
                {
                  width: w,
                  height: h,
                  marginBottom: index === segmentsCount - 1 ? 0 : gap,
                },
              ]}
            >
              <View
                style={[
                  styles.clip,
                  {
                    width: w,
                    height: h,
                    borderRadius: segmentRadius,
                  },
                ]}
              >
                <View
                  style={[
                    styles.inactiveFill,
                    {
                      backgroundColor: inactiveColor,
                      borderRadius: segmentRadius,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.activeFill,
                    {
                      width: w,
                      height: h,
                      borderRadius: segmentRadius,
                      backgroundColor: resolvedActiveColor,
                      transform: [{ translateX }],
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
  },
  stack: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  row: {
    alignItems: 'flex-start',
  },
  clip: {
    overflow: 'hidden',
    position: 'relative',
  },
  inactiveFill: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  activeFill: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
