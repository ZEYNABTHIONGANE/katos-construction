import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useClientAuth } from '../../hooks/useClientAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePIN'>;

export default function CreatePINScreen({ navigation }: Props) {
  const { createPIN } = useClientAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'create' | 'confirm'>('create');

  const handleCreatePin = async () => {
    if (pin.length !== 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir 4 chiffres');
      return;
    }

    if (step === 'create') {
      setStep('confirm');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Erreur', 'Les codes PIN ne correspondent pas');
      setStep('create');
      setPin('');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    const success = await createPIN(pin);

    if (success) {
      Alert.alert(
        'Code PIN créé',
        'Votre code PIN a été créé avec succès. Vous pourrez l\'utiliser pour vos prochaines connexions.',
        [
          {
            text: 'Continuer',
            onPress: () => navigation.replace('Main')
          }
        ]
      );
    }

    setLoading(false);
  };

  const handleSkip = () => {
    Alert.alert(
      'Ignorer la création du PIN',
      'Vous pourrez créer un code PIN plus tard dans les paramètres.',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Ignorer',
          onPress: () => navigation.replace('Main')
        }
      ]
    );
  };

  const renderPinDots = (value: string) => {
    const dots = [];
    for (let i = 0; i < 4; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            i < value.length ? styles.pinDotFilled : styles.pinDotEmpty
          ]}
        />
      );
    }
    return dots;
  };

  return (
    <ExpoLinearGradient
      colors={['#2B2E83', '#E96C2E']}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="lock" size={40} color="#2B2E83" />
          </View>
          <Text style={styles.title}>Code PIN</Text>
          <Text style={styles.subtitle}>
            {step === 'create'
              ? 'Créez un code PIN à 4 chiffres'
              : 'Confirmez votre code PIN'
            }
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.pinDisplay}>
            {step === 'create' ? renderPinDots(pin) : renderPinDots(confirmPin)}
          </View>

          <TextInput
            style={styles.hiddenInput}
            value={step === 'create' ? pin : confirmPin}
            onChangeText={step === 'create' ? setPin : setConfirmPin}
            keyboardType="numeric"
            maxLength={4}
            autoFocus
          />

          <Text style={styles.instruction}>
            {step === 'create'
              ? 'Entrez un code PIN à 4 chiffres'
              : 'Confirmez votre code PIN'
            }
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.createButton,
                (step === 'create' ? pin.length !== 4 : confirmPin.length !== 4) && styles.createButtonDisabled,
                loading && styles.createButtonDisabled
              ]}
              onPress={handleCreatePin}
              disabled={loading || (step === 'create' ? pin.length !== 4 : confirmPin.length !== 4)}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.createButtonText}>
                  {step === 'create' ? 'Continuer' : 'Créer le PIN'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={loading}
            >
              <Text style={styles.skipButtonText}>Ignorer pour le moment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {step === 'confirm' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setStep('create');
              setConfirmPin('');
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        )}
      </View>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f7f7f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'FiraSans_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontFamily: 'FiraSans_400Regular',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  pinDisplay: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  pinDotFilled: {
    backgroundColor: '#2B2E83',
  },
  pinDotEmpty: {
    backgroundColor: '#E5E7EB',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'FiraSans_400Regular',
  },
  buttonContainer: {
    width: '100%',
  },
  createButton: {
    backgroundColor: '#2B2E83',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'FiraSans_600SemiBold',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'FiraSans_400Regular',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'FiraSans_400Regular',
  },
});