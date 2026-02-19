import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { chantierService } from '../../services/chantierService';
import { clientService } from '../../services/clientService';
import { FirebaseChantier } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<ChefTabParamList, 'ChefDashboard'>;

interface StatCard {
  id: string;
  title: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  backgroundColor: string;
}

export default function ChefDashboardScreen({ navigation }: Props) {
  const { user, userData, loading: authLoading } = useAuth();
  const [chantiers, setChantiers] = useState<FirebaseChantier[]>([]);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      loadChefData();
    }
  }, [user, authLoading]);

  const loadChefData = async () => {
    try {
      setLoading(true);

      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour accéder à cette page');
        return;
      }

      // Use the authenticated user's ID as the chef ID
      const chefId = user.uid;

      // Set up real-time listener for chef chantiers
      const unsubscribeChantiers = chantierService.subscribeToChefChantiers(chefId, (chantiersData) => {
        setChantiers(chantiersData);
        updateStats(chantiersData);
        setLoading(false);
      });

      return () => {
        unsubscribeChantiers();
      };
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
      setLoading(false);
    }
  };

  const updateStats = (chantiersData: FirebaseChantier[]) => {
    const totalChantiers = chantiersData.length;
    const chantiersActifs = chantiersData.filter(c => c.status === 'En cours').length;
    const chantiersTermines = chantiersData.filter(c => c.status === 'Terminé').length;
    const chantiersEnRetard = chantiersData.filter(c => c.status === 'En retard').length;

    const newStats: StatCard[] = [
      {
        id: '1',
        title: 'Projets actifs',
        value: chantiersActifs.toString(),
        icon: 'domain',
        color: '#2B2E83',
        backgroundColor: '#F8F9FF',
      },
      {
        id: '2',
        title: 'Terminés',
        value: chantiersTermines.toString(),
        icon: 'check-circle',
        color: '#4CAF50',
        backgroundColor: '#F1F8E9',
      },
      {
        id: '3',
        title: 'En retard',
        value: chantiersEnRetard.toString(),
        icon: 'warning',
        color: '#F44336',
        backgroundColor: '#FFEBEE',
      },
      {
        id: '4',
        title: 'Total projets',
        value: totalChantiers.toString(),
        icon: 'assessment',
        color: '#E96C2E',
        backgroundColor: '#FFF7ED',
      },
    ];

    setStats(newStats);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };




  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <AppHeader
          title="Tableau de bord"
          showNotification={true}
          onNotificationPress={() => { }}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2B2E83" />
          <Text style={styles.loadingText}>Chargement en cours...</Text>
        </View>
      </View>
    );
  }
  const handleProjectPress = (chantier: FirebaseChantier) => {
    if (chantier.id) {
      navigation.navigate('ChefChantiers', { selectedChantierId: chantier.id });
    } else {
      navigation.navigate('ChefChantiers', {});
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return '#E0B043';
      case 'En retard':
        return '#F44336';
      case 'Terminé':
        return '#4CAF50';
      default:
        return '#9CA3AF';
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Tableau de bord"
        showNotification={false}
        onNotificationPress={() => { }}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ExpoLinearGradient
          colors={['#2B2E83', '#E96C2E']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.welcomeSection}
        >
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.name}>{userData?.displayName || user?.displayName || 'Chef'}</Text>
          <Text style={styles.subtitle}>Ingénieur chez Katos Construction</Text>
        </ExpoLinearGradient>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Aperçu général</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <TouchableOpacity key={stat.id} style={styles.statCard}>
                <View style={[styles.statCardContent, { backgroundColor: stat.backgroundColor }]}>
                  <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                    <MaterialIcons name={stat.icon} size={28} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.projectsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Projets en cours</Text>
            {/* <TouchableOpacity
            onPress={() => navigation.navigate('ChefChantiers')}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity> */}
          </View>

          {chantiers.slice(0, 3).map((chantier) => (
            <TouchableOpacity
              key={chantier.id}
              style={styles.projectCard}
              onPress={() => handleProjectPress(chantier)}
              activeOpacity={0.7}
            >
              <View style={styles.projectCardInner}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>{chantier.name}</Text>
                    <Text style={styles.clientName}>{chantier.address}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(chantier.status) }]}>
                    <Text style={styles.statusText}>{chantier.status}</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progression</Text>
                    <Text style={styles.progressValue}>{chantier.globalProgress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <ExpoLinearGradient
                      colors={['#2B2E83', '#E96C2E']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={[
                        styles.progressFill,
                        { width: `${chantier.globalProgress}%` }
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.projectFooter}>
                  <View style={styles.dueDateContainer}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="schedule" size={18} color="#2B2E83" />
                    </View>
                    <Text style={styles.dueDate}>Échéance: {formatDate(chantier.plannedEndDate)}</Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <MaterialIcons name="arrow-forward-ios" size={18} color="#2B2E83" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {chantiers.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="domain" size={64} color="#E0E0E0" />
              <Text style={styles.emptyStateText}>Aucun chantier assigné</Text>
              <Text style={styles.emptyStateSubtext}>
                Vous n'avez pas encore de chantiers assignés
              </Text>
            </View>
          )}
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
  welcomeSection: {
    paddingHorizontal: 25,
    paddingVertical: 30,
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_400Regular',
    opacity: 0.9,
  },
  name: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
    marginTop: 5,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    opacity: 0.8,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statCardContent: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'FiraSans_600SemiBold',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'FiraSans_700Bold',
    marginBottom: 8,
  },
  projectsContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
  },
  projectCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    minHeight: 120,
  },
  projectCardInner: {
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  progressValue: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dueDate: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: 'FiraSans_600SemiBold',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});