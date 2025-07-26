import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// TextEncoder/TextDecoder polyfill for React Native
if (typeof global.TextEncoder === 'undefined') {
  // Simple polyfill for TextEncoder/TextDecoder
  global.TextEncoder = class {
    encode(str: string) {
      const uint8Array = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        uint8Array[i] = str.charCodeAt(i);
      }
      return uint8Array;
    }
  } as any;
  
  global.TextDecoder = class {
    decode(uint8Array: Uint8Array) {
      return String.fromCharCode(...uint8Array);
    }
  } as any;
}

// Buffer polyfill (basic implementation for Expo Go)
if (typeof global.Buffer === 'undefined') {
  global.Buffer = {
    from: (str: string) => new Uint8Array(Buffer.from ? Buffer.from(str) : []),
    isBuffer: () => false,
  } as any;
}