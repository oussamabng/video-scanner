// @ts-nocheck
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ReceiptScannerScreen from './src/presentation/screens/ReceiptScannerScreen';
import { requestCameraPermission } from './src/infrastructure/camera/permissions';

export default function App() {
  const [route, setRoute] = useState('launcher');
  const [permissionError, setPermissionError] = useState('');

  const onPressStartScan = useCallback(async () => {
    setPermissionError('');
    const status = await requestCameraPermission();

    if (status === 'granted') {
      setRoute('scanner');
      return;
    }

    setPermissionError('Camera permission is required to open the scanner.');
  }, []);

  if (route === 'scanner') {
    return (
      <SafeAreaProvider>
        <ReceiptScannerScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.container}>
          <Text style={styles.title}>Receipt Scanner</Text>
          <Text style={styles.subtitle}>Tap scan, grant camera permission, then start scanning.</Text>

          <Pressable style={styles.scanButton} onPress={onPressStartScan}>
            <Text style={styles.scanButtonLabel}>Scan</Text>
          </Pressable>

          {permissionError ? <Text style={styles.errorText}>{permissionError}</Text> : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050608',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#F7FAFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(247,250,255,0.8)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 24,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#2B8BFF',
    borderRadius: 999,
    minHeight: 48,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scanButtonLabel: {
    color: '#F5F8FF',
    fontSize: 18,
    fontWeight: '800',
  },
  errorText: {
    color: '#F59E0B',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
