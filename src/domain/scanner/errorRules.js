// src/domain/scanner/errorRules.js

import { ScannerErrorCode } from './types';

function createRuleError(code) {
  return { code };
}

export function evaluateScannerError(signals) {
  if (!signals) {
    return null;
  }

  if (signals.receiptInFrame === false || signals.boundsConfidence < 0.45) {
    return createRuleError(ScannerErrorCode.OUT_OF_FRAME);
  }

  if (signals.direction && signals.direction !== 'down') {
    return createRuleError(ScannerErrorCode.WRONG_DIRECTION);
  }

  if (typeof signals.verticalSpeed === 'number' && signals.verticalSpeed > 1.35) {
    return createRuleError(ScannerErrorCode.TOO_FAST);
  }

  if (typeof signals.stability === 'number' && signals.stability < 0.45) {
    return createRuleError(ScannerErrorCode.SHAKY);
  }

  if (typeof signals.brightness === 'number' && signals.brightness < 0.22) {
    return createRuleError(ScannerErrorCode.TOO_DARK);
  }

  if (typeof signals.glare === 'number' && signals.glare > 0.78) {
    return createRuleError(ScannerErrorCode.GLARE);
  }

  return null;
}
