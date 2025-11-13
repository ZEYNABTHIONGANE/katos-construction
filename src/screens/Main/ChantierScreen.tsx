import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../types';
import ProgressBar from '../../components/ProgressBar';
import { useClientChantier } from '../../hooks/useClientChantier';

type Props = BottomTabScreenProps<HomeTabParamList, 'Chantier'>;

const { width } = Dimensions.get('window');

export default function ChantierScreen({ navigation, route }: Props) {
  const chantierId = route?.params?.chantierId;
  const {
    chantier,
    loading,
    error,
    hasChantier,
    name,
    address,
    globalProgress,
    status,
    photos,
    phases,
    recentUpdates
  } = useClientChantier(chantierId);

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in-progress':
        return '#E96C2E';
      case 'pending':
        return '#6c757d';
      case 'blocked':
        return '#F44336';
      default:
        return '#6c757d';
    }
  };

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'in-progress':
        return 'schedule';
      case 'pending':
        return 'radio-button-unchecked';
      case 'blocked':
        return 'block';
      default:
        return 'radio-button-unchecked';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in-progress':
        return 'En cours';
      case 'pending':
        return 'En attente';
      case 'blocked':
        return 'Bloqué';
      default:
        return 'En attente';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2B2E83" />
        <Text style={styles.loadingText}>Chargement du chantier...</Text>
      </View>
    );
  }

  if (error || !hasChantier) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <MaterialIcons name="home-work" size={48} color="#E96C2E" />
        <Text style={styles.errorText}>Aucun chantier disponible</Text>
        <Text style={styles.errorSubtext}>
          {error || 'Votre chantier apparaîtra ici une fois créé par l\'administration'}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        {/* Header moderne */}
        <View style={styles.header}>
          <TouchableOpacity
             style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chantier</Text>
          <View style={styles.headerRight} />
        </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Project Info */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{name}</Text>
          <Text style={styles.projectAddress}>{address}</Text>

          <View style={[styles.statusBadge, {
            backgroundColor: status === 'En cours' ? '#4CAF50' :
                           status === 'Terminé' ? '#2196F3' :
                           status === 'En retard' ? '#F44336' : '#E0B043',
            alignSelf: 'flex-start',
            marginBottom: 15
          }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Avancement global</Text>
              <Text style={styles.progressValue}>{globalProgress}%</Text>
            </View>
            <ProgressBar progress={globalProgress} height={12} />
          </View>
        </View>

        {/* Photo Gallery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos du chantier ({photos.length})</Text>
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryContainer}
            >
              {photos.map((photo, index) => (
                <TouchableOpacity key={photo.id} style={styles.galleryItem}>
                  <Image source={{ uri: photo.url }} style={styles.galleryImage} />
                  <View style={styles.photoOverlay}>
                    <Text style={styles.photoDescription} numberOfLines={2}>
                      {photo.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyGallery}>
              <MaterialIcons name="photo-library" size={32} color="#E0E0E0" />
              <Text style={styles.emptyGalleryText}>Aucune photo disponible</Text>
              <Text style={styles.emptyGallerySubtext}>Les photos du chantier apparaîtront ici</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phases du chantier</Text>
          <View style={styles.timeline}>
            {phases.map((phase, index) => (
              <View key={phase.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: getPhaseStatusColor(phase.status) },
                    ]}
                  >
                    <MaterialIcons
                      name={getPhaseStatusIcon(phase.status)}
                      size={16}
                      color="#fff"
                    />
                  </View>
                  {index < phases.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.phaseHeader}>
                    <Text style={styles.phaseName}>{phase.name}</Text>
                    <Text style={styles.phaseProgress}>{phase.progress}%</Text>
                  </View>

                  <Text style={styles.phaseDescription}>{phase.description}</Text>

                  {phase.startDate && (
                    <Text style={styles.phaseDate}>
                      Début: {phase.startDate}
                      {phase.endDate && ` • Fin: ${phase.endDate}`}
                    </Text>
                  )}

                  <View style={styles.phaseProgressContainer}>
                    <ProgressBar progress={phase.progress} height={6} />
                  </View>

                  <View style={styles.phaseStatus}>
                    <Text
                      style={[
                        styles.phaseStatusText,
                        { color: getPhaseStatusColor(phase.status) },
                      ]}
                    >
                      {getStatusText(phase.status)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mises à jour récentes</Text>
          {recentUpdates.length > 0 ? (
            recentUpdates.map((update) => (
              <View key={update.id} style={styles.updateCard}>
                <View style={styles.updateHeader}>
                  <MaterialIcons
                    name={update.status === 'completed' ? 'check-circle' : 'schedule'}
                    size={20}
                    color={update.status === 'completed' ? '#4CAF50' : '#E96C2E'}
                  />
                  <Text style={styles.updateDate}>{update.date}</Text>
                </View>
                <Text style={styles.updateTitle}>{update.title}</Text>
                <Text style={styles.updateDescription}>{update.description}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyUpdates}>
              <MaterialIcons name="update" size={32} color="#E0E0E0" />
              <Text style={styles.emptyUpdatesText}>Aucune mise à jour</Text>
              <Text style={styles.emptyUpdatesSubtext}>Les mises à jour apparaîtront ici</Text>
            </View>
          )}
        </View>

        {/* Contact Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <MaterialIcons name="chat" size={24} color="#fff" />
            <Text style={styles.contactButtonText}>Contacter le chef de chantier</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  projectInfo: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 40,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectName: {
    fontSize: 20,
    color: '#1A1A1A',
    marginBottom: 5,
    fontFamily: 'FiraSans_700Bold',
  },
  projectAddress: {
    fontSize: 14,
    color: '#E96C2E',
    marginBottom: 20,
    fontFamily: 'FiraSans_400Regular',
  },
  progressSection: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'FiraSans_400Regular',
  },
  progressValue: {
    fontSize: 18,
    color: '#E96C2E',
    fontFamily: 'FiraSans_700Bold',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2B2E83',
    marginBottom: 15,
    fontFamily: 'FiraSans_700Bold',
  },
  galleryContainer: {
    paddingRight: 20,
  },
  galleryItem: {
    marginRight: 15,
  },
  galleryImage: {
    width: width * 0.6,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  timeline: {
    paddingLeft: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 15,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phaseName: {
    fontSize: 16,
    color: '#2B2E83',
    marginBottom: 5,
    fontFamily: 'FiraSans_700Bold',
  },
  phaseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'FiraSans_400Regular',
  },
  phaseDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontFamily: 'FiraSans_400Regular',
  },
  phaseStatus: {
    alignSelf: 'flex-start',
  },
  phaseStatusText: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontFamily: 'FiraSans_600SemiBold',
  },
  updateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  updateDate: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
  },
  updateTitle: {
    fontSize: 16,
    color: '#2B2E83',
    marginBottom: 5,
    fontFamily: 'FiraSans_700Bold',
  },
  updateDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: 'FiraSans_400Regular',
  },
  updateImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  contactButton: {
    backgroundColor: '#E96C2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  contactButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
    fontFamily: 'FiraSans_700Bold',
  },
  scrollContent: {
    paddingBottom: 130, // Espace pour la navigation flottante
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
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

  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'FiraSans_600SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'FiraSans_600SemiBold',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  photoDescription: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'FiraSans_400Regular',
  },
  emptyGallery: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  emptyGalleryText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontFamily: 'FiraSans_600SemiBold',
  },
  emptyGallerySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  phaseProgress: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
  },
  phaseProgressContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  emptyUpdates: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  emptyUpdatesText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontFamily: 'FiraSans_600SemiBold',
  },
  emptyUpdatesSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
});