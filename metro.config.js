const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .cjs and .mjs files
config.resolver.sourceExts.push('cjs', 'mjs');

// Add minimal polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'expo-crypto',
  stream: 'readable-stream',
  util: 'util',
};

module.exports = config;
