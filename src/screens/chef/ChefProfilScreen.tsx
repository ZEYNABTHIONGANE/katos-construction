import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';

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

  const profileOptions: ProfileOption[] = [
    {
      id: '1',
      title: 'Informations personnelles',
      icon: 'person',
      onPress: () => {},
    },
    {
      id: '2',
      title: 'Équipe et ouvriers',
      icon: 'group',
      onPress: () => {},
    },
    {
      id: '3',
      title: 'Paramètres',
      icon: 'settings',
      onPress: () => {},
    },
    {
      id: '4',
      title: 'Notifications',
      icon: 'notifications',
      onPress: () => {},
    },
    {
      id: '5',
      title: 'Rapports et statistiques',
      icon: 'assessment',
      onPress: () => {},
    },
    {
      id: '6',
      title: 'Aide et support',
      icon: 'help',
      onPress: () => {},
    },
    {
      id: '7',
      title: 'À propos',
      icon: 'info',
      onPress: () => {},
    },
    {
      id: '8',
      title: 'Se déconnecter',
      icon: 'exit-to-app',
      onPress: handleLogout,
      showArrow: false,
      textColor: '#F44336',
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
        showNotification={true}
        onNotificationPress={() => {}}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Ibrahima Sarr</Text>
            <Text style={styles.profileRole}>Chef de chantier</Text>
            <Text style={styles.profileEmail}>chef@katos.com</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <MaterialIcons name="edit" size={20} color="#E96C2E" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Projets actifs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>Projets terminés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3 ans</Text>
            <Text style={styles.statLabel}>Expérience</Text>
          </View>
        </View>
      </View>

      <View style={styles.optionsSection}>
        {profileOptions.map(renderProfileOption)}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Katos Construction v1.0.0
        </Text>
        <Text style={styles.footerSubtext}>
          © 2024 Tous droits réservés
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
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  editButton: {
    padding: 8,
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
    fontFamily: 'FiraSans_500Medium',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_500Medium',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
  },
});