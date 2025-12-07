import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useClientChantier } from '../../hooks/useClientChantier';
import ProgressBar from '../../components/ProgressBar';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientProjects'>;

export default function ClientProjectsScreen({ navigation }: Props) {
  const {
    loading,
    error,
    hasChantier,
    name,
    address,
    globalProgress,
    status,
    photos,
    startDate,
    plannedEndDate,
    phases
  } = useClientChantier();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return '#4CAF50';
      case 'Terminé':
        return '#2196F3';
      case 'En retard':
        return '#F44336';
      default:
        return '#E0B043';
    }
  };

  const handleViewChantier = () => {
    // Navigate into the ClientTabs navigator and open the Chantier tab
    navigation.navigate('ClientTabs', { screen: 'Chantier' });
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2B2E83" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !hasChantier) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mon chantier</Text>
            <View style={styles.headerRight} />
          </View>
          <View style={styles.errorContent}>
            <MaterialIcons name="home-work" size={64} color="#E96C2E" />
            <Text style={styles.errorText}>Aucun chantier disponible</Text>
            <Text style={styles.errorSubtext}>
              {error || 'Votre chantier apparaîtra ici une fois créé par l\'administration'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon chantier</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Chantier Overview Card */}
          <View style={styles.chantierCard}>
            <View style={styles.chantierHeader}>
              <View style={styles.chantierInfo}>
                <Text style={styles.chantierName}>{name}</Text>
                <Text style={styles.chantierAddress}>{address}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                <Text style={styles.statusText}>{status}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progression globale</Text>
                <Text style={styles.progressValue}>{globalProgress}%</Text>
              </View>
              <ProgressBar progress={globalProgress} height={8} />
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <MaterialIcons name="calendar-today" size={20} color="#2B2E83" />
                <Text style={styles.infoLabel}>Début</Text>
                <Text style={styles.infoValue}>{startDate}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="event" size={20} color="#2B2E83" />
                <Text style={styles.infoLabel}>Fin prévue</Text>
                <Text style={styles.infoValue}>{plannedEndDate}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="photo-library" size={20} color="#2B2E83" />
                <Text style={styles.infoLabel}>Photos</Text>
                <Text style={styles.infoValue}>{photos.length}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="construction" size={20} color="#2B2E83" />
                <Text style={styles.infoLabel}>Phases</Text>
                <Text style={styles.infoValue}>{phases.length}</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewChantier}>
              <View style={styles.actionIcon}>
                <MaterialIcons name="visibility" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Voir le détail du chantier</Text>
                <Text style={styles.actionSubtitle}>Photos, phases et mises à jour</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#2B2E83" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ClientTabs', { screen: 'Chat' })}>
              <View style={[styles.actionIcon, { backgroundColor: '#E96C2E' }]}>
                <MaterialIcons name="chat" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Contacter l'équipe</Text>
                <Text style={styles.actionSubtitle}>Messages avec le chef de chantier</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#2B2E83" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ClientDocuments')}>
              <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                <MaterialIcons name="description" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Mes documents</Text>
                <Text style={styles.actionSubtitle}>Contrats, plans et factures</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#2B2E83" />
            </TouchableOpacity>
          </View>

          {/* Phases Overview */}
          <View style={styles.phasesSection}>
            <Text style={styles.sectionTitle}>Phases du projet</Text>

            {phases.slice(0, 3).map((phase, index) => {
              const getPhaseStatusColor = (status: string) => {
                switch (status) {
                  case 'completed':
                    return '#4CAF50';
                  case 'in-progress':
                    return '#E96C2E';
                  case 'pending':
                    return '#9CA3AF';
                  default:
                    return '#9CA3AF';
                }
              };

              return (
                <View key={phase.id} style={styles.phaseCard}>
                  <View style={styles.phaseHeader}>
                    <View
                      style={[
                        styles.phaseIcon,
                        { backgroundColor: getPhaseStatusColor(phase.status) + '20' }
                      ]}
                    >
                      <MaterialIcons
                        name={phase.status === 'completed' ? 'check-circle' :
                              phase.status === 'in-progress' ? 'schedule' : 'radio-button-unchecked'}
                        size={20}
                        color={getPhaseStatusColor(phase.status)}
                      />
                    </View>
                    <View style={styles.phaseInfo}>
                      <Text style={styles.phaseName}>{phase.name}</Text>
                      <Text style={styles.phaseProgress}>{phase.progress}%</Text>
                    </View>
                  </View>
                  <ProgressBar progress={phase.progress} height={4} />
                </View>
              );
            })}

            {phases.length > 3 && (
              <TouchableOpacity style={styles.viewAllPhases} onPress={handleViewChantier}>
                <Text style={styles.viewAllText}>Voir toutes les phases ({phases.length})</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#E96C2E" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
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
  backButton: {
    padding: 8,
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
  content: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  chantierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 30,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chantierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chantierInfo: {
    flex: 1,
  },
  chantierName: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  chantierAddress: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
  },
  progressSection: {
    marginBottom: 20,
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
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 13,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 2,
  },
  actionsSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2B2E83',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  phasesSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  phaseCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  phaseInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseName: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  phaseProgress: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_700Bold',
  },
  viewAllPhases: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
    marginRight: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
});