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

// Increase timeout for slow connections
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set longer timeout for slow connections
      res.setTimeout(300000); // 5 minutes
      return middleware(req, res, next);
    };
  },
};

// Optimize for better performance
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Simplified resolver for Expo Go compatibility
config.resolver.alias = {
  crypto: require.resolve('expo-crypto'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
};

module.exports = config;