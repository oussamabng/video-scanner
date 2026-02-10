// src/infrastructure/sensors/motion.js

export function subscribeToMotionSignals(onMotion) {
  // TODO(phase-3): wire a maintained sensor library (for example `react-native-sensors`)
  // and map acceleration/gyro data to `{ stability, verticalSpeed }`.
  // For phase 1 and phase 2 fallback this intentionally stays no-op.
  if (typeof onMotion === 'function') {
    // no-op
  }

  return () => {};
}
