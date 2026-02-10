// src/domain/scanner/hintTexts.js

import { ScannerErrorCode, ScannerPhase } from './types';

const PHASE_TEXTS = Object.freeze({
  [ScannerPhase.READY]: {
    title: 'Position Receipt',
    subtitle: 'Align top edge within the frame',
    tip: 'Tip: Keep the receipt flat and well-lit',
  },
  [ScannerPhase.SCANNING]: {
    title: 'Scanning...',
    subtitle: 'Slowly move down along the receipt',
    tip: 'Tip: Keep movement smooth and steady',
  },
  [ScannerPhase.COMPLETE]: {
    title: 'Scan Complete!',
    subtitle: 'Review and continue',
    tip: 'Tip: Rescan if anything looks clipped',
  },
});

const ERROR_TEXTS = Object.freeze({
  [ScannerErrorCode.WRONG_DIRECTION]: {
    icon: '↕',
    title: 'Wrong Direction',
    message: 'Move downward along the receipt',
  },
  [ScannerErrorCode.TOO_FAST]: {
    icon: '⚡',
    title: 'Slow Down',
    message: 'Move more slowly for better capture',
  },
  [ScannerErrorCode.SHAKY]: {
    icon: '〰',
    title: 'Hold Steady',
    message: 'Keep your hands stable for a moment',
  },
  [ScannerErrorCode.OUT_OF_FRAME]: {
    icon: '⬚',
    title: 'Out of Frame',
    message: 'Keep receipt edges inside the frame',
  },
  [ScannerErrorCode.TOO_DARK]: {
    icon: '☀',
    title: 'Low Lighting',
    message: 'Add light and avoid shadows',
  },
  [ScannerErrorCode.GLARE]: {
    icon: '✦',
    title: 'Reduce Glare',
    message: 'Tilt slightly to remove reflections',
  },
});

export function getPhaseTexts(phase) {
  return PHASE_TEXTS[phase] || PHASE_TEXTS[ScannerPhase.READY];
}

export function getErrorTexts(errorCode) {
  return (
    ERROR_TEXTS[errorCode] || {
      icon: '!',
      title: 'Adjust Position',
      message: 'Move slowly and keep the receipt in frame',
    }
  );
}
