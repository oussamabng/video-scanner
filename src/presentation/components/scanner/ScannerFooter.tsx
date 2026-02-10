// @ts-nocheck
// src/presentation/components/scanner/ScannerFooter.jsx

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScannerPhase } from '../../../domain/scanner/types';

function ScannerButton({ title, onPress, style, textStyle, disabled }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text style={[styles.buttonLabel, textStyle]}>{title}</Text>
    </Pressable>
  );
}

export default function ScannerFooter({
  phase,
  permissionStatus,
  onStartScanning,
  onFinishScanning,
  onViewReceipt,
  onScanAnother,
}) {
  if (phase === ScannerPhase.SCANNING) {
    return (
      <View style={styles.container}>
        <ScannerButton
          title="Done"
          onPress={onFinishScanning}
          style={styles.doneButton}
          textStyle={styles.doneButtonLabel}
        />
      </View>
    );
  }

  if (phase === ScannerPhase.COMPLETE) {
    return (
      <View style={styles.container}>
        <ScannerButton
          title="View Receipt"
          onPress={onViewReceipt}
          style={styles.viewReceiptButton}
          textStyle={styles.viewReceiptLabel}
        />
        <ScannerButton
          title="Scan Another"
          onPress={onScanAnother}
          style={styles.scanAnotherButton}
          textStyle={styles.scanAnotherLabel}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScannerButton
        title={permissionStatus === 'denied' ? 'Allow Camera & Start Recording' : 'Start Recording'}
        onPress={onStartScanning}
        style={styles.startButton}
        textStyle={styles.startButtonLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 28,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 42,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '800',
  },
  startButton: {
    backgroundColor: '#2B8BFF',
  },
  startButtonLabel: {
    color: '#F5F8FF',
  },
  doneButton: {
    backgroundColor: '#22C55E',
  },
  doneButtonLabel: {
    color: '#F2FFF7',
  },
  viewReceiptButton: {
    backgroundColor: '#22C55E',
  },
  viewReceiptLabel: {
    color: '#F2FFF7',
  },
  scanAnotherButton: {
    backgroundColor: '#11151C',
    marginTop: 12,
  },
  scanAnotherLabel: {
    color: '#E8ECF6',
  },
});
