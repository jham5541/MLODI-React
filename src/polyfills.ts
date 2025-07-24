import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import '@walletconnect/react-native-compat';

// React DOM polyfill for @tanstack/react-query
import { unstable_batchedUpdates } from 'react-native';
const ReactDOM = {
  unstable_batchedUpdates,
  render: () => {},
  createPortal: () => {},
  findDOMNode: () => {},
  unmountComponentAtNode: () => {},
};

// Make react-dom available globally
if (typeof window !== 'undefined') {
  (window as any)['react-dom'] = ReactDOM;
}
if (typeof global !== 'undefined') {
  (global as any)['react-dom'] = ReactDOM;
}

// Module exports for ES modules
(global as any).__reactDomModule = ReactDOM;

// Polyfill for crypto if needed
if (typeof global.crypto === 'undefined') {
  global.crypto = require('expo-crypto');
}

// TextEncoder/TextDecoder polyfill for React Native
if (typeof global.TextEncoder === 'undefined') {
  // Use the util polyfill for TextEncoder/TextDecoder
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Buffer polyfill
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}