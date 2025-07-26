# M3lodi Expo Go Compatibility Guide

## 🚀 Quick Start with Expo Go

This guide explains how to test M3lodi with Expo Go and what features are available.

### 1. Setup for Expo Go

```bash
# Clone the repository
git clone <repository-url>
cd m3lodi-mobile

# Install dependencies
npm install

# Start the development server
npm start
```

Scan the QR code with the Expo Go app on your device.

### 2. What Works in Expo Go ✅

#### Core Features
- ✅ **Navigation** - All tab and stack navigation
- ✅ **Theme System** - Dark/light/auto theme switching
- ✅ **Authentication** - Email-based authentication (no OAuth)
- ✅ **Music Browsing** - Browse songs, albums, artists
- ✅ **Playlists** - Create and manage playlists
- ✅ **Search** - Search for music content
- ✅ **Basic Audio** - Play/pause audio with expo-av
- ✅ **UI Components** - All visual components work

#### Limited Features
- ⚠️ **Audio Playback** - Basic playback only (no background audio)
- ⚠️ **Social Login** - Only email authentication available
- ⚠️ **Push Notifications** - Basic implementation only

### 3. What Doesn't Work in Expo Go ❌

#### Web3 Features
- ❌ **Wallet Connection** - Shows limitation dialog
- ❌ **NFT Marketplace** - Shows limitation dialog for purchases
- ❌ **Blockchain Interactions** - All Web3 functionality disabled

#### Advanced Audio
- ❌ **Background Playback** - Music stops when app is backgrounded
- ❌ **Lock Screen Controls** - No lock screen integration
- ❌ **Advanced Queue Management** - Basic queue only

#### Native Features
- ❌ **OAuth (Google/Apple)** - Shows limitation dialog
- ❌ **Advanced Push Notifications** - Basic notifications only
- ❌ **Deep Linking** - Limited deep link support

### 4. Testing Strategy 🧪

#### Phase 1: UI/UX Testing (Expo Go)
Test these features in Expo Go:
- Navigation flow
- Theme switching
- Authentication (email)
- Music browsing
- Playlist creation
- Search functionality
- Basic audio playback

#### Phase 2: Full Feature Testing (Development Build)
Create a development build to test:
- Web3 wallet connection
- NFT marketplace
- Background audio
- OAuth authentication
- Advanced audio features

### 5. Switching to Development Build 🔄

When ready for full features:

1. **Install Web3 dependencies:**
   ```bash
   npm install @web3modal/wagmi-react-native @walletconnect/react-native-compat wagmi viem ethers
   ```

2. **Restore Web3 functionality:**
   - Uncomment Web3Provider in App.tsx
   - Enable Web3Context implementation
   - Restore Web3 components

3. **Build development client:**
   ```bash
   npx eas-cli@latest build --profile development --platform ios
   ```

### 6. Environment Variables 🔧

#### For Expo Go (Minimal)
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

#### For Development Build (Full)
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
EXPO_PUBLIC_APP_URL=your_app_url
```

### 7. Code Structure for Compatibility 🏗️

#### Conditional Feature Loading
```typescript
// Example: Feature availability check
const isExpoGo = __DEV__ && !Constants.appOwnership;

if (isExpoGo) {
  // Show limitation dialog or disable feature
} else {
  // Full feature implementation
}
```

#### Mock Implementations
- Web3Context provides mock implementation in Expo Go
- Audio service falls back to expo-av
- NFT components show limitation dialogs

### 8. Common Issues & Solutions 🛠️

#### Audio Not Playing
```typescript
// Make sure audio mode is set correctly
import { Audio } from 'expo-av';

await Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,
});
```

#### Web3 Errors
- All Web3 calls are mocked in Expo Go
- Check console for "Expo Go Limitation" messages
- Switch to development build for real Web3 functionality

#### Navigation Issues
- All navigation should work in Expo Go
- Check for any native module dependencies in navigation components

### 9. Performance Considerations ⚡

#### Expo Go Limitations
- Slower JavaScript execution
- Limited memory
- No native module optimizations

#### Optimization Tips
- Use React.memo for expensive components
- Implement virtual lists for large datasets
- Minimize bundle size

### 10. Deployment Strategy 🚀

#### Development Workflow
1. **Expo Go** - Quick UI/UX iteration
2. **Development Build** - Feature testing
3. **Production Build** - App store deployment

#### Feature Flags
Consider implementing feature flags to enable/disable features based on build type:

```typescript
const FEATURES = {
  WEB3: !__DEV__ || Constants.appOwnership === 'expo',
  BACKGROUND_AUDIO: Constants.appOwnership === 'expo',
  OAUTH: Constants.appOwnership === 'expo',
};
```

This allows the same codebase to work across all deployment targets while providing appropriate fallbacks for Expo Go.