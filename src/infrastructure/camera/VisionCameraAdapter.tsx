// @ts-nocheck
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';


const getDeltaMotion = () => {
  'worklet';

  // Temporary mock until the native C++ pipeline is wired.
  return {
    dx: 0.06,
    dy: 0.15,
    rotation: 0.03,
    speed: 1.86,
    validMotion: true,
  };
};

const VisionCameraAdapter = forwardRef(function VisionCameraAdapter(
  {
    style,
    isActive,
    torchEnabled = false,
    recordingEnabled = false,
    onReady,
    onError,
    onRecordingFinished,
    onRecordingError,
    onCameraFrame,
    children,
  },
  ref,
) {
  // Some versions expose permissionStatus from the hook, some don’t
  const camPerm = useCameraPermission();
  const hasPermission = camPerm?.hasPermission;
  const requestPermission = camPerm?.requestPermission;
  const hookStatus = camPerm?.permissionStatus;

  const device = useCameraDevice('back');
  const cameraRef = useRef(null);

  // Use hook status if present, fallback to manual status
  const [permissionStatus, setPermissionStatus] = useState(
    hookStatus ?? 'not-determined',
  );

  const isRecordingRef = useRef(false);

  useImperativeHandle(ref, () => cameraRef.current);

  const onFramePayload = useCallback(
    payload => {
      onCameraFrame?.(payload);
    },
    [onCameraFrame],
  );

  const runOnJSFactory = global?.Worklets?.createRunOnJS;
  const runOnJSFramePayload = useMemo(
    () => (typeof runOnJSFactory === 'function' ? runOnJSFactory(onFramePayload) : null),
    [onFramePayload, runOnJSFactory],
  );
  const canBridgeFramePayloadToJS = Boolean(runOnJSFramePayload);

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      if (!canBridgeFramePayloadToJS) {
        return;
      }

      const motion = getDeltaMotion();
      const frameTimestampMs =
        typeof frame.timestamp === 'number'
          ? frame.timestamp / 1000000
          : 0;

      runOnJSFramePayload({
        frameTimestampMs,
        motion,
        // Mock value to keep the "too close" warning pipeline testable.
        receiptTooClose: false,
      });
    },
    [runOnJSFramePayload],
  );

  // Keep local status in sync with hook status (when available)
  useEffect(() => {
    if (hookStatus) setPermissionStatus(hookStatus);
  }, [hookStatus]);

  // Read permission status safely (works if sync OR async)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const fn = Camera?.getCameraPermissionStatus;
        if (typeof fn !== 'function') return;

        // Handles both:
        // - sync return: 'authorized' | 'denied' | ...
        // - async return: Promise<'authorized' | ...>
        const status = await Promise.resolve(fn());

        if (alive && status) setPermissionStatus(status);
      } catch {
        if (alive) setPermissionStatus('denied');
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Normalize “granted”/“authorized”
  const hasCameraAccess =
    Boolean(hasPermission) ||
    permissionStatus === 'authorized' ||
    permissionStatus === 'granted';

  const isBlockedPermission =
    permissionStatus === 'denied' || permissionStatus === 'restricted';

  useEffect(() => {
    if (!hasCameraAccess || !cameraRef.current || !isActive) return;

    if (recordingEnabled && !isRecordingRef.current) {
      isRecordingRef.current = true;

      cameraRef.current.startRecording({
        onRecordingFinished: video => {
          isRecordingRef.current = false;
          onRecordingFinished?.(video);
        },
        onRecordingError: error => {
          isRecordingRef.current = false;
          onRecordingError?.(error);
        },
      });

      return;
    }

    if (!recordingEnabled && isRecordingRef.current) {
      cameraRef.current.stopRecording().catch(error => {
        isRecordingRef.current = false;
        onRecordingError?.(error);
      });
    }
  }, [
    hasCameraAccess,
    isActive,
    onRecordingError,
    onRecordingFinished,
    recordingEnabled,
  ]);

  const onPressGrantPermission = useCallback(async () => {
    try {
      if (typeof requestPermission !== 'function') return;
      const status = await requestPermission();
      if (status) setPermissionStatus(status);
    } catch {
      setPermissionStatus('denied');
    }
  }, [requestPermission]);

  const onPressOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  // If we don't have access, show a friendly permission UI
  if (!hasCameraAccess) {
    return (
      <View style={[styles.stateContainer, style]}>
        <Text style={styles.stateTitle}>Camera permission required</Text>
        <Text style={styles.stateSubtitle}>
          {isBlockedPermission
            ? 'Camera access is blocked. Open phone settings and enable camera to scan receipts.'
            : 'Allow camera access to scan receipts.'}
        </Text>

        <Pressable
          style={styles.permissionButton}
          onPress={
            isBlockedPermission ? onPressOpenSettings : onPressGrantPermission
          }
        >
          <Text style={styles.permissionButtonLabel}>
            {isBlockedPermission ? 'Open Settings' : 'Grant Camera Access'}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return <View style={[styles.stateContainer, style]} />;
  }

  return (
    <View style={style}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={Boolean(isActive)}
        video
        audio={false}
        torch={torchEnabled ? 'on' : 'off'}
        onInitialized={onReady}
        onError={onError}
        frameProcessor={canBridgeFramePayloadToJS ? frameProcessor : undefined}
      />
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  stateContainer: {
    alignItems: 'center',
    backgroundColor: '#0B1019',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    color: '#EAF0FB',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateSubtitle: {
    color: 'rgba(234, 240, 251, 0.78)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#2B8BFF',
    borderRadius: 999,
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  permissionButtonLabel: {
    color: '#F6F8FF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default VisionCameraAdapter;
