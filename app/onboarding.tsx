import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { ArrowRight } from 'lucide-react-native';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

export default function OnboardingScreen() {
  const { theme, colors } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      if (value === 'false') {
        router.replace('/(tabs)');
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundAccent]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to MoodTrack
        </Text>
        
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/6898854/pexels-photo-6898854.jpeg' }} 
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          A simple way to track your mood over time and discover patterns in your emotional well-being.
        </Text>
        
        <View style={styles.features}>
          <FeatureItem 
            text="Track your mood daily with just a tap" 
            color={colors.textSecondary}
          />
          <FeatureItem 
            text="Visualize trends with beautiful charts" 
            color={colors.textSecondary}
          />
          <FeatureItem 
            text="All data stays on your device" 
            color={colors.textSecondary}
          />
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={completeOnboarding}
      >
        <Text style={styles.buttonText}>Get Started</Text>
        <ArrowRight size={20} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

function FeatureItem({ text, color }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.bullet} />
      <Text style={[styles.featureText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    marginBottom: 24,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c83fd',
    marginRight: 12,
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  buttonText: {
    fontFamily: 'Inter-Medium',
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
});