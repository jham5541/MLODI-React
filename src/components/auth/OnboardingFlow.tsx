import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/auth2Store';

type OnboardingStep = 'welcome' | 'profile' | 'preferences' | 'completed';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
}

const WelcomeStep: React.FC<StepProps> = ({ onNext }) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  
  return (
    <View style={styles.stepContainer}>
      <Image
        source={require('../../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.title, { color: themeColors.text }]}>
        Welcome to MLODI
      </Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Your personal music experience awaits
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColors.primary }]}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const ProfileStep: React.FC<StepProps> = ({ onNext, onSkip }) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { updateProfile } = useAuthStore();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const handleNext = async () => {
    try {
      await updateProfile({
        username,
        display_name: displayName,
      });
      onNext();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: themeColors.text }]}>
        Create Your Profile
      </Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Let's personalize your experience
      </Text>
      
      <View style={styles.form}>
        <TextInput
          style={[styles.input, {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
          }]}
          placeholder="Username"
          placeholderTextColor={themeColors.textSecondary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
          }]}
          placeholder="Display Name"
          placeholderTextColor={themeColors.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColors.primary }]}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onSkip}>
        <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>
          Skip for now
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const PreferencesStep: React.FC<StepProps> = ({ onNext }) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { updateSettings } = useAuthStore();
  const [quality, setQuality] = useState('auto');
  
  const handleNext = async () => {
    try {
      await updateSettings({
        audio_quality: quality,
      });
      onNext();
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: themeColors.text }]}>
        Audio Preferences
      </Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Choose your preferred audio quality
      </Text>
      
      <View style={styles.optionsContainer}>
        {['auto', 'high', 'normal', 'low'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.option,
              {
                backgroundColor: themeColors.surface,
                borderColor: quality === option ? themeColors.primary : 'transparent',
              },
            ]}
            onPress={() => setQuality(option)}
          >
            <Text style={[styles.optionText, { color: themeColors.text }]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColors.primary }]}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>Finish Setup</Text>
      </TouchableOpacity>
    </View>
  );
};

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const { completeOnboardingStep } = useAuthStore();

  const handleNext = async (step: OnboardingStep) => {
    await completeOnboardingStep(step);
    setCurrentStep(step);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={() => handleNext('profile')} />;
      case 'profile':
        return (
          <ProfileStep
            onNext={() => handleNext('preferences')}
            onSkip={() => handleNext('preferences')}
          />
        );
      case 'preferences':
        return <PreferencesStep onNext={() => handleNext('completed')} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {renderStep()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  option: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
