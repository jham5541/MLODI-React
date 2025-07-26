const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize for Expo Go
config.resolver.assetExts.push('bin');
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// Reduce bundle size for faster loading
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Optimize for better performance
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;