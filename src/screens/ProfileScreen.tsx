import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { signOut } from 'firebase/auth';

import { auth } from '../services/firebase';
import { useSessionStore } from '../store/session';
import { useProject } from '../hooks/useProject';
import { AppTabsParamList } from '../navigation/RootNavigator';

type Props = BottomTabScreenProps<AppTabsParamList, 'Profile'>;

export default function ProfileScreen({ }: Props) {
  const { firebaseUser, appUser } = useSessionStore();
  const { project, loading: projectLoading, error: projectError } = useProject(appUser?.projectId);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('👋 Déconnexion en cours...');
              await signOut(auth);
              // La navigation se fera automatiquement via le guard d'auth
              console.log('✅ Déconnexion réussie');
            } catch (error: any) {
              console.error('❌ Erreur déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          }
        }
      ]
    );
  };

  // Utiliser les vraies données utilisateur ou fallback
  const userInfo = {
    name: appUser?.displayName || firebaseUser?.displayName || 'Utilisateur',
    email: appUser?.email || firebaseUser?.email || 'email@exemple.com',
    role: appUser?.role === 'chef' ? 'Chef de projet' : 'Client',
    projectId: appUser?.projectId || 'Non assigné',
    phone: '+33 6 12 34 56 78', // Placeholder - pas encore dans le modèle User
    uid: firebaseUser?.uid || 'N/A',
  };

  // Informations du projet
  const projectInfo = {
    title: project?.title || 'Aucun projet assigné',
    status: project?.status || 'draft',
    address: project?.address || 'Adresse non renseignée',
    createdAt: project?.createdAt,
  };

  // Obtenir le label du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '📝 Brouillon';
      case 'active': return '🔨 En cours';
      case 'completed': return '✅ Terminé';
      case 'cancelled': return '❌ Annulé';
      default: return '➖ Inconnu';
    }
  };

  // Raccourcis admin pour les chefs
  const adminItems = appUser?.role === 'chef' ? [
    {
      id: 'upload-media',
      title: 'Upload médias',
      subtitle: 'Ajouter photos/vidéos',
      icon: '📸',
      disabled: false,
      action: () => {
        Alert.alert('Info', 'Utilisez l\'écran Galerie pour uploader des médias');
      }
    },
    {
      id: 'validate-selections',
      title: 'Valider sélections',
      subtitle: 'Review choix clients',
      icon: '✅',
      disabled: false,
      action: () => {
        Alert.alert('Info', 'Utilisez l\'écran Sélections pour valider');
      }
    },
    {
      id: 'project-stats',
      title: 'Statistiques projet',
      subtitle: 'Vue d\'ensemble',
      icon: '📊',
      disabled: true,
    },
  ] : [];

  const menuItems = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: '🔔',
      disabled: false,
      action: () => {
        // Pour l'instant, utiliser Alert, plus tard on pourra ajouter la navigation
        Alert.alert(
          'Paramètres des notifications',
          'Utilisez l\'écran séparé de paramètres notifications (en développement)'
        );
      }
    },
    { id: 'documents', title: 'Mes documents', icon: '📄', disabled: true },
    { id: 'settings', title: 'Paramètres', icon: '⚙️', disabled: true },
    { id: 'support', title: 'Support', icon: '📞', disabled: true },
    { id: 'about', title: 'À propos', icon: 'ℹ️', disabled: true },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {userInfo.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <Text style={styles.userName}>{userInfo.name}</Text>
        <Text style={styles.userRole}>{userInfo.role}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userInfo.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rôle</Text>
            <Text style={styles.infoValue}>{userInfo.role}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Projet ID</Text>
            <Text style={styles.infoValue}>{userInfo.projectId}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{userInfo.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Utilisateur</Text>
            <Text style={styles.infoValue}>{userInfo.uid}</Text>
          </View>
        </View>
      </View>

      <View style={styles.projectSection}>
        <Text style={styles.sectionTitle}>
          {appUser?.role === 'chef' ? 'Projet en charge' : 'Mon projet'}
        </Text>
      <View style={styles.projectCard}>
          {projectLoading ? (
            <View style={styles.projectState}>
              <ActivityIndicator size="small" color="#2E7D3E" />
              <Text style={styles.projectStateText}>Chargement du projet...</Text>
            </View>
          ) : projectError ? (
            <View style={styles.projectState}>
              <Text style={styles.projectStateIcon}>⚠️</Text>
              <Text style={styles.projectStateText}>{projectError}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.projectTitle}>{projectInfo.title}</Text>
              <Text style={styles.projectStatus}>{getStatusLabel(projectInfo.status)}</Text>
              {projectInfo.address && (
                <Text style={styles.projectAddress}>📍 {projectInfo.address}</Text>
              )}
              {projectInfo.createdAt && (
                <Text style={styles.projectDate}>
                  Démarré le {
                    projectInfo.createdAt instanceof Date
                      ? projectInfo.createdAt.toLocaleDateString('fr-FR')
                      : (projectInfo.createdAt as any)?.toDate
                      ? (projectInfo.createdAt as any).toDate().toLocaleDateString('fr-FR')
                      : new Date(projectInfo.createdAt as any).toLocaleDateString('fr-FR')
                  }
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Raccourcis admin pour les chefs */}
      {adminItems.length > 0 && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Raccourcis Chef</Text>
          {adminItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.disabled && styles.menuItemDisabled]}
              disabled={item.disabled}
              onPress={item.action}
              accessibilityRole="button"
              accessibilityState={{ disabled: item.disabled }}
              accessibilityLabel={item.title}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuContent}>
                <Text style={[
                  styles.menuTitle,
                  item.disabled && styles.menuTitleDisabled
                ]}>
                  {item.title}
                </Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              {item.disabled && (
                <Text style={styles.comingSoonBadge}>Bientôt</Text>
              )}
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Menu</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, item.disabled && styles.menuItemDisabled]}
            disabled={item.disabled}
            onPress={(item as any).action || undefined}
            accessibilityRole="button"
            accessibilityState={{ disabled: item.disabled }}
            accessibilityLabel={item.title}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[
              styles.menuTitle,
              item.disabled && styles.menuTitleDisabled
            ]}>
              {item.title}
            </Text>
            {item.disabled && (
              <Text style={styles.comingSoonBadge}>Bientôt</Text>
            )}
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Se déconnecter"
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>Version 1.0.0 (MVP)</Text>
        <Text style={styles.companyText}>Katos Construction © 2024</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E7D3E',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  infoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  projectSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  projectCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  projectStateIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  projectStateText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  projectTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  projectStatus: {
    fontSize: 14,
    color: '#2E7D3E',
    marginBottom: 4,
  },
  projectAddress: {
    fontSize: 12,
    color: '#666',
  },
  projectDate: {
    fontSize: 12,
    color: '#666',
  },
  adminSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 15,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  menuTitleDisabled: {
    color: '#999',
  },
  menuArrow: {
    fontSize: 16,
    color: '#ccc',
    marginLeft: 10,
  },
  comingSoonBadge: {
    backgroundColor: '#4A90E2',
    color: 'white',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  versionInfo: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  companyText: {
    fontSize: 11,
    color: '#ccc',
  },
});
