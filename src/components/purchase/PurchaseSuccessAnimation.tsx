import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

interface PurchaseSuccessAnimationProps {
  visible: boolean;
  songTitle: string;
  onAnimationComplete?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PurchaseSuccessAnimation({
  visible,
  songTitle,
  onAnimationComplete,
}: PurchaseSuccessAnimationProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Start animations
      Animated.parallel([
        // Fade in and scale up the main content
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Rotate the success icon
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
        // Confetti animations
        ...confettiAnims.flatMap((anim, index) => {
          const angle = (index / confettiAnims.length) * Math.PI * 2;
          const distance = 150 + Math.random() * 100;
          const endX = Math.cos(angle) * distance;
          const endY = Math.sin(angle) * distance;
          
          return [
            Animated.timing(anim.x, {
              toValue: endX,
              duration: 1000 + Math.random() * 500,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: endY + 100,
              duration: 1000 + Math.random() * 500,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: Math.random() * 4,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 1000 + Math.random() * 500,
              delay: 500,
              useNativeDriver: true,
            }),
          ];
        }),
      ]).start();

      // Auto-hide after 2 seconds
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Reset animations
          scaleAnim.setValue(0);
          rotateAnim.setValue(0);
          confettiAnims.forEach(anim => {
            anim.x.setValue(0);
            anim.y.setValue(0);
            anim.rotate.setValue(0);
            anim.opacity.setValue(1);
          });
          onAnimationComplete?.();
        });
      }, 2000);
    }
  }, [visible]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
    },
    content: {
      backgroundColor: themeColors.surface,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    successText: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 8,
    },
    songTitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      maxWidth: 250,
    },
    confettiPiece: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 2,
    },
  });

  const confettiColors = [
    themeColors.primary,
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
    '#F8C471',
  ];

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents="none"
    >
      {/* Confetti */}
      <View style={{ position: 'absolute' }}>
        {confettiAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: confettiColors[index % confettiColors.length],
                transform: [
                  { translateX: anim.x },
                  { translateY: anim.y },
                  {
                    rotate: anim.rotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: anim.opacity,
              },
            ]}
          />
        ))}
      </View>

      {/* Success Content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Ionicons name="checkmark" size={48} color="white" />
        </Animated.View>
        
        <Text style={styles.successText}>Purchase Successful!</Text>
        <Text style={styles.songTitle} numberOfLines={2}>
          {songTitle} added to your library
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
