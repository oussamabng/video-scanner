// @ts-nocheck
// src/domain/scanner/types.js

export const ScannerPhase = Object.freeze({
  READY: 'READY',
  SCANNING: 'SCANNING',
  COMPLETE: 'COMPLETE',
});

export const ScannerEventType = Object.freeze({
  START_SCANNING: 'START_SCANNING',
  CANCEL_SCANNING: 'CANCEL_SCANNING',
  PROGRESS_TICK: 'PROGRESS_TICK',
  ERROR_DETECTED: 'ERROR_DETECTED',
  ERROR_RESOLVED: 'ERROR_RESOLVED',
  SCAN_ANOTHER: 'SCAN_ANOTHER',
  RESET: 'RESET',
});

export const ScannerErrorCode = Object.freeze({
  WRONG_DIRECTION: 'WRONG_DIRECTION',
  TOO_FAST: 'TOO_FAST',
  SHAKY: 'SHAKY',
  OUT_OF_FRAME: 'OUT_OF_FRAME',
  TOO_DARK: 'TOO_DARK',
  GLARE: 'GLARE',
});

export const SCANNER_COLORS = Object.freeze({
  ready: '#FFFFFF',
  scanning: '#2B8BFF',
  error: '#F59E0B',
  complete: '#22C55E',
  danger: '#EF4444',
  frameSideLine: 'rgba(255,255,255,0.25)',
  backdrop: '#050608',
});

export const ERROR_HOLD_MS = 2000;

export const DEFAULT_SCAN_SIGNALS = Object.freeze({
  receiptInFrame: true,
  direction: 'down',
  verticalSpeed: 0.55,
  stability: 0.94,
  brightness: 0.68,
  glare: 0.05,
  boundsConfidence: 0.9,
});

export function createInitialScannerState() {
  return {
    phase: ScannerPhase.READY,
    progress: 0,
    activeError: null,
    adjustmentsCount: 0,
    startedAt: null,
    completedAt: null,
  };
}
