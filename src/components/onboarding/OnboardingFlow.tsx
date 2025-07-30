import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme, colors } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: string[];
  features?: string[];
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: '1',
    title: 'Welcome to M3lodi',
    subtitle: 'The Future of Music',
    description: 'Experience music like never before with blockchain-powered ownership and exclusive artist content.',
    icon: 'musical-notes',
    gradientColors: ['#667eea', '#764ba2'],
    features: [
      'Stream millions of songs',
      'Own your favorite tracks',
      'Support artists directly'
    ]
  },
  {
    id: '2',
    title: 'Discover & Stream',
    subtitle: 'Unlimited Music',
    description: 'Explore curated playlists, trending tracks, and personalized recommendations tailored just for you.',
    icon: 'headset',
    gradientColors: ['#f093fb', '#f5576c'],
    features: [
      'AI-powered recommendations',
      'Curated playlists daily',
      'High-quality audio streaming'
    ]
  },
  {
    id: '3',
    title: 'Own Your Music',
    subtitle: 'Digital Collectibles',
    description: 'Purchase exclusive NFTs from your favorite artists and build your unique music collection.',
    icon: 'diamond',
    gradientColors: ['#4facfe', '#00f2fe'],
    features: [
      'Limited edition releases',
      'Exclusive content access',
      'Trade with collectors'
    ]
  },
  {
    id: '4',
    title: 'Support Artists',
    subtitle: 'Direct Connection',
    description: 'Connect directly with artists, access exclusive content, and help them grow their careers.',
    icon: 'heart',
    gradientColors: ['#fa709a', '#fee140'],
    features: [
      'Direct artist support',
      'Exclusive fan experiences',
      'Early access to releases'
    ]
  },
  {
    id: '5',
    title: 'Join the Revolution',
    subtitle: 'Start Your Journey',
    description: 'Be part of the music revolution. Your collection, your rules, your community.',
    icon: 'rocket',
    gradientColors: ['#a8edea', '#fed6e3'],
    features: [
      'Global music community',
      'Earn rewards & badges',
      'Shape the future of music'
    ]
  },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({
        x: nextStep * width,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollViewRef.current?.scrollTo({
        x: prevStep * width,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollView: {
      flex: 1,
    },
    stepContainer: {
      width,
      height,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    description: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 60,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 50,
      left: 0,
      right: 0,
      paddingHorizontal: 40,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: themeColors.border,
    },
    paginationDotActive: {
      backgroundColor: themeColors.primary,
      width: 24,
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    skipButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    skipText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    navigationButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    navButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: themeColors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    nextButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    finishButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 24,
    },
    finishButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const renderStep = (step: OnboardingStep, index: number) => (
    <View key={step.id} style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: step.backgroundColor }]}>
        <Ionicons name={step.icon} size={60} color="white" />
      </View>
      
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.description}>{step.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {onboardingSteps.map(renderStep)}
      </ScrollView>

      <View style={styles.bottomContainer}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentStep && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <View style={styles.navigationButtons}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                <Ionicons name="chevron-back" size={24} color={themeColors.text} />
              </TouchableOpacity>
            )}

            {currentStep < onboardingSteps.length - 1 ? (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={handleNext}
              >
                <Ionicons name="chevron-forward" size={24} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.finishButton} onPress={onComplete}>
                <Text style={styles.finishButtonText}>Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
