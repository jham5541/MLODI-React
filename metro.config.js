const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for more file extensions
config.resolver.assetExts.push('cjs');
config.resolver.sourceExts.push('mjs');

// Simplified resolver for Expo Go compatibility
config.resolver.alias = {
  crypto: 'expo-crypto',
  'react-native-url-polyfill': 'react-native-url-polyfill',
};

module.exports = config;