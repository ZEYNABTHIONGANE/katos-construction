import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const navigateToLogin = () => {
    navigation.replace('Login');
  };

  useEffect(() => {
    // Start animations
    opacity.value = withTiming(1, { duration: 1000 });
    scale.value = withTiming(1, { duration: 1000 });

    // Navigate after delay
    const timer = setTimeout(() => {
      runOnJS(navigateToLogin)();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.logoContainer}>
          <MaterialIcons name="home-work" size={80} color="#EF9631" />
        </View>
        <Text style={styles.title}>Katos Construction</Text>
        <Text style={styles.subtitle}>Votre maison, notre passion</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B2E83',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(224, 176, 67, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'FiraSans_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#EF9631',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'FiraSans_400Regular',
  },
});