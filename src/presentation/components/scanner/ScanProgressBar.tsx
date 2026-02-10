// @ts-nocheck
// src/presentation/components/scanner/ScanProgressBar.jsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ScanProgressBar({ progress, label, color }) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const shouldShowLabel = typeof label === 'string' && label.length > 0;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { backgroundColor: color, width: `${clampedProgress}%` },
          ]}
        />
      </View>
      {shouldShowLabel ? <Text style={[styles.text, { color }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 6,
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    height: 6,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
  text: {
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
});
