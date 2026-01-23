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
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { Toast } from 'toastify-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      // Mettre à jour le mot de passe Firebase
      await updatePassword(user, newPassword);

      // Marquer que ce n'est plus un mot de passe temporaire
      await updateDoc(doc(db, 'users', user.uid), {
        isTemporaryPassword: false,
        passwordChangedAt: new Date()
      });

      Toast.success('Mot de passe mis à jour avec succès');

      Alert.alert(
        'Succès',
        'Votre mot de passe a été modifié avec succès.',
        [
          {
            text: 'Continuer',
            onPress: () => navigation.replace('Main')
          }
        ]
      );
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      Alert.alert('Erreur', 'Impossible de modifier le mot de passe: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Ignorer le changement',
      'Vous pourrez modifier votre mot de passe plus tard dans les paramètres.',
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
            <MaterialIcons name="lock-reset" size={40} color="#2B2E83" />
          </View>
          <Text style={styles.title}>Nouveau mot de passe</Text>
          <Text style={styles.subtitle}>
            Sécurisez votre compte avec un nouveau mot de passe
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.changeButton,
                (!newPassword || !confirmPassword || loading) && styles.changeButtonDisabled
              ]}
              onPress={handleChangePassword}
              disabled={!newPassword || !confirmPassword || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.changeButtonText}>Modifier le mot de passe</Text>
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

          <View style={styles.infoContainer}>
            <MaterialIcons name="info" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Le mot de passe doit contenir au moins 6 caractères
            </Text>
          </View>
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
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'FiraSans_400Regular',
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 8,
  },
  changeButton: {
    backgroundColor: '#2B2E83',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  changeButtonDisabled: {
    opacity: 0.6,
  },
  changeButtonText: {
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
});