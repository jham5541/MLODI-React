# Mlodi Mobile - React Native

This is the React Native version of Mlodi, a Web3-enabled music streaming platform.

## 🚀 Features

- ✅ **React Navigation** - Tab and stack navigation
- ✅ **Theme System** - Dark/light/auto theme support with AsyncStorage persistence
- ✅ **Audio Playback** - React Native Track Player integration with background support
- ✅ **Web3 Integration** - WalletConnect support for mobile wallets
- ✅ **Supabase Backend** - Authentication and database integration
- ✅ **State Management** - Zustand stores adapted for React Native
- ✅ **TypeScript** - Full type safety

## 📱 Requirements

- **Expo Development Client** (Expo Go is NOT supported due to native modules)
- Node.js 18+
- iOS Simulator / Android Emulator or physical device
- Supabase project
- WalletConnect project ID

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
cd m3lodi-mobile
npm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Fill in your environment variables in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### 3. Create Development Build

Since this app uses native modules (react-native-track-player, Web3 libraries), you need to create a custom development client:

```bash
# Install EAS CLI globally
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# Create development build
eas build --profile development --platform ios
# or for Android
eas build --profile development --platform android
```

### 4. Install Development Client

- **iOS**: Download and install the build from the link provided by EAS
- **Android**: Download the APK and install on your device/emulator

### 5. Start Development Server

```bash
npm start
```

Then scan the QR code with your custom development client.

## 🎵 Audio Features

The app includes a complete audio system with:

- **Background playback** - Music continues when app is backgrounded
- **Lock screen controls** - Control playback from lock screen
- **Progress tracking** - Real-time position updates
- **Playlist support** - Queue management
- **Seek functionality** - Jump to specific positions

## 🔗 Web3 Features

- **WalletConnect** - Connect to mobile wallets
- **Wagmi integration** - Ethereum blockchain interaction
- **NFT support** - Music NFT ownership tracking

## 🎨 UI/UX Features

- **Adaptive theming** - Respects system preferences
- **Responsive design** - Works on phones and tablets
- **Native navigation** - Platform-specific navigation patterns
- **Gesture support** - Native gesture handling

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── audio/          # Audio player components
│   ├── auth/           # Authentication components
│   ├── common/         # Common UI elements
│   └── layout/         # Layout components
├── context/            # React contexts
├── hooks/              # Custom hooks
├── lib/                # Libraries and utilities
├── navigation/         # Navigation configuration
├── pages/              # Screen components
├── services/           # API and external services
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔧 Development Notes

### Native Modules
This app uses several native modules that require a custom development client:
- `react-native-track-player` - Audio playback
- `@web3modal/wagmi-react-native` - Web3 integration
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Gestures

### Audio Permissions
The app requests audio permissions on both platforms:
- **iOS**: Background audio mode is enabled in `app.json`
- **Android**: Audio recording permission is requested

### Web3 Integration
Web3 features require:
- WalletConnect Project ID
- Custom schemes for deep linking
- Proper polyfills for crypto functionality

## 🚀 Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 📝 Next Steps

- [ ] Implement authentication UI components
- [ ] Add music discovery features
- [ ] Integrate marketplace functionality
- [ ] Add social features (playlists, following)
- [ ] Implement push notifications
- [ ] Add offline music support
- [ ] Optimize performance and bundle size

## 🆘 Troubleshooting

### Common Issues

1. **"Unable to resolve module"** - Make sure all dependencies are installed and restart Metro
2. **Audio not working** - Ensure you're using a development client, not Expo Go
3. **Web3 connection fails** - Check your WalletConnect project ID and network configuration
4. **Build fails** - Clear cache with `expo r -c` and try again

### Getting Help

For issues specific to this React Native conversion, check:
- [React Navigation docs](https://reactnavigation.org/)
- [React Native Track Player docs](https://rntp.dev/)
- [Expo Development Client docs](https://docs.expo.dev/development/introduction/)
- [WalletConnect React Native docs](https://docs.walletconnect.com/web3modal/react-native/about)
