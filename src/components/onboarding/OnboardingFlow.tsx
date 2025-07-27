import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: '1',
    title: 'Welcome to MLODI',
    description: 'Your ultimate music platform for discovering and enjoying amazing tracks.',
    icon: 'musical-notes',
    backgroundColor: '#6366f1',
  },
  {
    id: '2',
    title: 'Discover Music',
    description: 'Explore trending songs, discover new artists, and find your next favorite track.',
    icon: 'compass',
    backgroundColor: '#8b5cf6',
  },
  {
    id: '3',
    title: 'Support Artists',
    description: 'Directly support your favorite artists by purchasing their music NFTs.',
    icon: 'heart',
    backgroundColor: '#ec4899',
  },
  {
    id: '4',
    title: 'Build Your Collection',
    description: 'Create and manage your personal music library with exclusive content.',
    icon: 'library',
    backgroundColor: '#06b6d4',
  },
  {
    id: '5',
    title: 'Join the Community',
    description: 'Connect with other music lovers and participate in community challenges.',
    icon: 'people',
    backgroundColor: '#10b981',
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
