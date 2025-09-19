// Unified dynamic config (SDK 54)
// Merges environment-driven values with project settings previously in app.json
module.exports = ({ config }) => ({
  name: 'MLODI',
  slug: 'm3lodi-mobile',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#000000'
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.MLODI.app',
    infoPlist: {
      UIBackgroundModes: ['audio'],
      NSCameraUsageDescription: 'This app uses the camera to take photos for profile pictures and content sharing.',
      NSPhotoLibraryUsageDescription: 'This app accesses your photo library to select images for profile pictures and content sharing.',
      'com.apple.developer.in-app-payments': ['merchant.com.heftydon.mlodi'],
      'com.apple.developer.applesignin': ['Default']
    }
  },
  android: {
    package: 'com.MLODI.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000'
    },
    edgeToEdgeEnabled: true,
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.WAKE_LOCK'
    ]
  },
  web: {
    favicon: './assets/favicon.png'
  },
  scheme: 'mlodi',
  plugins: [
    'expo-router',
    'expo-audio',
    'expo-video',
    [
      'expo-image-picker',
      {
        photosPermission: 'The app accesses your photos to let you select images for your profile and content sharing.'
      }
    ],
    [
      'expo-apple-authentication',
      {
        merchantId: 'merchant.com.heftydon.mlodi'
      }
    ]
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    walletConnectProjectId: process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    appUrl: process.env.EXPO_PUBLIC_APP_URL,
    eas: {
      projectId: '60578151-9cf1-46bb-8469-35659e9abb9c'
    }
  },
  owner: 'heftydon'
});
