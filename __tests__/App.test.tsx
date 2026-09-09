/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.useFakeTimers();

jest.mock('sp-react-native-in-app-updates', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    addStatusUpdateListener: jest.fn(),
    checkNeedsUpdate: jest.fn().mockResolvedValue({ shouldUpdate: false }),
    installUpdate: jest.fn(),
    removeStatusUpdateListener: jest.fn(),
    startUpdate: jest.fn(),
  })),
  IAUAvailabilityStatus: { AVAILABLE: 2 },
  IAUInstallStatus: { DOWNLOADED: 11 },
  IAUUpdateKind: { FLEXIBLE: 0, IMMEDIATE: 1 },
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('react-native-razorpay', () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));

jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(),
}));

jest.mock('react-native-print', () => ({
  __esModule: true,
  default: { print: jest.fn() },
}));

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));

jest.mock('react-native-contacts', () => ({
  __esModule: true,
  default: {
    checkPermission: jest.fn(),
    getAll: jest.fn(),
    requestPermission: jest.fn(),
  },
}));

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

jest.mock('react-native-fast-image', () => {
  const React = require('react');
  const { Image } = require('react-native');
  const MockFastImage = (props) => React.createElement(Image, props);
  MockFastImage.clearDiskCache = jest.fn();
  MockFastImage.clearMemoryCache = jest.fn();
  MockFastImage.preload = jest.fn();
  MockFastImage.resizeMode = Image.resizeMode || {};
  return { __esModule: true, default: MockFastImage };
});

jest.mock('react-native-gifted-charts', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockChart = (props) => React.createElement(View, props);
  return { BarChart: MockChart, LineChart: MockChart, PieChart: MockChart };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    clear: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('react-native-worklets', () => ({}));
jest.mock('react-native-reanimated', () => {
  const { Animated } = require('react-native');
  return {
    __esModule: true,
    default: Animated,
    interpolate: jest.fn((value) => value),
    interpolateColor: jest.fn((value) => value),
    ReduceMotion: { Never: 0, System: 1 },
    runOnJS: jest.fn((callback) => callback),
    useAnimatedProps: jest.fn((callback) => callback()),
    useAnimatedStyle: jest.fn((callback) => callback()),
    useDerivedValue: jest.fn((callback) => ({ value: callback() })),
    useSharedValue: jest.fn((value) => ({ value })),
    withSpring: jest.fn((value) => value),
  };
});

test('renders correctly', async () => {
  let renderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
    await Promise.resolve();
  });
  await ReactTestRenderer.act(async () => {
    renderer.unmount();
  });
  jest.clearAllTimers();
});
