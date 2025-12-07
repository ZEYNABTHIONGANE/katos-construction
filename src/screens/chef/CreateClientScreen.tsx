import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Clipboard,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import { useClientCreation } from '../../hooks/useClientCreation';
import type { FirebaseClient } from '../../types/firebase';

type Props = NativeStackScreenProps<ChefTabParamList, 'ChefDashboard'>;

interface CredentialsDisplayProps {
  credentials: {
    username: string;
    password: string;
    loginUrl: string;
  };
  clientName: string;
}

const CredentialsDisplay: React.FC<CredentialsDisplayProps> = ({ credentials, clientName }) => {
  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copié', `${label} copié dans le presse-papier`);
  };

  const shareCredentials = () => {
    const message = `🏗️ Accès à votre projet Katos

Bonjour ${clientName},

Vos identifiants d'accès à l'application Katos :

👤 Nom d'utilisateur : ${credentials.username}
🔐 Mot de passe : ${credentials.password}

📱 Pour vous connecter :
1. Téléchargez l'app Katos
2. Cliquez sur "Se connecter"
3. Saisissez vos identifiants ci-dessus

Vous pourrez suivre l'avancement de votre projet en temps réel !`;

    Share.share({ message });
  };

  return (
    <View style={styles.credentialsContainer}>
      <View style={styles.credentialsHeader}>
        <MaterialIcons name="check-circle" size={32} color="#10B981" />
        <Text style={styles.successTitle}>Client créé avec succès !</Text>
        <Text style={styles.successSubtitle}>Voici les identifiants générés :</Text>
      </View>

      <View style={styles.credentialCard}>
        <View style={styles.credentialRow}>
          <Text style={styles.credentialLabel}>Nom d'utilisateur</Text>
          <View style={styles.credentialValue}>
            <Text style={styles.credentialText}>{credentials.username}</Text>
            <TouchableOpacity
              onPress={() => copyToClipboard(credentials.username, 'Nom d\'utilisateur')}
              style={styles.copyButton}
            >
              <MaterialIcons name="content-copy" size={20} color="#E96C2E" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.credentialRow}>
          <Text style={styles.credentialLabel}>Mot de passe</Text>
          <View style={styles.credentialValue}>
            <Text style={styles.credentialText}>{credentials.password}</Text>
            <TouchableOpacity
              onPress={() => copyToClipboard(credentials.password, 'Mot de passe')}
              style={styles.copyButton}
            >
              <MaterialIcons name="content-copy" size={20} color="#E96C2E" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.shareSection}>
        <TouchableOpacity style={styles.shareButton} onPress={shareCredentials}>
          <MaterialIcons name="share" size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Envoyer au client</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.warningBox}>
        <MaterialIcons name="info" size={16} color="#F59E0B" />
        <Text style={styles.warningText}>
          Ces identifiants doivent être communiqués au client de manière sécurisée.
        </Text>
      </View>
    </View>
  );
};

export default function CreateClientScreen({ navigation }: Props) {
  const { creating, error, createClient, clearError } = useClientCreation();
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    password: string;
    loginUrl: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    localisationSite: '',
    projetAdhere: '',
  });

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const validateForm = (): boolean => {
    if (!formData.nom.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return false;
    }
    if (!formData.prenom.trim()) {
      Alert.alert('Erreur', 'Le prénom est requis');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Erreur', 'L\'email est requis');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Erreur', 'Format d\'email invalide');
      return false;
    }
    if (!formData.telephone.trim()) {
      Alert.alert('Erreur', 'Le téléphone est requis');
      return false;
    }
    if (!formData.projetAdhere.trim()) {
      Alert.alert('Erreur', 'Le nom du projet est requis');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const clientData: Omit<FirebaseClient, 'id' | 'createdAt'> = {
      ...formData,
      status: 'En attente',
      invitationStatus: 'pending',
    };

    const result = await createClient(clientData);

    if (result.success && result.credentials) {
      setGeneratedCredentials(result.credentials);
      setShowCredentials(true);
    } else if (result.error) {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleReset = () => {
    setShowCredentials(false);
    setGeneratedCredentials(null);
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
      localisationSite: '',
      projetAdhere: '',
    });
  };

  if (showCredentials && generatedCredentials) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleReset}>
            <MaterialIcons name="arrow-back" size={24} color="#2B2E83" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Client Créé</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color="#2B2E83" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <CredentialsDisplay
            credentials={generatedCredentials}
            clientName={`${formData.prenom} ${formData.nom}`}
          />

          <TouchableOpacity style={styles.newClientButton} onPress={handleReset}>
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newClientButtonText}>Créer un autre client</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2B2E83" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau Client</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.nom}
              onChangeText={(text) => updateFormData('nom', text)}
              placeholder="Nom de famille"
              placeholderTextColor="#9CA3AF"
              editable={!creating}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Prénom *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.prenom}
              onChangeText={(text) => updateFormData('prenom', text)}
              placeholder="Prénom"
              placeholderTextColor="#9CA3AF"
              editable={!creating}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              placeholder="email@exemple.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!creating}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Téléphone *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.telephone}
              onChangeText={(text) => updateFormData('telephone', text)}
              placeholder="+33 6 12 34 56 78"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              editable={!creating}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Adresse</Text>
            <TextInput
              style={styles.textInput}
              value={formData.adresse}
              onChangeText={(text) => updateFormData('adresse', text)}
              placeholder="Adresse complète"
              placeholderTextColor="#9CA3AF"
              editable={!creating}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Localisation du site</Text>
            <TextInput
              style={styles.textInput}
              value={formData.localisationSite}
              onChangeText={(text) => updateFormData('localisationSite', text)}
              placeholder="Adresse du chantier"
              placeholderTextColor="#9CA3AF"
              editable={!creating}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom du projet *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.projetAdhere}
              onChangeText={(text) => updateFormData('projetAdhere', text)}
              placeholder="Ex: Construction villa"
              placeholderTextColor="#9CA3AF"
              editable={!creating}
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={16} color="#F44336" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, creating && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={creating}
        >
          {creating ? (
            <>
              <ActivityIndicator size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Création en cours...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Créer le client</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_400Regular',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#F44336',
    fontFamily: 'FiraSans_400Regular',
    marginLeft: 8,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E96C2E',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 8,
  },
  credentialsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  credentialsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 20,
    color: '#10B981',
    fontFamily: 'FiraSans_700Bold',
    marginTop: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 4,
  },
  credentialCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  credentialRow: {
    marginBottom: 16,
  },
  credentialLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  credentialValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  credentialText: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  shareSection: {
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2B2E83',
    paddingVertical: 16,
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'FiraSans_400Regular',
    marginLeft: 8,
  },
  newClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E96C2E',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  newClientButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 8,
  },
});