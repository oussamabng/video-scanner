// src/application/scanner/useReceiptScannerController.js

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ERROR_HOLD_MS,
  ScannerEventType,
  ScannerPhase,
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

function getProgressStep() {
  return 0.85 + Math.random() * 1.9;
}

export function useReceiptScannerController() {
  const [machineState, dispatch] = useReducer(scannerReducer, undefined, createInitialScannerState);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [cameraReady, setCameraReady] = useState(false);
  const [latestSignals, setLatestSignals] = useState(null);

  const machineStateRef = useRef(machineState);
  const signalsRef = useRef(null);

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

    const timer = setInterval(() => {
      const now = Date.now();
      const currentState = machineStateRef.current;

      const simulatedSignals = createSimulatedSignals({
        isScanning: true,
        progress: currentState.progress,
      });

      const currentSignals = updateSignals(simulatedSignals);
      const detectedError = resolveScannerError(currentSignals);

      if (currentState.activeError) {
        if (detectedError) {
          dispatch({
            type: ScannerEventType.ERROR_DETECTED,
            error: detectedError,
            now,
          });
        } else if (now - currentState.activeError.detectedAt >= ERROR_HOLD_MS) {
          dispatch({
            type: ScannerEventType.ERROR_RESOLVED,
            now,
          });
        }
      } else if (detectedError) {
        dispatch({
          type: ScannerEventType.ERROR_DETECTED,
          error: detectedError,
          now,
        });
      }

      if (!currentState.activeError && !detectedError) {
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
  }, [machineState.phase, updateSignals]);

  const startScanning = useCallback(async () => {
    const status = await requestCameraPermission();
    setPermissionStatus(status);

    if (status === 'granted') {
      dispatch({
        type: ScannerEventType.START_SCANNING,
        now: Date.now(),
      });
    }
  }, []);

  const cancelScanning = useCallback(() => {
    dispatch({
      type: ScannerEventType.CANCEL_SCANNING,
      now: Date.now(),
    });
  }, []);

  const scanAnother = useCallback(() => {
    signalsRef.current = null;
    setLatestSignals(null);
    dispatch({
      type: ScannerEventType.SCAN_ANOTHER,
      now: Date.now(),
    });
    setCameraReady(false);
  }, []);

  const viewReceipt = useCallback(() => {
    // Placeholder callback: route to a preview screen once capture output exists.
  }, []);

  const onCameraReady = useCallback(() => {
    setCameraReady(true);
  }, []);

  const onCameraFrame = useCallback(
    (rawPayload) => {
      const normalizedSignals = normalizeCameraSignals(rawPayload);
      const mergedSignals = updateSignals(normalizedSignals);

      if (machineStateRef.current.phase !== ScannerPhase.SCANNING) {
        return;
      }

      const maybeError = resolveScannerError(mergedSignals);

      if (maybeError) {
        dispatch({
          type: ScannerEventType.ERROR_DETECTED,
          error: maybeError,
          now: Date.now(),
        });
      }
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
    cameraActive:
      machineState.phase === ScannerPhase.READY || machineState.phase === ScannerPhase.SCANNING,
    startScanning,
    cancelScanning,
    scanAnother,
    viewReceipt,
    onCameraReady,
    onCameraFrame,
  };
}
