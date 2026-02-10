/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-vision-camera', () => {
  const ReactNative = require('react-native');

  return {
    Camera: ReactNative.View,
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
