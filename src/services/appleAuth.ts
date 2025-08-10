import * as AppleAuthentication from 'expo-apple-authentication';
import { APPLE_AUTH_CONFIG } from './apple-auth-config';

export const signInWithApple = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      webAuthenticationOptions: {
        clientId: APPLE_AUTH_CONFIG.BUNDLE_ID,
        redirectURI: `https://auth.expo.io/@heftydon/m3lodi-mobile`,
      },
    });

    return credential;
  } catch (error: any) {
    if (error.code === 'ERR_CANCELED') {
      // User canceled the sign-in flow
      return null;
    }
    throw error;
  }
};

export const isAppleAuthAvailable = async () => {
  return await AppleAuthentication.isAvailableAsync();
};
