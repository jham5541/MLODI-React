import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// React DOM polyfill for @tanstack/react-query (if needed)
import { unstable_batchedUpdates } from 'react-native';
const ReactDOM = {
  unstable_batchedUpdates,
  render: () => {},
  createPortal: () => {},
  findDOMNode: () => {},
  unmountComponentAtNode: () => {},
};

// Make react-dom available globally only if needed
if (typeof global !== 'undefined' && !global.__reactDomModule) {
  (global as any)['react-dom'] = ReactDOM;
  (global as any).__reactDomModule = ReactDOM;
}

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

// Fix BackHandler for react-native-modal compatibility
try {
  const { BackHandler } = require('react-native');
  if (BackHandler && !BackHandler.removeEventListener) {
    BackHandler.removeEventListener = function() {
      console.warn('BackHandler.removeEventListener is not available in this React Native version');
      return true;
    };
  }
} catch (error) {
  console.log('BackHandler polyfill not needed or unavailable');
}
