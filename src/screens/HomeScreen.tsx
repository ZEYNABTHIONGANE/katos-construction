import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { AppTabsParamList } from '../navigation/RootNavigator';
import { useSessionStore } from '../store/session';
import { useProject } from '../hooks/useProject';
import { useCounts } from '../hooks/useCounts';

type Props = BottomTabScreenProps<AppTabsParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { appUser } = useSessionStore();
  const projectId = appUser?.projectId;

  // Charger les données du projet et les compteurs
  const { project, loading: projectLoading, error: projectError } = useProject(projectId);
  const { counts, loading: countsLoading } = useCounts(projectId);

  // Actions rapides avec compteurs dynamiques
  const quickActions = [
    {
      title: 'Messages',
      subtitle: counts.unreadMessagesCount > 0
        ? `${counts.unreadMessagesCount} non lu${counts.unreadMessagesCount > 1 ? 's' : ''}`
        : 'Chat avec votre équipe',
      screen: 'Chat',
      badge: counts.unreadMessagesCount,
    },
    {
      title: 'Galerie',
      subtitle: `${counts.mediaCount} photo${counts.mediaCount > 1 ? 's' : ''}`,
      screen: 'Gallery',
      badge: counts.mediaCount,
    },
    {
      title: 'Sélections',
      subtitle: counts.pendingSelectionsCount > 0
        ? `${counts.pendingSelectionsCount} en attente`
        : 'Choisir les finitions',
      screen: 'Selections',
      badge: counts.pendingSelectionsCount,
    },
  ];

  // État de chargement
  if (projectLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D3E" />
        <Text style={styles.loadingText}>Chargement de votre projet...</Text>
      </View>
    );
  }

  // Pas de projet assigné
  if (!projectId || (!project && !projectLoading)) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bienvenue sur</Text>
          <Text style={styles.appTitle}>Katos Construction</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.noProjectCard}>
            <Text style={styles.noProjectIcon}>🏗️</Text>
            <Text style={styles.noProjectTitle}>Aucun projet assigné</Text>
            <Text style={styles.noProjectText}>
              Vous n'avez pas encore de projet assigné. Contactez votre chef de projet
              pour commencer votre collaboration.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Erreur de chargement
  if (projectError) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Erreur</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Erreur de chargement</Text>
            <Text style={styles.errorText}>{projectError}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Affichage normal avec données du projet
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'active': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getProgressPercent = (status: string) => {
    switch (status) {
      case 'draft': return 10;
      case 'active': return 45;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 25;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bienvenue sur</Text>
        <Text style={styles.appTitle}>Katos Construction</Text>
        <Text style={styles.subtitle}>
          {project?.title || 'Votre projet'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            onPress={() => navigation.navigate(action.screen as any)}
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir ${action.title}`}
            accessibilityHint={action.subtitle}
          >
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            <View style={styles.actionRight}>
              {action.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{action.badge}</Text>
                </View>
              )}
              <Text style={styles.actionArrow}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {project && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut du projet</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>{project.title}</Text>
            <Text style={styles.statusLabel}>
              Statut: {getStatusLabel(project.status)}
            </Text>
            {project.description && (
              <Text style={styles.statusDescription}>
                {project.description}
              </Text>
            )}
            {project.address && (
              <Text style={styles.statusAddress}>📍 {project.address}</Text>
            )}

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getProgressPercent(project.status)}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {getProgressPercent(project.status)}% complété
            </Text>

            {project.createdAt && (
              <Text style={styles.statusDate}>
                Démarré le {
                  project.createdAt instanceof Date
                    ? project.createdAt.toLocaleDateString('fr-FR')
                    : (project.createdAt as any).toDate
                    ? (project.createdAt as any).toDate().toLocaleDateString('fr-FR')
                    : new Date(project.createdAt as any).toLocaleDateString('fr-FR')
                }
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiques temps réel</Text>
        {countsLoading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator color="#2E7D3E" />
            <Text style={styles.statsLoadingText}>Chargement...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{counts.mediaCount}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{counts.unreadMessagesCount}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{counts.pendingSelectionsCount}</Text>
              <Text style={styles.statLabel}>En attente</Text>
            </View>
          </View>
        )}
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
    padding: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionArrow: {
    fontSize: 20,
    color: '#2E7D3E',
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#2E7D3E',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  statusAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
  },
  statusDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D3E',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  notificationCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 11,
    color: '#999',
  },
  // Nouveaux styles pour les états de chargement et erreur
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  noProjectCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noProjectIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noProjectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  noProjectText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcccb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Styles pour les statistiques temps réel
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsLoading: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D3E',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
