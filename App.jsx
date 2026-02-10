import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ReceiptScannerScreen from './src/presentation/screens/ReceiptScannerScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <ReceiptScannerScreen />
    </SafeAreaProvider>
  );
}
