import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useClientAuth } from '../hooks/useClientAuth';
import { useClientData } from '../hooks/useClientData';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientProfile'>;

export default function ClientProfileScreen({ navigation }: Props) {
  const { session, logout, refreshClientData, deleteAccount } = useClientAuth();
  const { clientData, loading, error, lastUpdated, refresh } = useClientData(session?.clientId || null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshClientData()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Déconnexion',
          onPress: logout,
          style: 'destructive'
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('https://katosconsulting.com/faq/');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.\n\nÊtes-vous sûr de vouloir continuer ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteAccount();
            if (success) {
              // L'utilisateur sera automatiquement redirigé car l'état d'authentification va changer
            }
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://katosconsulting.com/faq/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#3B82F6';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'pending':
        return 'En attente';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Non défini';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Session expirée</Text>
        <Text style={styles.errorText}>Veuillez vous reconnecter</Text>
      </View>
    );
  }

  const client = clientData || session.clientData;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {client?.prenom?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>
              {client?.prenom} {client?.nom}
            </Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(client?.status || '') }
                ]}
              />
              <Text style={styles.statusText}>
                {getStatusText(client?.status || '')}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Informations personnelles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{client?.email || 'Non renseigné'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{client?.telephone || 'Non renseigné'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoValue}>{client?.adresse || 'Non renseignée'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Informations du projet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Projet</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="business" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Type de projet</Text>
              <Text style={styles.infoValue}>{client?.projetAdhere || 'Non défini'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date de création</Text>
              <Text style={styles.infoValue}>{formatDate(client?.createdAt)}</Text>
            </View>
          </View>

        </View>
      </View>

      {/* Statut de l'invitation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connexion</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="link" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Statut de l'invitation</Text>
              <Text style={styles.infoValue}>
                {client?.invitationStatus === 'accepted' ? 'Acceptée' : 'En attente'}
              </Text>
            </View>
          </View>

          {client?.acceptedAt && (
            <View style={styles.infoRow}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Connecté depuis</Text>
                <Text style={styles.infoValue}>{formatDate(client.acceptedAt)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support et paramètres</Text>

        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.actionButton} onPress={handleContactSupport}>
            <View style={styles.actionButtonContent}>
              <MaterialIcons name="help-center" size={24} color="#2B2E83" />
              <Text style={styles.actionButtonText}>Support et aide</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handlePrivacyPolicy}>
            <View style={styles.actionButtonContent}>
              <MaterialIcons name="privacy-tip" size={24} color="#2B2E83" />
              <Text style={styles.actionButtonText}>Politique de confidentialité</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteAccount}>
            <View style={styles.actionButtonContent}>
              <MaterialIcons name="delete-forever" size={24} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Supprimer mon compte</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dernière mise à jour */}
      {lastUpdated && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2B2E83',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'FiraSans_700Bold',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    color: '#1F2937',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  logoutButton: {
    padding: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'FiraSans_500Medium',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 24,
    color: '#EF4444',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'FiraSans_500Medium',
    marginLeft: 12,
  },
});