import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

export const useBackHandler = (handler: () => boolean | null | undefined) => {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const shouldPreventDefault = handler();
      return shouldPreventDefault || false;
    });

    return () => {
      if (Platform.OS === 'android' && subscription?.remove) {
        subscription.remove();
      }
    };
  }, [handler]);
};
