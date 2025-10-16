import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../types';
import { mockUser, mockProject } from '../../data/mockData';

type Props = BottomTabScreenProps<HomeTabParamList, 'Profil'> & {
  onLogout?: () => void;
};

export default function ProfilScreen({ navigation, onLogout }: Props) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    Alert.alert(
      'Déconnexion',
      'Vous avez été déconnecté avec succès.',
      [
        {
          text: 'OK',
          onPress: () => {
            // In a real app, this would clear the auth state
            // For now, we'll just show an alert
            console.log('User logged out');
          }
        }
      ]
    );
  };

  const profileSections = [
    {
      title: 'Informations personnelles',
      items: [
        {
          icon: 'person',
          label: 'Nom complet',
          value: mockUser.name,
        },
        {
          icon: 'email',
          label: 'Adresse email',
          value: mockUser.email,
        },
        {
          icon: 'phone',
          label: 'Téléphone',
          value: mockUser.phone,
        },
      ],
    },
    {
      title: 'Mon projet',
      items: [
        {
          icon: 'home-work',
          label: 'Nom du projet',
          value: mockProject.name,
        },
        {
          icon: 'location-on',
          label: 'Adresse',
          value: mockProject.address,
        },
        {
          icon: 'schedule',
          label: 'Statut',
          value: mockProject.status,
          color: '#EF9631',
        },
        {
          icon: 'trending-up',
          label: 'Avancement',
          value: `${mockProject.progress}%`,
          color: '#28a745',
        },
      ],
    },
    {
      title: 'Application',
      items: [
        {
          icon: 'notifications',
          label: 'Notifications',
          value: 'Activées',
          hasArrow: true,
        },
        {
          icon: 'help',
          label: 'Aide & Support',
          value: '',
          hasArrow: true,
        },
        {
          icon: 'info',
          label: 'À propos',
          value: 'Version 1.0.0',
          hasArrow: true,
        },
      ],
    },
  ];

  const renderProfileItem = (item: any, index: number) => (
    <TouchableOpacity key={index} style={styles.profileItem}>
      <View style={styles.profileItemLeft}>
        <MaterialIcons name={item.icon} size={20} color="#666" />
        <Text style={styles.profileItemLabel}>{item.label}</Text>
      </View>
      <View style={styles.profileItemRight}>
        <Text
          style={[
            styles.profileItemValue,
            item.color && { color: item.color },
          ]}
        >
          {item.value}
        </Text>
        {item.hasArrow && (
          <MaterialIcons name="chevron-right" size={20} color="#666" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        {/* Header moderne */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.headerRight} />
        </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: mockUser.avatar }} style={styles.avatar} />
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialIcons name="camera-alt" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{mockUser.name}</Text>
          <Text style={styles.userEmail}>{mockUser.email}</Text>
        </View>

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) =>
                renderProfileItem(item, itemIndex)
              )}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutModal(true)}
          >
            <MaterialIcons name="logout" size={20} color="#e74c3c" />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            Katos Construction © 2024
          </Text>
          <Text style={styles.appInfoSubtext}>
            Votre maison, notre passion
          </Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons name="logout" size={48} color="#e74c3c" />
            <Text style={styles.modalTitle}>Se déconnecter</Text>
            <Text style={styles.modalText}>
              Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleLogout}
              >
                <Text style={styles.confirmButtonText}>Se déconnecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2B2E83',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 80,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'FiraSans_700Bold',
  },
  headerRight: {
    width: 40,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#EF9631',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#EF9631',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    color: '#1A1A1A',
    marginBottom: 5,
    fontFamily: 'FiraSans_700Bold',
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#2B2E83',
    marginBottom: 10,
    fontFamily: 'FiraSans_700Bold',
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    fontFamily: 'FiraSans_400Regular',
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileItemValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
    fontFamily: 'FiraSans_400Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#e74c3c',
    fontFamily: 'FiraSans_500Medium',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'FiraSans_500Medium',
  },
  appInfoSubtext: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
    fontFamily: 'FiraSans_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 25,
    marginHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    color: '#2B2E83',
    marginTop: 15,
    marginBottom: 10,
    fontFamily: 'FiraSans_700Bold',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
    fontFamily: 'FiraSans_400Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'FiraSans_500Medium',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'FiraSans_500Medium',
  },
  scrollContent: {
    paddingBottom: 130, // Espace pour la navigation flottante
  },
});