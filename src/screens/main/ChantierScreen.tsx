import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeTabParamList, RootStackParamList } from '../../types';
import ProgressBar from '../../components/ProgressBar';
import VideoPlayer from '../../components/VideoPlayer';
import { useClientChantier } from '../../hooks/useClientChantier';
import { ResizeMode, Video } from 'expo-av';
import type { KatosChantierPhase } from '../../types/firebase';
import { useUserNames } from '../../hooks/useUserNames';
import { optimizeCloudinaryUrl, getVideoThumbnailUrl, optimizeCloudinaryVideoUrl } from '../../utils/cloudinaryUtils';


type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Chantier'>,
  NativeStackScreenProps<RootStackParamList>
>;

const { width } = Dimensions.get('window');

export default function ChantierScreen({ navigation, route }: Props) {
  const chantierId = route?.params?.chantierId;
  const [showMediaCarousel, setShowMediaCarousel] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const {
    chantier,
    loading,
    error,
    hasChantier,
    name,
    address,
    globalProgress,
    status,
    mainImage,
    photos,
    phases
  } = useClientChantier(chantierId);

  // Collecter tous les IDs d'utilisateurs pour récupérer leurs noms
  const userIds = React.useMemo(() => {
    if (!phases) return [];

    const ids = new Set<string>();

    phases.forEach((phase: any) => {
      // Phase updatedBy
      if (phase.updatedBy) ids.add(phase.updatedBy);

      // Step updatedBy
      if (phase.steps) {
        phase.steps.forEach((step: any) => {
          if (step.updatedBy) ids.add(step.updatedBy);
        });
      }
    });

    return Array.from(ids);
  }, [phases]);

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

  // Fonction pour grouper les phases par catégorie
  const groupPhasesByCategory = (phases: any[]) => {
    const katosPhases = phases as KatosChantierPhase[];
    const grouped = katosPhases.reduce((acc, phase) => {
      const name = phase.name.toLowerCase();
      const category = (name.includes('clé') || name.includes('clef')) ? 'cloture' : (phase.category || 'main');
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(phase);
      return acc;
    }, {} as Record<string, KatosChantierPhase[]>);

    return grouped;
  };

  // Fonction pour obtenir les couleurs par catégorie
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'gros_oeuvre':
        return {
          primary: '#E96C2E', // Orange pour gros œuvre
          light: '#FFF3E0',
          text: '#E96C2E'
        };
      case 'second_oeuvre':
        return {
          primary: '#9C27B0', // Violet pour second œuvre
          light: '#F3E5F5',
          text: '#9C27B0'
        };
      case 'cloture':
        return {
          primary: '#4CAF50', // Vert pour la livraison
          light: '#E8F5E9',
          text: '#2E7D32'
        };
      default:
        return {
          primary: '#2B2E83', // Bleu pour phases principales
          light: '#E8EAF6',
          text: '#2B2E83'
        };
    }
  };

  // Fonction pour obtenir le nom de la catégorie
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'gros_oeuvre':
        return 'PHASES GROS ŒUVRE';
      case 'second_oeuvre':
        return 'PHASES SECOND ŒUVRE';
      case 'cloture':
        return 'LIVRAISON & CLÔTURE';
      default:
        return null; // Pas de header pour les phases principales
    }
  };

  // Fonction pour vérifier si c'est une phase de vérification
  const isVerificationPhase = (phaseName: string) => {
    return phaseName.toLowerCase().includes('vérification');
  };

  // Fonction pour formater les dates avec heure
  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return null;
    }
  };

  // Fonction pour formater les dates avec heure complète (pour correspondre au backoffice)
  const formatDateWithTime = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return null;
    }
  };

  // Fonction pour obtenir les dates réelles basées sur les mises à jour
  const getRealDates = (phase: any) => {
    const lastUpdate = formatDate(phase.lastUpdated);
    const lastUpdateWithTime = formatDateWithTime(phase.lastUpdated);

    // Si la phase a du progrès, elle a été commencée
    const hasStarted = phase.progress > 0;
    const isCompleted = phase.progress >= 100;
    const isInProgress = phase.progress > 0 && phase.progress < 100;

    return {
      startDate: hasStarted ? lastUpdate : null,
      endDate: isCompleted ? lastUpdate : null,
      lastUpdateDate: lastUpdate,
      lastUpdateDateWithTime: lastUpdateWithTime,
      updatedBy: phase.updatedBy || 'Système',
      status: phase.status,
      progress: phase.progress
    };
  };

  // Fonction pour obtenir les dates des sous-étapes
  const getStepRealDates = (step: any) => {
    const lastUpdate = formatDate(step.actualStartDate) || formatDate(step.actualEndDate);
    const lastUpdateWithTime = formatDateWithTime(step.actualStartDate) || formatDateWithTime(step.actualEndDate);

    const hasStarted = step.progress > 0;
    const isCompleted = step.progress >= 100;

    return {
      startDate: hasStarted ? (formatDate(step.actualStartDate) || lastUpdate) : null,
      endDate: isCompleted ? (formatDate(step.actualEndDate) || lastUpdate) : null,
      lastUpdateDate: lastUpdate,
      lastUpdateDateWithTime: lastUpdateWithTime,
      updatedBy: step.updatedBy || 'Système',
      estimatedDuration: step.estimatedDuration
    };
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
          {/* <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity> */}
          <Text style={styles.headerTitle}>Chantier</Text>
          {/* <View style={styles.headerRight} /> */}
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

            {/* Image principale du chantier */}
            {mainImage && (
              <TouchableOpacity
                style={styles.mainImageContainer}
                onPress={() => {
                  const index = photos.findIndex(p => p.id === mainImage.id);
                  if (index !== -1) openMediaCarousel(index);
                }}
                activeOpacity={0.8}
              >
                {(mainImage as any).type === 'video' ? (
                  <Video
                    source={{ uri: optimizeCloudinaryVideoUrl(mainImage.url) }}
                    style={styles.mainImage}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    positionMillis={100}
                    isMuted={true}
                    useNativeControls={false}
                  />
                ) : (
                  <Image
                    source={{ uri: optimizeCloudinaryUrl(mainImage.url, { width: 800 }) }}
                    style={styles.mainImage}
                    contentFit="cover"
                    transition={300}
                  />
                )}
                <View style={styles.mainImageOverlay}>
                  <MaterialIcons
                    name={(mainImage as any).type === 'video' ? 'play-circle-filled' : 'zoom-in'}
                    size={24}
                    color="#fff"
                    style={styles.mainImageZoomIcon}
                  />
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Avancement global</Text>
                <Text style={styles.progressValue}>{globalProgress}%</Text>
              </View>
              <ProgressBar progress={globalProgress} height={12} />
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phases du chantier</Text>

            {/* Affichage des phases groupées par catégorie */}
            {(() => {
              const groupedPhases = groupPhasesByCategory(phases.filter(phase => phase.name !== 'Électricité & Plomberie'));
              const categoryOrder = ['main', 'gros_oeuvre', 'second_oeuvre', 'cloture'];

              return categoryOrder.map(categoryKey => {
                const categoryPhases = groupedPhases[categoryKey];
                if (!categoryPhases || categoryPhases.length === 0) return null;

                const categoryColors = getCategoryColor(categoryKey);
                const categoryName = getCategoryName(categoryKey);

                return (
                  <View key={categoryKey} style={styles.categoryContainer}>
                    {/* Header de catégorie avec distinction visuelle */}
                    {categoryName && (
                      <View style={[
                        styles.categoryHeaderWithBorder,
                        categoryKey === 'gros_oeuvre' && styles.grosOeuvreHeader,
                        categoryKey === 'second_oeuvre' && styles.secondOeuvreHeader,
                        categoryKey === 'cloture' && styles.clotureHeader
                      ]}>
                        <View style={[
                          styles.categoryBorderLeft,
                          categoryKey === 'gros_oeuvre' && { backgroundColor: '#E96C2E' },
                          categoryKey === 'second_oeuvre' && { backgroundColor: '#9C27B0' },
                          categoryKey === 'cloture' && { backgroundColor: '#4CAF50' }
                        ]} />
                        <View style={styles.categoryHeaderContent}>
                          <Text style={[
                            styles.categoryTitleWithIcon,
                            categoryKey === 'gros_oeuvre' && { color: '#E96C2E' },
                            categoryKey === 'second_oeuvre' && { color: '#9C27B0' },
                            categoryKey === 'cloture' && { color: '#2E7D32' }
                          ]}>
                            {categoryKey === 'gros_oeuvre' && '🏗️ '}
                            {categoryKey === 'second_oeuvre' && '🔧 '}
                            {categoryKey === 'cloture' && '🔑 '}
                            {categoryName}
                          </Text>
                          <View style={[
                            styles.categoryUnderline,
                            categoryKey === 'gros_oeuvre' && { backgroundColor: '#E96C2E' },
                            categoryKey === 'second_oeuvre' && { backgroundColor: '#9C27B0' },
                            categoryKey === 'cloture' && { backgroundColor: '#4CAF50' }
                          ]} />
                        </View>
                      </View>
                    )}

                    {/* Timeline des phases de cette catégorie */}
                    <View style={styles.timeline}>
                      {categoryPhases.map((phase, phaseIndex) => {
                        const isVerification = isVerificationPhase(phase.name);
                        // Obtenir les vraies dates basées sur les mises à jour
                        const realDates = getRealDates(phase);

                        return (
                          <View key={phase.id} style={[
                            styles.timelineItem,
                            isVerification && styles.verificationPhaseItem
                          ]}>
                            <View style={styles.timelineLeft}>
                              <View
                                style={[
                                  styles.timelineIcon,
                                  { backgroundColor: getPhaseStatusColor(phase.status) },
                                  isVerification && styles.verificationIcon
                                ]}
                              >
                                <MaterialIcons
                                  name={isVerification ? 'fact-check' : getPhaseStatusIcon(phase.status)}
                                  size={16}
                                  color="#fff"
                                />
                              </View>
                              {phaseIndex < categoryPhases.length - 1 && (
                                <View style={[styles.timelineLine, { backgroundColor: categoryColors.primary }]} />
                              )}
                            </View>

                            <TouchableOpacity
                              style={styles.timelineContent}
                              onPress={() =>
                                navigation.navigate('PhaseDetail', {
                                  chantierId: chantier?.id || chantierId,
                                  phaseId: phase.id,
                                  phaseName: phase.name,
                                })
                              }
                              activeOpacity={0.7}
                            >
                              <View style={styles.phaseHeader}>
                                <Text style={[
                                  styles.phaseName,
                                  { color: categoryColors.text },
                                  isVerification && styles.verificationPhaseTitle
                                ]}>
                                  {phase.name}
                                </Text>
                                <View style={styles.phaseHeaderRight}>
                                  <Text style={[styles.phaseProgress, { color: categoryColors.text }]}>
                                    {phase.progress}%
                                  </Text>
                                  <MaterialIcons name="chevron-right" size={20} color="#999" />
                                </View>
                              </View>

                              <Text style={styles.phaseDescription}>{phase.description}</Text>

                              {/* Affichage des dates comme dans le backoffice */}
                              <View style={styles.datesContainer}>
                                <Text style={styles.dateTextUpdate}>
                                  {phase.lastUpdated
                                    ? `Dernière mise à jour: ${formatDateWithTime(phase.lastUpdated)} par ${getUserName(phase.updatedBy)}`
                                    : `Phase créée - Pas encore de mise à jour`
                                  }
                                </Text>
                              </View>

                              {/* Affichage des sous-étapes avec navigation */}
                              {phase.steps && phase.steps.length > 0 && (
                                <View style={styles.subStepsContainer}>
                                  <Text style={styles.subStepsTitle}>Étapes détaillées:</Text>
                                  {phase.steps.map((step, stepIndex) => (
                                    <View
                                      key={step.id}
                                      style={styles.subStepItem}
                                    >
                                      <View style={[
                                        styles.subStepIndicator,
                                        { backgroundColor: getPhaseStatusColor(step.status) }
                                      ]} />
                                      <View style={styles.subStepDetails}>
                                        <View style={styles.subStepHeader}>
                                          <Text style={styles.subStepText}>
                                            {step.name} ({step.progress}%)
                                          </Text>

                                        </View>
                                        {/* Affichage des dates des sous-étapes comme dans le backoffice */}
                                        {(step.actualStartDate || step.actualEndDate) && (
                                          <View style={styles.subStepDates}>
                                            <Text style={styles.subStepUpdateText}>
                                              Dernière mise à jour: {formatDateWithTime(step.actualEndDate || step.actualStartDate)} par {getUserName(step.updatedBy)}
                                            </Text>
                                          </View>
                                        )}
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              )}

                              <View style={styles.phaseProgressContainer}>
                                <ProgressBar
                                  progress={phase.progress}
                                  height={6}
                                  progressColor={categoryColors.primary}
                                />
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
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              });
            })()}
          </View>
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
              <TouchableOpacity onPress={() => setShowMediaCarousel(false)} style={styles.carouselCloseButton}>
                <MaterialIcons name="close" size={30} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.carouselTitle}>
                {selectedMediaIndex + 1} / {photos.length}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {photos.length > 0 && (
              <FlatList
                data={photos}
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
                removeClippedSubviews={true}
                maxToRenderPerBatch={2}
                windowSize={3}
                initialNumToRender={1}
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
                        source={{ uri: optimizeCloudinaryUrl(item.url, { width: 1200 }) }}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2B2E83',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 80,
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoDescription: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'FiraSans_400Regular',
    flex: 1,
  },
  zoomIcon: {
    marginLeft: 8,
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
  mainImageContainer: {
    position: 'relative',
    marginTop: 15,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainImage: {
    width: '100%',
    height: 200,
  },
  mainImageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  mainImageZoomIcon: {
    opacity: 0.9,
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
  phaseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  carouselDescription: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    color: 'white',
    fontSize: 14,
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 8,
  },
  // Nouveaux styles pour les catégories
  categoryContainer: {
    marginBottom: 24,
  },
  // Nouveaux styles pour headers avec distinction visuelle
  categoryHeaderWithBorder: {
    flexDirection: 'row',
    marginBottom: 20,
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grosOeuvreHeader: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#E96C2E',
  },
  secondOeuvreHeader: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  clotureHeader: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  categoryBorderLeft: {
    width: 6,
    backgroundColor: '#2B2E83',
    borderRadius: 3,
    marginRight: 16,
  },
  categoryHeaderContent: {
    flex: 1,
    alignItems: 'center',
  },
  categoryTitleWithIcon: {
    fontSize: 18,
    fontFamily: 'FiraSans_700Bold',
    color: '#2B2E83',
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryUnderline: {
    height: 3,
    width: 60,
    backgroundColor: '#2B2E83',
    borderRadius: 2,
  },
  // Styles pour les sous-étapes
  subStepsContainer: {
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
  },
  subStepsTitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 6,
  },
  subStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subStepIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  subStepText: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'FiraSans_400Regular',
  },
  subStepDetails: {
    flex: 1,
  },
  subStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subStepDates: {
    flexDirection: 'column',
    gap: 2,
    marginTop: 4,
  },
  subStepDateText: {
    fontSize: 10,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  subStepDateTextPlanned: {
    fontSize: 10,
    color: '#888',
    fontFamily: 'FiraSans_400Regular',
    fontStyle: 'italic',
  },
  subStepDurationText: {
    fontSize: 10,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
  },
  // Styles pour les phases de vérification
  verificationPhaseItem: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    paddingLeft: 8,
  },
  verificationIcon: {
    backgroundColor: '#FFC107',
  },
  verificationPhaseTitle: {
    fontStyle: 'italic',
  },
  // Styles pour les dates
  datesContainer: {
    marginVertical: 8,
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  dateTextPlanned: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'FiraSans_400Regular',
    fontStyle: 'italic',
  },
  dateTextDuration: {
    fontSize: 12,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
  },
  dateTextUpdate: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
    fontStyle: 'italic',
  },
  subStepUpdateText: {
    fontSize: 9,
    color: '#666',
    fontFamily: 'FiraSans_400Regular',
    fontStyle: 'italic',
  },
  debugText: {
    fontSize: 10,
    color: '#ff0000',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 4,
  },
});