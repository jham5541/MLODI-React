import React, { useEffect, useState } from 'react';
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
import { events, FAN_POINTS_AWARDED } from '../../services/events';
import { LinearGradient } from 'expo-linear-gradient';

interface PointsNotificationProps {
  // Optional manual trigger props
  show?: boolean;
  points?: number;
  message?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const PointsNotification: React.FC<PointsNotificationProps> = ({
  show: manualShow = false,
  points: manualPoints = 0,
  message: manualMessage = ''
}) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  
  const [isVisible, setIsVisible] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [displayMessage, setDisplayMessage] = useState('');
  
  const slideAnim = useState(new Animated.Value(-100))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];
  const coinRotation = useState(new Animated.Value(0))[0];

  // Listen for points awarded events
  useEffect(() => {
    const handlePointsAwarded = (data: any) => {
      console.log('Points notification received:', data);
      showNotification(
        data.points || 50,
        getMessageForType(data.refType)
      );
    };

    events.on(FAN_POINTS_AWARDED, handlePointsAwarded);
    
    return () => {
      events.off(FAN_POINTS_AWARDED, handlePointsAwarded);
    };
  }, []);

  // Handle manual trigger
  useEffect(() => {
    if (manualShow && manualPoints > 0) {
      showNotification(manualPoints, manualMessage);
    }
  }, [manualShow, manualPoints, manualMessage]);

  const getMessageForType = (refType: string): string => {
    switch (refType) {
      case 'song_listen':
        return 'for listening!';
      case 'song_purchase':
        return 'for your purchase!';
      case 'video_watch':
        return 'for watching!';
      case 'video_purchase':
        return 'for your purchase!';
      case 'merch_order':
        return 'for your order!';
      default:
        return 'earned!';
    }
  };

  const showNotification = (points: number, message: string) => {
    setDisplayPoints(points);
    setDisplayMessage(message);
    setIsVisible(true);

    // Reset animations
    slideAnim.setValue(-100);
    scaleAnim.setValue(0.8);
    opacityAnim.setValue(0);
    coinRotation.setValue(0);

    // Slide in and scale up
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 50,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Coin rotation animation
      Animated.loop(
        Animated.timing(coinRotation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start(),
    ]).start();

    // Hide after 3 seconds
    setTimeout(() => {
      hideNotification();
    }, 3000);
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  if (!isVisible) return null;

  const spin = coinRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <LinearGradient
        colors={[themeColors.primary, themeColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ rotateY: spin }] },
            ]}
          >
            <Ionicons name="star" size={32} color="#FFD700" />
          </Animated.View>
          
          <View style={styles.textContainer}>
            <Text style={styles.pointsText}>+{displayPoints} Points</Text>
            <Text style={styles.messageText}>{displayMessage}</Text>
          </View>
        </View>
        
        <View style={styles.sparkleContainer}>
          {[...Array(3)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.sparkle,
                {
                  left: `${20 + i * 30}%`,
                  opacity: opacityAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0.5],
                  }),
                },
              ]}
            >
              <Ionicons name="sparkles" size={16} color="#FFD700" />
            </Animated.View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 999,
  },
  gradient: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute',
    top: '20%',
  },
});
