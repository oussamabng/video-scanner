// @ts-nocheck
// src/application/scanner/useReceiptScannerController.js

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ERROR_HOLD_MS,
  ScannerErrorCode,
  ScannerEventType,
  ScannerPhase,
  ScannerSimulationScenario,
  createInitialScannerState,
} from '../../domain/scanner/types';
import { getScannerUiModel, scannerReducer } from '../../domain/scanner/scannerMachine';
import {
  createSimulatedSignals,
  mergeScannerSignals,
  normalizeCameraSignals,
  resolveScannerError,
} from './signalsAdapter';
import {
  checkCameraPermission,
  requestCameraPermission,
} from '../../infrastructure/camera/permissions';
import { subscribeToMotionSignals } from '../../infrastructure/sensors/motion';

const SCAN_TICK_MS = 160;
const WARNING_PERSISTENCE_MS = 400;
const TOO_FAST_THRESHOLD = 1.35;
const DRIFTING_ROTATION_THRESHOLD = 0.18;
// Default demo mode is clean scanning (no simulated errors).
// To test error states locally, switch this to ScannerSimulationScenario.MOCK_ERRORS.
const DEFAULT_SIMULATION_SCENARIO = ScannerSimulationScenario.NO_ERRORS;
const MOCK_FRAME_MOTION_SIGNALS = Object.freeze({
  verticalSpeed: 1.86,
  dx: 0.06,
  dy: 0.15,
  rotation: 0.03,
  validMotion: true,
  receiptTooClose: false,
});

const SCANNER_DEBUG_TAG = '[scanner-debug]';

function logScannerDebug(event, payload) {
  if (!__DEV__) {
    return;
  }

  if (payload === undefined) {
    console.log(`${SCANNER_DEBUG_TAG} ${event}`);
    return;
  }

  console.log(`${SCANNER_DEBUG_TAG} ${event}`, payload);
}

function getProgressStep() {
  return 0.85 + Math.random() * 1.9;
}

function getPersistedMotionWarning(signals, now, warningStartRef) {
  const conditions = {
    [ScannerErrorCode.TOO_FAST]:
      typeof signals?.verticalSpeed === 'number' && signals.verticalSpeed > TOO_FAST_THRESHOLD,
    [ScannerErrorCode.DRIFTING]:
      typeof signals?.rotation === 'number' &&
      Math.abs(signals.rotation) > DRIFTING_ROTATION_THRESHOLD,
    [ScannerErrorCode.TOO_CLOSE]: signals?.receiptTooClose === true,
  };

  const priorityOrder = [
    ScannerErrorCode.TOO_CLOSE,
    ScannerErrorCode.DRIFTING,
    ScannerErrorCode.TOO_FAST,
  ];

  priorityOrder.forEach(errorCode => {
    if (conditions[errorCode]) {
      if (!warningStartRef.current[errorCode]) {
        warningStartRef.current[errorCode] = now;
      }
      return;
    }

    warningStartRef.current[errorCode] = null;
  });

  for (const errorCode of priorityOrder) {
    const startedAt = warningStartRef.current[errorCode];
    if (conditions[errorCode] && startedAt && now - startedAt >= WARNING_PERSISTENCE_MS) {
      return { code: errorCode };
    }
  }

  return null;
}

export function useReceiptScannerController() {
  const [machineState, dispatch] = useReducer(scannerReducer, undefined, createInitialScannerState);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [cameraReady, setCameraReady] = useState(false);
  const [latestSignals, setLatestSignals] = useState(null);
  const [recordingEnabled, setRecordingEnabled] = useState(false);

  const machineStateRef = useRef(machineState);
  const signalsRef = useRef(null);
  const hasCameraFrameSignalsRef = useRef(false);
  const lastWarningLogRef = useRef({ code: null, at: 0 });
  const hasLoggedFallbackRef = useRef(false);
  const warningStartRef = useRef({
    [ScannerErrorCode.TOO_FAST]: null,
    [ScannerErrorCode.DRIFTING]: null,
    [ScannerErrorCode.TOO_CLOSE]: null,
  });

  const completeScanning = useCallback((savedVideoPath = null) => {
    if (machineStateRef.current.phase !== ScannerPhase.SCANNING) {
      return;
    }

    setRecordingEnabled(false);
    dispatch({
      type: ScannerEventType.FINISH_SCANNING,
      now: Date.now(),
      savedVideoPath,
    });
  }, []);

  useEffect(() => {
    machineStateRef.current = machineState;
  }, [machineState]);

  const updateSignals = useCallback((incomingSignals) => {
    const mergedSignals = mergeScannerSignals(signalsRef.current, incomingSignals);
    signalsRef.current = mergedSignals;
    setLatestSignals(mergedSignals);
    return mergedSignals;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialPermission() {
      const status = await checkCameraPermission();
      if (isMounted) {
        setPermissionStatus(status);
      }
    }

    loadInitialPermission();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribeMotion = subscribeToMotionSignals((motionSignals) => {
      if (machineStateRef.current.phase !== ScannerPhase.SCANNING) {
        return;
      }

      updateSignals(motionSignals);
    });

    return unsubscribeMotion;
  }, [updateSignals]);

  useEffect(() => {
    if (machineState.phase !== ScannerPhase.SCANNING) {
      return undefined;
    }

    const simulationScenario = DEFAULT_SIMULATION_SCENARIO;

    const timer = setInterval(() => {
      const now = Date.now();
      const currentState = machineStateRef.current;

      const forcedErrorCode =
        simulationScenario === ScannerSimulationScenario.MOCK_ERRORS &&
        currentState.progress > 25 &&
        currentState.progress < 40
          ? 'TOO_FAST'
          : null;

      const hasCameraDrivenSignals = hasCameraFrameSignalsRef.current;
      if (!hasCameraDrivenSignals && !hasLoggedFallbackRef.current) {
        hasLoggedFallbackRef.current = true;
        logScannerDebug('using_mock_motion_fallback', MOCK_FRAME_MOTION_SIGNALS);
      }

      const currentSignals = hasCameraDrivenSignals
        ? signalsRef.current
        : updateSignals(
            mergeScannerSignals(
              createSimulatedSignals({
                isScanning: true,
                progress: currentState.progress,
                forcedErrorCode,
                scenario: simulationScenario,
              }),
              MOCK_FRAME_MOTION_SIGNALS,
            ),
          );

      const persistedMotionError = getPersistedMotionWarning(
        currentSignals,
        now,
        warningStartRef,
      );

      const detectedError = persistedMotionError || resolveScannerError(currentSignals);

      if (persistedMotionError) {
        const nowMs = Date.now();
        if (
          lastWarningLogRef.current.code !== persistedMotionError.code ||
          nowMs - lastWarningLogRef.current.at > 1000
        ) {
          lastWarningLogRef.current = { code: persistedMotionError.code, at: nowMs };
          logScannerDebug('persisted_motion_warning', {
            code: persistedMotionError.code,
            verticalSpeed: currentSignals?.verticalSpeed,
            rotation: currentSignals?.rotation,
            receiptTooClose: currentSignals?.receiptTooClose,
          });
        }
      }

      if (currentState.activeError) {
        if (detectedError) {
          dispatch({
            type: ScannerEventType.ERROR_DETECTED,
            error: detectedError,
            now,
          });
        } else if (now - currentState.activeError.detectedAt >= ERROR_HOLD_MS) {
          logScannerDebug('error_resolved', { code: currentState.activeError.code });
          dispatch({
            type: ScannerEventType.ERROR_RESOLVED,
            now,
          });
        }
      } else if (detectedError) {
        logScannerDebug('error_detected', { code: detectedError.code });
        dispatch({
          type: ScannerEventType.ERROR_DETECTED,
          error: detectedError,
          now,
        });
      }

      if (!currentState.activeError && !detectedError) {
        if (currentState.progress >= 95) {
          completeScanning();
          return;
        }

        dispatch({
          type: ScannerEventType.PROGRESS_TICK,
          step: getProgressStep(),
          now,
        });
      }
    }, SCAN_TICK_MS);

    return () => {
      clearInterval(timer);
    };
  }, [completeScanning, machineState.phase, updateSignals]);

  const startScanning = useCallback(async () => {
    const status = await requestCameraPermission();
    setPermissionStatus(status);

    if (status === 'granted') {
      logScannerDebug('start_scanning_granted');
      // Recording is kept disabled to avoid native instability while warnings are active.
      setRecordingEnabled(false);
      hasCameraFrameSignalsRef.current = false;
      hasLoggedFallbackRef.current = false;
      lastWarningLogRef.current = { code: null, at: 0 };
      warningStartRef.current = {
        [ScannerErrorCode.TOO_FAST]: null,
        [ScannerErrorCode.DRIFTING]: null,
        [ScannerErrorCode.TOO_CLOSE]: null,
      };
      dispatch({
        type: ScannerEventType.START_SCANNING,
        now: Date.now(),
      });
    } else {
      logScannerDebug('start_scanning_denied', { status });
    }
  }, []);

  const finishScanning = useCallback(() => {
    completeScanning();
  }, [completeScanning]);

  const onRecordingFinished = useCallback(
    (video) => {
      completeScanning(video?.path || null);
    },
    [completeScanning],
  );

  const onRecordingError = useCallback(() => {
    logScannerDebug('recording_error');
    dispatch({
      type: ScannerEventType.CANCEL_SCANNING,
      now: Date.now(),
    });
  }, []);

  const scanAnother = useCallback(() => {
    logScannerDebug('scan_another_pressed');
    signalsRef.current = null;
    setLatestSignals(null);
    setRecordingEnabled(false);
    hasCameraFrameSignalsRef.current = false;
    hasLoggedFallbackRef.current = false;
    lastWarningLogRef.current = { code: null, at: 0 };
    warningStartRef.current = {
      [ScannerErrorCode.TOO_FAST]: null,
      [ScannerErrorCode.DRIFTING]: null,
      [ScannerErrorCode.TOO_CLOSE]: null,
    };
    dispatch({
      type: ScannerEventType.SCAN_ANOTHER,
      now: Date.now(),
    });
  }, []);

  const viewReceipt = useCallback(() => {
    // Placeholder callback: route to a preview screen once capture output exists.
  }, []);

  const onCameraReady = useCallback(() => {
    setCameraReady(true);
  }, []);

  const onCameraFrame = useCallback(
    (rawPayload) => {
      if (machineStateRef.current.phase !== ScannerPhase.SCANNING) {
        return;
      }

      if (!hasCameraFrameSignalsRef.current) {
        logScannerDebug('camera_frame_signals_received');
      }
      hasCameraFrameSignalsRef.current = true;
      const normalizedSignals = normalizeCameraSignals(rawPayload);
      updateSignals(normalizedSignals);
    },
    [updateSignals],
  );

  const uiModel = useMemo(() => getScannerUiModel(machineState), [machineState]);

  return {
    uiModel,
    machineState,
    permissionStatus,
    cameraReady,
    latestSignals,
    recordingEnabled,
    cameraActive:
      machineState.phase === ScannerPhase.READY || machineState.phase === ScannerPhase.SCANNING,
    startScanning,
    finishScanning,
    scanAnother,
    viewReceipt,
    onCameraReady,
    onCameraFrame,
    onRecordingFinished,
    onRecordingError,
  };
}
