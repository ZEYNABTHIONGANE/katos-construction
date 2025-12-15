import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../contexts/AuthContext';
import { chantierService } from '../../services/chantierService';

type Props = NativeStackScreenProps<ChefTabParamList, 'ChefProfil'> & {
  onLogout: () => void;
};

interface ProfileOption {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  showArrow?: boolean;
  textColor?: string;
}

export default function ChefProfilScreen({ navigation, onLogout }: Props) {
  const { user, loading: authLoading, deleteAccount } = useAuth();
  const [stats, setStats] = useState({
    totalChantiers: 0,
    chantiersActifs: 0,
    chantiersTermines: 0,
    progressionMoyenne: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      loadChefStats();
    }
  }, [user, authLoading]);

  const loadChefStats = async () => {
    if (!user?.uid) return;

    setLoadingStats(true);
    try {
      const chefStats = await chantierService.getChefStats(user.uid);
      setStats(chefStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: onLogout,
        },
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
              onLogout(); // Appeler le callback de déconnexion pour rediriger
            }
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://katosconsulting.com/faq/');
  };

  const profileOptions: ProfileOption[] = [
    {
      id: '1',
      title: 'Support et aide',
      icon: 'help-center',
      onPress: handleContactSupport,
    },
    {
      id: '2',
      title: 'Politique de confidentialité',
      icon: 'privacy-tip',
      onPress: handlePrivacyPolicy,
    },
    {
      id: '3',
      title: 'À propos de l\'application',
      icon: 'info',
      onPress: () => {
        Alert.alert(
          'Katos Construction',
          'Application mobile pour la gestion des chantiers de construction.\n\nVersion 1.0.0\n© 2024 Tous droits réservés',
          [{ text: 'OK' }]
        );
      },
    },
    {
      id: '4',
      title: 'Supprimer mon compte',
      icon: 'delete-forever',
      onPress: handleDeleteAccount,
      showArrow: false,
      textColor: '#F44336',
    },
    {
      id: '5',
      title: 'Se déconnecter',
      icon: 'exit-to-app',
      onPress: handleLogout,
      showArrow: false,
      textColor: '#E96C2E',
    },
  ];

  const renderProfileOption = (option: ProfileOption) => (
    <TouchableOpacity
      key={option.id}
      style={styles.optionItem}
      onPress={option.onPress}
    >
      <View style={styles.optionLeft}>
        <View style={[
          styles.optionIcon,
          option.textColor && { backgroundColor: option.textColor + '15' }
        ]}>
          <MaterialIcons
            name={option.icon}
            size={20}
            color={option.textColor || '#003366'}
          />
        </View>
        <Text style={[
          styles.optionTitle,
          option.textColor && { color: option.textColor }
        ]}>
          {option.title}
        </Text>
      </View>
      {option.showArrow !== false && (
        <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Profil"
            showNotification={false}
        onNotificationPress={() => {}}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={[styles.profileImageContainer, { backgroundColor: '#E0E7FF' }]}>
            <Text style={{ fontSize: 32, fontFamily: 'FiraSans_700Bold', color: '#2B2E83' }}>
              {user?.displayName
                ? user.displayName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'CC'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.displayName || 'Chef de chantier'}
            </Text>
            <Text style={styles.profileRole}>Chef de chantier</Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'chef@katos.com'}
            </Text>
          </View>
        </View>

        {loadingStats ? (
          <View style={[styles.statsContainer, { flexDirection: 'column' }]}>
            <ActivityIndicator size="small" color="#2B2E83" />
            <Text style={styles.loadingText}>Chargement des statistiques...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalChantiers}</Text>
              <Text style={styles.statLabel}>Projets total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.chantiersActifs}</Text>
              <Text style={styles.statLabel}>Projets actifs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.chantiersTermines}</Text>
              <Text style={styles.statLabel}>Projets terminés</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.optionsSection}>
        {profileOptions.map(renderProfileOption)}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Katos Construction
        </Text>
        <Text style={styles.footerSubtext}>
          Gestion de chantiers de construction
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  profileSection: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 80,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  optionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
  },
});