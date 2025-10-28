import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'> & {
  onContinue?: () => void;
};

export default function SplashScreen({ navigation, onContinue }: Props) {
  const handleConnect = () => {
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <ExpoLinearGradient
      colors={['#2B2E83', '#E96C2E']}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
        </View>
        <Text style={styles.title}>Katos Connect</Text>
        <Text style={styles.subtitle}>Votre maison, notre passion</Text>
        <Text style={styles.description}>
          Bienvenue dans l'application de suivi de chantier.
          Suivez l'avancement de votre projet en temps réel.
        </Text>

        <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
          <Text style={styles.connectButtonText}>Se connecter</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#2B2E83" />
        </TouchableOpacity>
      </View>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  content: {
    alignItems: 'center',
    maxWidth: 350,
  },
  logoContainer: {
    width: 140,
    height: 140,  
    borderRadius: 70,
    backgroundColor : "#f7f7f9",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'FiraSans_700Bold',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'FiraSans_500Medium',
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontFamily: 'FiraSans_400Regular',
    lineHeight: 24,
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 180,
    justifyContent: 'center',
  },
  connectButtonText: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginRight: 8,
  },
});