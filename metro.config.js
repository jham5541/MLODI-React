const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for more file extensions
config.resolver.assetExts.push('cjs');

// Add crypto-related polyfills to the resolver
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'expo-crypto',
  stream: 'stream-browserify',
  url: 'react-native-url-polyfill',
  events: 'events',
  util: 'util',
  ws: require.resolve('./src/polyfills/ws.js'),
  'react-dom': require.resolve('./src/polyfills/react-dom.js'),
  // Native modules work in development builds
};

// Handle .mjs files
config.resolver.sourceExts.push('mjs');

// Custom resolver to handle react-dom imports
const originalResolver = config.resolver.resolverMainFields;
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add a custom resolver function
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-dom') {
    return {
      filePath: path.resolve(__dirname, 'src/polyfills/react-dom.js'),
      type: 'sourceFile',
    };
  }
  
  // Block ws library imports - not needed in React Native
  if (moduleName === 'ws' || moduleName.includes('ws/lib')) {
    return {
      filePath: path.resolve(__dirname, 'src/polyfills/ws.js'),
      type: 'sourceFile',
    };
  }
  
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;