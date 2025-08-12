// Order matters for polyfills
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Crypto polyfills for Web3Auth and Ethers - MUST be before ethers imports
if (typeof global !== 'undefined') {
  // Create a basic crypto object if it doesn't exist
  if (!global.crypto) {
    global.crypto = {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      subtle: {},
      webcrypto: {}
    };
  }
  
  // Ensure subtle exists
  if (!global.crypto.subtle) {
    global.crypto.subtle = {};
  }
  
  // Ensure webcrypto exists
  if (!global.crypto.webcrypto) {
    global.crypto.webcrypto = global.crypto.subtle;
  }
}

import '@ethersproject/shims';

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
if (typeof global !== 'undefined' && !(global as any).__reactDomModule) {
  (global as any)['react-dom'] = ReactDOM as any;
  (global as any).__reactDomModule = ReactDOM as any;
}

// TextEncoder/TextDecoder polyfill for React Native
if (typeof (global as any).TextEncoder === 'undefined') {
  // Use the util polyfill for TextEncoder/TextDecoder
  const { TextEncoder, TextDecoder } = require('util');
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

// Buffer polyfill
if (typeof (global as any).Buffer === 'undefined') {
  (global as any).Buffer = require('buffer').Buffer;
}

// Fix BackHandler for react-native-modal compatibility (define no-op removeEventListener if missing)
try {
  const { BackHandler } = require('react-native');
  if (BackHandler && typeof (BackHandler as any).removeEventListener !== 'function') {
    (BackHandler as any).removeEventListener = function() {
      // No-op for legacy API compatibility
      return true;
    } as any;
  }
} catch (error) {
  // No-op
}
