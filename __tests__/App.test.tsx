/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-vision-camera', () => {
  const ReactNative = require('react-native');
  const cameraPermissionStatus = jest.fn(async () => 'granted');
  const requestCameraPermission = jest.fn(async () => 'granted');

  const mockReact = require('react');

  const CameraComponent = mockReact.forwardRef((props, ref) => {
    mockReact.useImperativeHandle(ref, () => ({
      startRecording: jest.fn(),
      stopRecording: jest.fn(async () => {}),
    }));

    return mockReact.createElement(ReactNative.View, props, props.children);
  });

  return {
    Camera: Object.assign(CameraComponent, {
      getCameraPermissionStatus: cameraPermissionStatus,
      requestCameraPermission,
    }),
    useCameraDevice: () => ({ id: 'mock-back-camera' }),
    useCameraPermission: () => ({
      hasPermission: true,
      requestPermission: jest.fn(async () => 'granted'),
    }),
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
