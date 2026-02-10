// @ts-nocheck
// src/presentation/components/scanner/ScannerCompleteOverlay.jsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ScannerCompleteOverlay({ visible, adjustmentsCount, style }) {
  if (!visible) return null;

  const adjustmentsLabel = `${adjustmentsCount} adjustment${adjustmentsCount === 1 ? '' : 's'} made`;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <View style={styles.checkCircle}>
        <Text style={styles.checkIcon}>✓</Text>
      </View>
      <Text style={styles.title}>Scan Complete!</Text>
      <Text style={styles.subtitle}>{adjustmentsLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.34)',
    borderRadius: 26,
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  checkCircle: {
    alignItems: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    marginBottom: 18,
    width: 72,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
  },
  title: {
    color: '#F5FFF8',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(245,255,248,0.9)',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});
