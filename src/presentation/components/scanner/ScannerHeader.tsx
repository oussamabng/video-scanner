// @ts-nocheck
// src/presentation/components/scanner/ScannerHeader.jsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ScannerHeader({ title, subtitle }) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 26,
    paddingHorizontal: 16,
  },
  title: {
    color: '#F6F8FC',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(246, 248, 252, 0.82)',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});
