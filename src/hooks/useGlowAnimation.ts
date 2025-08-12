import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export interface GlowAnimationStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: Animated.AnimatedInterpolation<string | number>;
  shadowRadius: Animated.AnimatedInterpolation<string | number>;
}

interface GlowAnimationConfig {
  color: string;
  duration?: number;
  minOpacity?: number;
  maxOpacity?: number;
  minRadius?: number;
  maxRadius?: number;
}

export function useGlowAnimation({
  color,
  duration = 2000,
  minOpacity = 0.5,
  maxOpacity = 0.8,
  minRadius = 5,
  maxRadius = 15,
}: GlowAnimationConfig): GlowAnimationStyle {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the pulsating animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration,
          // Shadow props can't use native driver
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [glowAnim, duration]);

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [minOpacity, maxOpacity],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [minRadius, maxRadius],
    }),
  };
}
