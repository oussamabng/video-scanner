// src/domain/scanner/scannerMachine.js

import {
  SCANNER_COLORS,
  ScannerEventType,
  ScannerPhase,
  createInitialScannerState,
} from './types';
import { getErrorTexts, getPhaseTexts } from './hintTexts';

function toProgressLabel(value) {
  return `${Math.round(value)}% captured`;
}

function createErrorPayload(error, now) {
  return {
    code: error.code,
    detectedAt: now,
  };
}

export function scannerReducer(state, event) {
  switch (event.type) {
    case ScannerEventType.START_SCANNING:
      return {
        ...createInitialScannerState(),
        phase: ScannerPhase.SCANNING,
        startedAt: event.now,
      };

    case ScannerEventType.CANCEL_SCANNING:
      return createInitialScannerState();

    case ScannerEventType.SCAN_ANOTHER:
    case ScannerEventType.RESET:
      return createInitialScannerState();

    case ScannerEventType.PROGRESS_TICK: {
      if (state.phase !== ScannerPhase.SCANNING || state.activeError) {
        return state;
      }

      const nextProgress = Math.min(100, state.progress + event.step);

      if (nextProgress >= 100) {
        return {
          ...state,
          phase: ScannerPhase.COMPLETE,
          progress: 100,
          activeError: null,
          completedAt: event.now,
        };
      }

      return {
        ...state,
        progress: nextProgress,
      };
    }

    case ScannerEventType.ERROR_DETECTED: {
      if (state.phase !== ScannerPhase.SCANNING || !event.error) {
        return state;
      }

      const isNewOccurrence = !state.activeError || state.activeError.code !== event.error.code;

      return {
        ...state,
        activeError: isNewOccurrence
          ? createErrorPayload(event.error, event.now)
          : state.activeError,
        adjustmentsCount: isNewOccurrence ? state.adjustmentsCount + 1 : state.adjustmentsCount,
      };
    }

    case ScannerEventType.ERROR_RESOLVED:
      if (state.phase !== ScannerPhase.SCANNING || !state.activeError) {
        return state;
      }

      return {
        ...state,
        activeError: null,
      };

    default:
      return state;
  }
}

export function getScannerUiModel(state) {
  const phaseTexts = getPhaseTexts(state.phase);
  const activeErrorTexts = state.activeError ? getErrorTexts(state.activeError.code) : null;

  const isScanning = state.phase === ScannerPhase.SCANNING;
  const hasError = isScanning && Boolean(state.activeError);
  const isComplete = state.phase === ScannerPhase.COMPLETE;

  const accentColor = isComplete
    ? SCANNER_COLORS.complete
    : hasError
      ? SCANNER_COLORS.error
      : isScanning
        ? SCANNER_COLORS.scanning
        : SCANNER_COLORS.ready;

  return {
    phase: state.phase,
    title: phaseTexts.title,
    subtitle: phaseTexts.subtitle,
    tip: phaseTexts.tip,
    progress: state.progress,
    progressLabel: toProgressLabel(state.progress),
    adjustmentsCount: state.adjustmentsCount,
    isScanning,
    isComplete,
    hasError,
    showScanLine: isScanning,
    scanLinePaused: hasError,
    sideIndicatorColor: isComplete
      ? SCANNER_COLORS.complete
      : hasError
        ? SCANNER_COLORS.error
        : SCANNER_COLORS.complete,
    progressColor: hasError ? SCANNER_COLORS.error : SCANNER_COLORS.scanning,
    accentColor,
    alert: activeErrorTexts,
    colors: SCANNER_COLORS,
  };
}
