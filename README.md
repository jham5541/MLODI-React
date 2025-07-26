# M3lodi Mobile - React Native

This is the React Native version of M3lodi, a Web3-enabled music streaming platform that works with both Expo Go and development builds.

## 🚀 Features

- ✅ **React Navigation** - Tab and stack navigation
- ✅ **Theme System** - Dark/light/auto theme support with AsyncStorage persistence
- ✅ **Audio Playback** - React Native Track Player integration with background support
- ✅ **Web3 Integration** - WalletConnect support for mobile wallets (Development builds only)
- ✅ **Supabase Backend** - Authentication and database integration
- ✅ **State Management** - Zustand stores adapted for React Native
- ✅ **TypeScript** - Full type safety
- ✅ **Expo Go Compatible** - Core features work in Expo Go for quick testing

## 📱 Requirements

- **Expo Go** for basic testing (some features limited)
- **Expo Development Client** for full feature testing (Web3, advanced audio)
- Node.js 18+
- iOS Simulator / Android Emulator or physical device
- Supabase project
- WalletConnect project ID

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
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
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id  # Optional for Expo Go
```

### 3. Testing Options

#### Option A: Expo Go (Quick Testing) ⚡
```bash
npm start
```
Scan the QR code with Expo Go app. 

**Available in Expo Go:**
- ✅ Navigation and UI
- ✅ Theme switching
- ✅ Basic audio playback
- ✅ Authentication (email only)
- ✅ Music browsing
- ✅ Playlists
- ❌ Web3 wallet features
- ❌ Advanced audio features
- ❌ NFT marketplace functionality

#### Option B: Development Build (Full Features) 🚀
Create a development build for full functionality:

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

**Available in Development Build:**
- ✅ All Expo Go features
- ✅ Web3 wallet connection
- ✅ Advanced audio playback
- ✅ NFT marketplace
- ✅ Background audio
- ✅ Lock screen controls

## 🎵 Audio Features

### Expo Go
- **Basic playback** - Play/pause music with expo-av
- **Progress tracking** - Real-time position updates
- **Queue support** - Basic playlist playback

### Development Build
- **All Expo Go features** plus:
- **Background playback** - Music continues when app is backgrounded
- **Lock screen controls** - Control playback from lock screen
- **Advanced queue management** - Full playlist functionality
- **Seek functionality** - Jump to specific positions

## 🔗 Web3 Features

### Expo Go
- **Mock implementation** - Shows limitations dialog
- **UI components** - All Web3 UI components work (without functionality)

### Development Build
- **WalletConnect** - Connect to mobile wallets
- **Wagmi integration** - Ethereum blockchain interaction
- **NFT support** - Music NFT ownership tracking
- **Real transactions** - Actual blockchain interactions

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
├── polyfills/          # Expo Go compatibility polyfills
├── services/           # API and external services
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🚀 Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 🔄 Migration from Expo Go to Development Build

When you're ready to test Web3 features:

1. **Install missing dependencies:**
   ```bash
   npm install @web3modal/wagmi-react-native @walletconnect/react-native-compat wagmi viem ethers
   ```

2. **Restore Web3Context:**
   - Uncomment the original Web3Context implementation
   - Re-enable Web3Provider in App.tsx

3. **Build development client:**
   ```bash
   eas build --profile development --platform ios
   ```

## 🆘 Troubleshooting

### Common Issues

1. **"Unable to resolve module"** - Clear cache with `expo r -c` and reinstall dependencies
2. **Audio not working** - Basic audio works in Expo Go, advanced features need development build
3. **Web3 connection fails** - Web3 features only work in development builds, not Expo Go
4. **Build fails** - Clear cache with `expo r -c` and try again

### Expo Go vs Development Build

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Basic Navigation | ✅ | ✅ |
| Theme System | ✅ | ✅ |
| Email Auth | ✅ | ✅ |
| Basic Audio | ✅ | ✅ |
| Music Browsing | ✅ | ✅ |
| Web3 Wallets | ❌ | ✅ |
| NFT Features | ❌ | ✅ |
| Background Audio | ❌ | ✅ |
| OAuth (Google/Apple) | ❌ | ✅ |

### Getting Help

For development help, check:
- [React Navigation docs](https://reactnavigation.org/)
- [Expo Development Client docs](https://docs.expo.dev/development/introduction/)
- [Expo Go limitations](https://docs.expo.dev/workflow/expo-go/)
- [WalletConnect React Native docs](https://docs.walletconnect.com/web3modal/react-native/about)