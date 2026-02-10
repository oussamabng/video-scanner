// src/presentation/components/scanner/ScannerAlertBanner.jsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ScannerAlertBanner({ alert }) {
  if (!alert) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{alert.icon}</Text>
      </View>
      <View style={styles.copyWrap}>
        <Text style={styles.title}>{alert.title}</Text>
        <Text style={styles.message}>{alert.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.96)',
    borderRadius: 16,
    flexDirection: 'row',
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'absolute',
    top: 52,
    width: '93%',
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(120, 53, 15, 0.2)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  icon: {
    color: '#3B1B05',
    fontSize: 18,
    fontWeight: '800',
  },
  copyWrap: {
    flex: 1,
  },
  title: {
    color: '#3B1B05',
    fontSize: 14,
    fontWeight: '800',
  },
  message: {
    color: 'rgba(59, 27, 5, 0.86)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
});
