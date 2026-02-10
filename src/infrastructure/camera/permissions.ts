// @ts-nocheck
// src/infrastructure/camera/permissions.js

import { Camera } from 'react-native-vision-camera';

function normalizePermissionStatus(status) {
  return status === 'granted' || status === 'authorized' ? 'granted' : 'denied';
}

export async function checkCameraPermission() {
  try {
    const status = await Camera.getCameraPermissionStatus();
    return normalizePermissionStatus(status);
  } catch {
    return 'denied';
  }
}

export async function requestCameraPermission() {
  try {
    const status = await Camera.requestCameraPermission();
    return normalizePermissionStatus(status);
  } catch {
    return 'denied';
  }
}
