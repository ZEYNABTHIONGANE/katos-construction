import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useClientAuth } from '../../hooks/useClientAuth';
import { Toast } from 'toastify-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'InvitationAuth'>;

export default function InvitationAuthScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const { authenticateWithInvitation, loginWithPIN, hasPIN, loading } = useClientAuth();
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    handleInvitationAuth();
  }, []);

  const handleInvitationAuth = async () => {
    try {
      setAuthenticating(true);

      // Vérifier s'il y a déjà un PIN configuré
      const hasExistingPIN = await hasPIN();

      if (hasExistingPIN) {
        // Demander le PIN avant d'accepter l'invitation
        setShowPinInput(true);
        setAuthenticating(false);
        return;
      }

      // Tenter l'authentification directe avec le token
      const success = await authenticateWithInvitation(token);

      if (success) {
        // Rediriger vers l'écran principal ou demander la création d'un PIN
        showPinCreationDialog();
      } else {
        // Échec de l'authentification
        Alert.alert(
          'Erreur d\'authentification',
          'Impossible de se connecter avec ce lien d\'invitation.',
          [
            {
              text: 'Réessayer',
              onPress: handleInvitationAuth
            },
            {
              text: 'Retour',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handlePinLogin = async () => {
    if (pin.length !== 4) {
      Toast.error('Le code PIN doit contenir 4 chiffres');
      return;
    }

    setAuthenticating(true);
    const success = await loginWithPIN(pin);

    if (success) {
      // Authentifier avec l'invitation après le PIN
      await authenticateWithInvitation(token);
    }

    setAuthenticating(false);
  };

  const showPinCreationDialog = () => {
    Alert.alert(
      'Sécuriser votre compte',
      'Souhaitez-vous créer un code PIN pour sécuriser votre prochaine connexion ?',
      [
        {
          text: 'Plus tard',
          onPress: () => navigation.replace('Main'),
          style: 'cancel'
        },
        {
          text: 'Créer un PIN',
          onPress: () => navigation.replace('CreatePIN')
        }
      ]
    );
  };

  const renderPinInput = () => (
    <View style={styles.pinContainer}>
      <Text style={styles.pinTitle}>Code PIN requis</Text>
      <Text style={styles.pinSubtitle}>
        Entrez votre code PIN à 4 chiffres pour continuer
      </Text>

      <View style={styles.pinInputContainer}>
        <TextInput
          style={styles.pinInput}
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          placeholder="••••"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <TouchableOpacity
        style={[styles.pinButton, authenticating && styles.pinButtonDisabled]}
        onPress={handlePinLogin}
        disabled={authenticating || pin.length !== 4}
      >
        {authenticating ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.pinButtonText}>Valider</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderAuthenticating = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text style={styles.loadingText}>
        Authentification en cours...
      </Text>
      <Text style={styles.loadingSubtext}>
        Vérification de votre invitation
      </Text>
    </View>
  );

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
            <MaterialIcons name="security" size={40} color="#2B2E83" />
          </View>
          <Text style={styles.title}>Katos Connect</Text>
          <Text style={styles.subtitle}>
            {showPinInput ? 'Authentification sécurisée' : 'Connexion par invitation'}
          </Text>
        </View>

        <View style={styles.form}>
          {authenticating ? renderAuthenticating() : null}
          {showPinInput && !authenticating ? renderPinInput() : null}
        </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginHorizontal: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 18,
    color: '#2B2E83',
    marginTop: 16,
    fontFamily: 'FiraSans_600SemiBold',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'FiraSans_400Regular',
  },
  pinContainer: {
    alignItems: 'center',
  },
  pinTitle: {
    fontSize: 20,
    color: '#2B2E83',
    marginBottom: 8,
    fontFamily: 'FiraSans_600SemiBold',
  },
  pinSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'FiraSans_400Regular',
  },
  pinInputContainer: {
    marginBottom: 24,
  },
  pinInput: {
    width: 120,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'FiraSans_600SemiBold',
    backgroundColor: '#F9FAFB',
    letterSpacing: 8,
  },
  pinButton: {
    backgroundColor: '#2B2E83',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#2B2E83',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pinButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  pinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'FiraSans_600SemiBold',
  },
});