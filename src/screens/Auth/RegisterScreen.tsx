import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '../../services/firebase';
import { AuthStackParamList } from '../../navigation/RootNavigator';
import { CreateUserData } from '../../types/user';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !displayName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      // 1. Créer le compte Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Mettre à jour le profil Firebase avec le nom d'affichage
      await updateProfile(user, {
        displayName: displayName
      });

      // 3. Créer le document utilisateur dans Firestore
      const userData: CreateUserData = {
        uid: user.uid,
        role: 'client', // Rôle par défaut
        displayName: displayName,
        email: email,
        // Les clients n'ont pas de projectId assigné au moment de l'inscription
        // Cela sera fait par un chef de projet plus tard
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Utilisateur créé avec succès:', user.uid);

      Alert.alert(
        'Compte créé',
        'Votre compte a été créé avec succès ! Vous êtes maintenant connecté.',
        [{ text: 'OK' }]
      );

      // La navigation se fera automatiquement via le guard d'auth
    } catch (error: any) {
      console.error('❌ Erreur inscription:', error);

      let errorMessage = 'Une erreur est survenue lors de l\'inscription';

      // Messages d'erreur plus user-friendly
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse email est déjà utilisée';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe est trop faible';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'L\'adresse email n\'est pas valide';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Erreur lors de l\'inscription', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Inscription Katos</Text>

        <TextInput
          style={styles.input}
          placeholder="Nom complet"
          value={displayName}
          onChangeText={setDisplayName}
          editable={!loading}
          accessibilityLabel="Nom complet"
        />

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

        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
          accessibilityLabel="Confirmation du mot de passe"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Créer un compte"
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Retour à la connexion"
          accessibilityState={{ disabled: loading }}
        >
          <Text style={styles.linkText}>
            Déjà un compte ? Se connecter
          </Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Les nouveaux comptes sont créés avec le rôle "Client" par défaut.
            Contactez votre chef de projet pour obtenir les accès appropriés.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
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
    marginTop: 20,
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
    marginBottom: 20,
  },
  linkText: {
    color: '#2E7D3E',
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
