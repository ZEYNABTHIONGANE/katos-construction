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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '../../services/firebase';
import { simulateLogin } from '../../services/auth';
import { AuthStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Connexion réussie:', userCredential.user.uid);

      // La navigation se fera automatiquement via le guard d'auth
    } catch (error: any) {
      console.error('❌ Erreur connexion:', error);

      let errorMessage = 'Erreur de connexion';

      // Messages d'erreur plus user-friendly
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cette adresse email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Adresse email invalide';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Ce compte a été désactivé';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives de connexion. Veuillez réessayer plus tard';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Erreur de connexion', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Connexion fictive pour test MVP
  const handleSimulateLogin = () => {
    Alert.alert(
      'Connexion fictive',
      'Pour tester la navigation (MVP)',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Simuler Chef',
          onPress: async () => {
            setLoading(true);
            try {
              await simulateLogin('chef');
            } catch (error: any) {
              Alert.alert('Erreur', 'Impossible de simuler la connexion');
            } finally {
              setLoading(false);
            }
          }
        },
        {
          text: 'Simuler Client',
          onPress: async () => {
            setLoading(true);
            try {
              await simulateLogin('client');
            } catch (error: any) {
              Alert.alert('Erreur', 'Impossible de simuler la connexion');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Connexion Katos</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          accessibilityLabel="Adresse email"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          accessibilityLabel="Mot de passe"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Se connecter"
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Aller à l'inscription"
          accessibilityState={{ disabled: loading }}
        >
          <Text style={styles.linkText}>
            Pas encore de compte ? S'inscrire
          </Text>
        </TouchableOpacity>

        {/* Bouton de test pour MVP */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Mode Test MVP</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleSimulateLogin}
            accessibilityRole="button"
            accessibilityLabel="Simuler une connexion"
          >
            <Text style={styles.testButtonText}>Simulate Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#2E7D3E',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2E7D3E',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#2E7D3E',
    fontSize: 14,
  },
  testSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
