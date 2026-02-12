// @ts-nocheck
// src/application/scanner/signalsAdapter.js

import { evaluateScannerError } from '../../domain/scanner/errorRules';
import {
  DEFAULT_SCAN_SIGNALS,
  ScannerErrorCode,
  ScannerSimulationScenario,
} from '../../domain/scanner/types';

const DEMO_ERROR_POOL = [
  ScannerErrorCode.WRONG_DIRECTION,
  ScannerErrorCode.TOO_FAST,
  ScannerErrorCode.SHAKY,
  ScannerErrorCode.OUT_OF_FRAME,
  ScannerErrorCode.TOO_DARK,
  ScannerErrorCode.GLARE,
];

function asNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function pickRandomErrorCode() {
  return DEMO_ERROR_POOL[Math.floor(Math.random() * DEMO_ERROR_POOL.length)];
}

export function mergeScannerSignals(baseSignals, patchSignals) {
  const merged = {
    ...DEFAULT_SCAN_SIGNALS,
    ...(baseSignals || {}),
    ...(patchSignals || {}),
  };

  return {
    ...merged,
    stability: clamp01(asNumber(merged.stability, DEFAULT_SCAN_SIGNALS.stability)),
    brightness: clamp01(asNumber(merged.brightness, DEFAULT_SCAN_SIGNALS.brightness)),
    glare: clamp01(asNumber(merged.glare, DEFAULT_SCAN_SIGNALS.glare)),
    boundsConfidence: clamp01(
      asNumber(merged.boundsConfidence, DEFAULT_SCAN_SIGNALS.boundsConfidence),
    ),
    verticalSpeed: Math.max(0, asNumber(merged.verticalSpeed, DEFAULT_SCAN_SIGNALS.verticalSpeed)),
    dx: asNumber(merged.dx, 0),
    dy: asNumber(merged.dy, 0),
    rotation: asNumber(merged.rotation, 0),
    receiptTooClose: Boolean(merged.receiptTooClose),
    direction: merged.direction || 'down',
  };
}

export function normalizeCameraSignals(rawPayload = {}) {
  // TODO(vision-camera-signals): if frame processors are added later, map real
  // VisionCamera frame-processor output payload keys here.
  const boundsConfidence = asNumber(
    rawPayload.boundsConfidence ??
      rawPayload.rectangleConfidence ??
      rawPayload.document?.confidence,
    DEFAULT_SCAN_SIGNALS.boundsConfidence,
  );

  const receiptInFrame =
    typeof rawPayload.receiptInFrame === 'boolean'
      ? rawPayload.receiptInFrame
      : typeof rawPayload.documentDetected === 'boolean'
        ? rawPayload.documentDetected
        : boundsConfidence >= 0.55;

  const direction = rawPayload.direction ?? rawPayload.movement?.direction ?? 'down';

  const motion = rawPayload.motion || {};

  const verticalSpeed = asNumber(
    rawPayload.verticalSpeed ?? rawPayload.movement?.speed ?? rawPayload.motionSpeed ?? motion.speed,
    DEFAULT_SCAN_SIGNALS.verticalSpeed,
  );

  const stability = asNumber(
    rawPayload.stability ?? rawPayload.movement?.stability ?? rawPayload.shakeScore,
    DEFAULT_SCAN_SIGNALS.stability,
  );

  const brightness = asNumber(
    rawPayload.brightness ?? rawPayload.luma ?? rawPayload.lightLevel,
    DEFAULT_SCAN_SIGNALS.brightness,
  );

  const glare = asNumber(
    rawPayload.glare ?? rawPayload.highlightIntensity ?? rawPayload.reflection,
    DEFAULT_SCAN_SIGNALS.glare,
  );

  return mergeScannerSignals(DEFAULT_SCAN_SIGNALS, {
    receiptInFrame,
    direction,
    verticalSpeed,
    stability,
    brightness,
    glare,
    boundsConfidence,
    dx: asNumber(rawPayload.dx ?? motion.dx, 0),
    dy: asNumber(rawPayload.dy ?? motion.dy, 0),
    rotation: asNumber(rawPayload.rotation ?? motion.rotation, 0),
    validMotion:
      typeof rawPayload.validMotion === 'boolean'
        ? rawPayload.validMotion
        : typeof motion.validMotion === 'boolean'
          ? motion.validMotion
          : true,
    receiptTooClose: Boolean(rawPayload.receiptTooClose),
  });
}

function createSignalsForErrorCode(errorCode) {
  switch (errorCode) {
    case ScannerErrorCode.WRONG_DIRECTION:
      return { direction: 'up' };
    case ScannerErrorCode.TOO_FAST:
      return { verticalSpeed: 1.9 };
    case ScannerErrorCode.SHAKY:
      return { stability: 0.25 };
    case ScannerErrorCode.OUT_OF_FRAME:
      return { receiptInFrame: false, boundsConfidence: 0.25 };
    case ScannerErrorCode.TOO_DARK:
      return { brightness: 0.15 };
    case ScannerErrorCode.GLARE:
      return { glare: 0.91 };
    default:
      return {};
  }
}

export function createSimulatedSignals({
  isScanning,
  progress,
  forcedErrorCode,
  scenario = ScannerSimulationScenario.NO_ERRORS,
}) {
  if (!isScanning) {
    return DEFAULT_SCAN_SIGNALS;
  }

  const healthySignals = {
    ...DEFAULT_SCAN_SIGNALS,
    // Keep small variance so the scan feels alive even in simulation mode.
    verticalSpeed: 0.45 + Math.random() * 0.35,
    stability: 0.82 + Math.random() * 0.12,
    brightness: 0.55 + Math.random() * 0.25,
    glare: 0.04 + Math.random() * 0.08,
  };

  if (forcedErrorCode) {
    return mergeScannerSignals(healthySignals, createSignalsForErrorCode(forcedErrorCode));
  }

  if (scenario === ScannerSimulationScenario.NO_ERRORS) {
    return healthySignals;
  }

  const allowRandomError = progress > 8 && progress < 95;
  const shouldInjectError = allowRandomError && Math.random() < 0.055;

  if (!shouldInjectError) {
    return healthySignals;
  }

  return mergeScannerSignals(healthySignals, createSignalsForErrorCode(pickRandomErrorCode()));
}

export function resolveScannerError(signals) {
  return evaluateScannerError(signals);
}
