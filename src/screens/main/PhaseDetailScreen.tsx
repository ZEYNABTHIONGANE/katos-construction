import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import ProgressBar from '../../components/ProgressBar';
import VideoPlayer from '../../components/VideoPlayer';
import PhaseFeedbackSection from '../../components/PhaseFeedbackSection';
import { useClientChantier } from '../../hooks/useClientChantier';
import { useUserNames } from '../../hooks/useUserNames';
import { ResizeMode, Video } from 'expo-av';

type Props = NativeStackScreenProps<RootStackParamList, 'PhaseDetail'>;

const { width } = Dimensions.get('window');

export default function PhaseDetailScreen({ navigation, route }: Props) {
  const { chantierId, phaseId, phaseName, stepId, stepName } = route.params;
  const [showMediaCarousel, setShowMediaCarousel] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const { chantier, loading, error } = useClientChantier(chantierId);

  // Trouver la phase spécifique
  const currentPhase = chantier?.phases?.find(phase => phase.id === phaseId);
  const currentStep = stepId && currentPhase?.steps?.find(step => step.id === stepId);

  // Récupérer les photos spécifiques à la phase ou l'étape
  const phasePhotos = React.useMemo(() => {
    if (!chantier) return [];

    let filteredPhotos = [];

    // Si on est sur une sous-étape, on filtre par stepId
    if (stepId) {
      filteredPhotos = chantier.gallery.filter(photo => photo.stepId === stepId);
    }
    // Si on est sur une phase principale
    else {
      // Si la phase a des sous-étapes, on n'affiche PAS de photos (elles doivent être associées aux sous-étapes)
      // "enleve les image de fondations les images doivent etre associes aux etapes si et seulement l'etape est une etape mere"
      if (currentPhase?.steps && currentPhase.steps.length > 0) {
        return [];
      }

      // Sinon, on affiche les photos de la phase qui n'ont pas de stepId
      filteredPhotos = chantier.gallery.filter(photo => photo.phaseId === phaseId && !photo.stepId);
    }

    return filteredPhotos
      .map(photo => ({
        id: photo.id,
        url: photo.url,
        description: photo.description || `Photo ${stepName || phaseName}`,
        uploadedAt: photo.uploadedAt,
        type: photo.type,
        thumbnailUrl: photo.thumbnailUrl
      }))
      .sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis());
  }, [chantier, phaseId, phaseName, stepId, stepName, currentPhase]);

  // Collecter les IDs d'utilisateurs pour les noms
  const userIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (currentPhase?.updatedBy) ids.add(currentPhase.updatedBy);
    if (currentStep?.updatedBy) ids.add(currentStep.updatedBy);
    return Array.from(ids);
  }, [currentPhase, currentStep]);

  const { getUserName } = useUserNames(userIds);

  const openMediaCarousel = (index: number) => {
    setSelectedMediaIndex(index);
    setShowMediaCarousel(true);
  };

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

  const formatDateWithTime = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2B2E83" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error || !currentPhase) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <MaterialIcons name="error" size={48} color="#E96C2E" />
        <Text style={styles.errorText}>Étape non trouvée</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayTitle = stepName || phaseName;
  const displayItem = currentStep || currentPhase;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {displayTitle}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info de l'étape */}
          <View style={styles.phaseInfo}>
            <View style={styles.phaseHeader}>
              <View style={styles.phaseStatus}>
                <View
                  style={[
                    styles.statusIcon,
                    { backgroundColor: getPhaseStatusColor(displayItem.status) }
                  ]}
                >
                  <MaterialIcons
                    name={getPhaseStatusIcon(displayItem.status)}
                    size={20}
                    color="#fff"
                  />
                </View>
                <View>
                  <Text style={styles.statusText}>
                    {getStatusText(displayItem.status)}
                  </Text>
                  <Text style={styles.progressText}>
                    {displayItem.progress}% complété
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.phaseDescription}>
              {displayItem.description}
            </Text>

            {/* Barre de progression */}
            <View style={styles.progressSection}>
              <ProgressBar
                progress={displayItem.progress}
                height={12}
                progressColor="#2B2E83"
              />
            </View>

            {/* Informations de mise à jour */}
            {((displayItem as any).lastUpdated || (displayItem as any).actualEndDate || (displayItem as any).actualStartDate) && (
              <View style={styles.updateInfo}>
                <Text style={styles.updateText}>
                  Dernière mise à jour: {formatDateWithTime((displayItem as any).lastUpdated || (displayItem as any).actualEndDate || (displayItem as any).actualStartDate)}
                </Text>
                {displayItem.updatedBy && (
                  <Text style={styles.updateByText}>
                    par {getUserName(displayItem.updatedBy) || 'Système'}
                  </Text>
                )}
              </View>
            )}

            {/* Sous-étapes si c'est une phase principale */}
            {!stepId && currentPhase.steps && currentPhase.steps.length > 0 && (
              <View style={styles.subStepsSection}>
                <Text style={styles.subStepsTitle}>Sous-étapes:</Text>
                {currentPhase.steps.map((step, index) => (
                  <TouchableOpacity
                    key={step.id}
                    style={styles.subStepItem}
                    onPress={() =>
                      navigation.navigate('PhaseDetail', {
                        chantierId,
                        phaseId,
                        phaseName,
                        stepId: step.id,
                        stepName: step.name
                      })
                    }
                  >
                    <View
                      style={[
                        styles.subStepIndicator,
                        { backgroundColor: getPhaseStatusColor(step.status) }
                      ]}
                    />
                    <View style={styles.subStepContent}>
                      <Text style={styles.subStepName}>{step.name}</Text>
                      <Text style={styles.subStepProgress}>{step.progress}%</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Photos de l'étape - Visible seulement si ce n'est pas une phase parente */}
          {(!(!stepId && currentPhase?.steps && currentPhase.steps.length > 0)) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Photos de l'étape ({phasePhotos.length})
              </Text>
              {phasePhotos.length > 0 ? (
                <View style={styles.galleryGrid}>
                  {phasePhotos.map((photo, index) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={styles.galleryItem}
                      onPress={() => openMediaCarousel(index)}
                      activeOpacity={0.8}
                    >
                      {photo.type === 'video' ? (
                        <View style={styles.galleryImage}>
                          <Video
                            source={{ uri: photo.thumbnailUrl || photo.url }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                            isLooping={false}
                            useNativeControls={false}
                          />
                          <View style={styles.playIconOverlay}>
                            <MaterialIcons
                              name="play-circle-filled"
                              size={30}
                              color="rgba(255,255,255,0.8)"
                            />
                          </View>
                        </View>
                      ) : (
                        <Image
                          source={{ uri: photo.thumbnailUrl || photo.url }}
                          style={styles.galleryImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.photoOverlay}>
                        <MaterialIcons
                          name={photo.type === 'video' ? 'play-circle-filled' : 'zoom-in'}
                          size={16}
                          color="#fff"
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyGallery}>
                  <MaterialIcons name="photo-library" size={32} color="#E0E0E0" />
                  <Text style={styles.emptyGalleryText}>Aucune photo disponible</Text>
                  <Text style={styles.emptyGallerySubtext}>
                    Les photos de cette étape apparaîtront ici
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Section de feedback - Visible seulement si ce n'est pas une phase parente */}
          {(!(!stepId && currentPhase?.steps && currentPhase.steps.length > 0)) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Messages et notes vocales</Text>
              <View style={styles.feedbackContainer}>
                <PhaseFeedbackSection
                  chantierId={chantierId}
                  phaseId={phaseId}
                  stepId={stepId}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Media Carousel Modal */}
        <Modal
          visible={showMediaCarousel}
          animationType="fade"
          presentationStyle="fullScreen"
          statusBarTranslucent
          onRequestClose={() => setShowMediaCarousel(false)}
        >
          <View style={styles.carouselContainer}>
            <View style={styles.carouselHeader}>
              <TouchableOpacity
                onPress={() => setShowMediaCarousel(false)}
                style={styles.carouselCloseButton}
              >
                <MaterialIcons name="close" size={30} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.carouselTitle}>
                {selectedMediaIndex + 1} / {phasePhotos.length}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {phasePhotos.length > 0 && (
              <FlatList
                data={phasePhotos}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={selectedMediaIndex}
                getItemLayout={(data, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / width);
                  setSelectedMediaIndex(index);
                }}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <View style={styles.carouselItemContainer}>
                    {item.type === 'video' ? (
                      <VideoPlayer
                        source={{ uri: item.url }}
                        style={styles.carouselVideo}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={index === selectedMediaIndex}
                        useNativeControls={true}
                        showCustomControls={false}
                      />
                    ) : (
                      <Image
                        source={{ uri: item.url }}
                        style={styles.carouselImage}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                )}
              />
            )}
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
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'FiraSans_700Bold',
    paddingHorizontal: 10,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingBottom: 150, // Espace pour éviter que l'input soit collé au bas
  },
  phaseInfo: {
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
  phaseHeader: {
    marginBottom: 15,
  },
  phaseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
  },
  phaseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontFamily: 'FiraSans_400Regular',
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 15,
  },
  updateInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  updateText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
    fontStyle: 'italic',
  },
  updateByText: {
    fontSize: 12,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 2,
  },
  subStepsSection: {
    marginTop: 10,
  },
  subStepsTitle: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 10,
  },
  subStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  subStepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  subStepContent: {
    flex: 1,
  },
  subStepName: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'FiraSans_500Medium',
  },
  subStepProgress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 2,
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
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryItem: {
    width: (width - 60) / 2, // 2 colonnes avec espacement
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F5F5F5',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 6,
    alignItems: 'flex-end',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  emptyGallery: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 0,
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
  feedbackContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  backButton: {
    marginTop: 20,
    backgroundColor: '#2B2E83',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'FiraSans_600SemiBold',
  },
  carouselContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  carouselHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  carouselCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  carouselTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'FiraSans_600SemiBold',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  carouselItemContainer: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: width,
    height: Dimensions.get('window').height * 0.8,
  },
  carouselVideo: {
    width: width,
    height: Dimensions.get('window').height * 0.8,
  },
});