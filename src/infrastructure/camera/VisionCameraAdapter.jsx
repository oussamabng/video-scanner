import React, { forwardRef, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

const VisionCameraAdapter = forwardRef(function VisionCameraAdapter(
  { style, isActive, torchEnabled = false, onReady, onError, children },
  ref,
) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const onPressGrantPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  if (!hasPermission) {
    return (
      <View style={[styles.stateContainer, style]}>
        <Text style={styles.stateTitle}>Camera permission required</Text>
        <Text style={styles.stateSubtitle}>
          Allow camera access to scan receipts.
        </Text>
        <Pressable
          style={styles.permissionButton}
          onPress={onPressGrantPermission}
        >
          <Text style={styles.permissionButtonLabel}>Grant Camera Access</Text>
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
        ref={ref}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={Boolean(isActive)}
        photo
        audio={false}
        torch={torchEnabled ? 'on' : 'off'}
        onInitialized={onReady}
        onError={onError}
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
