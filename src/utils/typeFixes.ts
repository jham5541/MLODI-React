// Type fixes and utilities for common TypeScript issues

// Navigation types
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';

// Fixed navigation hook with proper typing
export function useTypedNavigation<T extends keyof RootStackParamList = 'MainTabs'>() {
  type NavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<RootStackParamList, T>,
    BottomTabNavigationProp<TabParamList>
  >;
  
  return useNavigation<NavigationProp>();
}

// Expo AV fixes
export enum InterruptionModeIOS {
  MixWithOthers = 0,
  DoNotMix = 1,
  DuckOthers = 2,
}

export enum InterruptionModeAndroid {
  DoNotMix = 1,
  DuckOthers = 2,
}

// Fix for missing properties on User type
export interface ExtendedUser {
  id: string;
  email?: string;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  profileImage?: string;
  isPublicProfile?: boolean;
  allowMessages?: boolean;
  showActivity?: boolean;
  country?: string;
  address?: string;
}

// Type guards
export function isExtendedUser(user: any): user is ExtendedUser {
  return user && typeof user.id === 'string';
}

// Utility type for fixing nullable types
export type NonNullableFields<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

// Fix for async function type issues
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    fn(...args).catch(console.error);
  };
}

// Fix for implicit any types
export function safeJsonParse<T = any>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

// Fix for style type issues
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export type StyleProp = ViewStyle | TextStyle | ImageStyle;

export function combineStyles<T extends StyleProp>(
  ...styles: (T | undefined | null | false)[]
): T {
  return Object.assign({}, ...styles.filter(Boolean)) as T;
}
