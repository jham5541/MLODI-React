import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase/client';

class GoogleAuthService {
  private isConfigured = false;

  configure() {
    if (this.isConfigured) return;

    try {
      let webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      
      // Platform-specific client IDs
      if (Platform.OS === 'ios' && process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) {
        webClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
      } else if (Platform.OS === 'android' && process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
        webClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
      }

      GoogleSignin.configure({
        webClientId: webClientId || '',
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
        accountName: '',
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
        googleServicePlistPath: '',
        scopes: ['email', 'profile'],
      });

      this.isConfigured = true;
      console.log('✅ Google Sign-In configured successfully');
    } catch (error) {
      console.error('❌ Google Sign-In configuration failed:', error);
    }
  }

  async signIn() {
    try {
      this.configure();

      // Check if device supports Google Play Services (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful:', { 
        email: userInfo.user.email,
        name: userInfo.user.name 
      });

      // Get Google access token
      const tokens = await GoogleSignin.getTokens();
      console.log('✅ Google tokens retrieved');

      // Sign in to Supabase with Google token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.idToken,
        access_token: tokens.accessToken,
      });

      if (error) {
        console.error('❌ Supabase Google auth error:', error);
        throw error;
      }

      console.log('✅ Supabase Google auth successful:', { 
        userId: data.user?.id,
        email: data.user?.email 
      });

      return {
        success: true,
        user: data.user,
        session: data.session,
      };

    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else {
        throw new Error(error.message || 'Google Sign-In failed');
      }
    }
  }

  async signOut() {
    try {
      await GoogleSignin.signOut();
      await supabase.auth.signOut();
      console.log('✅ Google Sign-Out successful');
    } catch (error) {
      console.error('❌ Google Sign-Out failed:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      return userInfo;
    } catch (error) {
      console.log('No current Google user signed in');
      return null;
    }
  }

  async isSignedIn() {
    return GoogleSignin.isSignedIn();
  }
}

export const googleAuthService = new GoogleAuthService();
