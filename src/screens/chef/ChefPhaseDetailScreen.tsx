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
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { Video, ResizeMode } from 'expo-av';
import { ChefStackParamList } from '../../types';
import VideoPlayer from '../../components/VideoPlayer';
import PhaseFeedbackSection from '../../components/PhaseFeedbackSection';
import { useAuth } from '../../contexts/AuthContext';
import { chantierService } from '../../services/chantierService';
import { storageService } from '../../services/storageService';
import { useUserNames } from '../../hooks/useUserNames';
import { FirebaseChantier, getPhaseStatus } from '../../types/firebase';

type Props = NativeStackScreenProps<ChefStackParamList, 'ChefPhaseDetail'>;

const { width } = Dimensions.get('window');

export default function ChefPhaseDetailScreen({ navigation, route }: Props) {
  const { chantierId, phaseId, phaseName, stepId, stepName } = route.params;
  const { user } = useAuth();
  const [chantier, setChantier] = useState<FirebaseChantier | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showMediaCarousel, setShowMediaCarousel] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);

  // Trouver la phase spécifique
  const currentPhase = chantier?.phases?.find(phase => phase.id === phaseId);
  const currentStep = stepId && currentPhase?.steps?.find(step => step.id === stepId);

  // Récupérer les photos spécifiques à la phase/étape
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
      if (currentPhase?.steps && currentPhase.steps.length > 0) {
        return [];
      }

      // Sinon, on affiche les photos de la phase qui n'ont pas de stepId
      filteredPhotos = chantier.gallery.filter(photo => photo.phaseId === phaseId && !photo.stepId);
    }

    const allPhotos = filteredPhotos
      .map(photo => ({
        id: photo.id,
        url: photo.url,
        description: photo.description || `Photo ${stepName || phaseName}`,
        uploadedAt: photo.uploadedAt,
        type: photo.type,
        thumbnailUrl: photo.thumbnailUrl
      }))
      .sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis());

    return allPhotos;
  }, [chantier, phaseId, phaseName, currentPhase, stepId, stepName]);

  // Collecter les IDs d'utilisateurs pour les noms
  const userIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (currentPhase?.updatedBy) ids.add(currentPhase.updatedBy);
    if (currentStep?.updatedBy) ids.add(currentStep.updatedBy);
    return Array.from(ids);
  }, [currentPhase, currentStep]);

  const { getUserName } = useUserNames(userIds);

  useEffect(() => {
    if (chantierId) {
      loadChantier();
    }
  }, [chantierId]);

  useEffect(() => {
    // Initialiser la valeur du slider
    if (currentStep) {
      setSliderValue(currentStep.progress);
    } else if (currentPhase) {
      setSliderValue(currentPhase.progress);
    }
  }, [currentStep, currentPhase]);

  const loadChantier = async () => {
    try {
      console.log('🔄 Initialisation listener pour chantier:', chantierId);
      const unsubscribe = chantierService.subscribeToChantier(chantierId, (chantierData) => {
        console.log('📡 Mise à jour chantier reçue:', {
          chantierId,
          hasChantier: !!chantierData,
          galleryCount: chantierData?.gallery?.length || 0,
          phasesCount: chantierData?.phases?.length || 0
        });
        setChantier(chantierData);
        setLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Erreur lors du chargement du chantier:', error);
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour ajouter des images");
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    };

    try {
      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadMedia(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const handleCameraPicker = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "L'accès à l'appareil photo est nécessaire");
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    };

    try {
      const result = await ImagePicker.launchCameraAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadMedia(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      Alert.alert('Erreur', 'Impossible de capturer l\'image');
    }
  };

  const uploadMedia = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user || !chantier) return;

    setUploadingImage(true);

    try {
      const isVideo = asset.type === 'video';

      console.log('📤 Début upload:', {
        chantierId,
        phaseId,
        phaseName,
        stepId,
        stepName,
        assetType: asset.type,
        assetUri: asset.uri
      });

      const uploadedUrl = await storageService.uploadMediaFromUri(
        asset.uri,
        `chantiers/${chantierId}`,
        isVideo ? 'video' : 'image'
      );


      let thumbnailUrl: string | undefined;
      if (isVideo && asset.uri) {
        // Pour les vidéos, on pourrait générer une miniature ici
        thumbnailUrl = uploadedUrl; // Temporairement, utiliser la même URL
      }

      const description = `${stepName || phaseName} - ${new Date().toLocaleDateString('fr-FR')}`;

      console.log('📝 Ajout à la phase:', {
        chantierId,
        phaseId,
        phaseIdType: typeof phaseId,
        phaseIdLength: phaseId?.length,
        uploadedUrl,
        description,
        userId: user.uid,
        mediaType: isVideo ? 'video' : 'image'
      });

      await chantierService.addPhasePhoto(
        chantierId,
        phaseId, // Phase spécifique
        uploadedUrl,
        description,
        user.uid,
        isVideo ? 'video' : 'image',
        isVideo ? asset.duration : undefined,
        thumbnailUrl,
        stepId
      );

      console.log('✅ Photo ajoutée à la phase avec succès');
      Alert.alert('Succès', `${isVideo ? 'Vidéo' : 'Image'} ajoutée avec succès !`);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      Alert.alert('Erreur', `Impossible d'ajouter ${asset.type === 'video' ? 'la vidéo' : 'l\'image'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const showMediaOptions = () => {
    Alert.alert(
      'Ajouter un média',
      'Choisissez une option',
      [
        { text: 'Appareil photo', onPress: handleCameraPicker },
        { text: 'Galerie', onPress: handleImagePicker },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  const openMediaCarousel = (index: number) => {
    setSelectedMediaIndex(index);
    setShowMediaCarousel(true);
  };

  const updateProgress = async (newValue: number) => {
    if (!chantier || !user) return;

    try {
      if (stepId) {
        // Mise à jour d'une sous-étape
        await chantierService.updateStepProgress(
          chantierId,
          phaseId,
          stepId,
          newValue,
          user.uid
        );
      } else {
        // Mise à jour d'une phase
        await chantierService.updatePhaseProgress(
          chantierId,
          phaseId,
          newValue,
          undefined,
          user.uid
        );
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la progression');
    }
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

  if (!currentPhase) {
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
  const currentStatus = getPhaseStatus(sliderValue);

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
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Info de l'étape avec contrôle de progression */}
          <View style={styles.phaseInfo}>
            <View style={styles.phaseHeader}>
              <View style={styles.phaseStatus}>
                <View
                  style={[
                    styles.statusIcon,
                    { backgroundColor: getPhaseStatusColor(currentStatus) }
                  ]}
                >
                  <MaterialIcons
                    name={getPhaseStatusIcon(currentStatus)}
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusText}>
                    {getStatusText(currentStatus)}
                  </Text>
                  <Text style={styles.progressText}>
                    {Math.round(sliderValue)}% complété
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.phaseDescription}>
              {displayItem.description}
            </Text>

            {/* Contrôle de progression */}
            <View style={styles.progressControl}>
              <Text style={styles.progressLabel}>Progression :</Text>
              <Slider
                style={styles.progressSlider}
                minimumValue={0}
                maximumValue={100}
                value={sliderValue}
                onValueChange={(value) => setSliderValue(value)}
                onSlidingComplete={(value) => updateProgress(Math.round(value))}
                step={1}
                minimumTrackTintColor="#E96C2E"
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor="#2B2E83"
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
                      navigation.navigate('ChefPhaseDetail', {
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
                        { backgroundColor: getPhaseStatusColor(getPhaseStatus(step.progress)) }
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

          {/* Section d'ajout de photos - Visible seulement si ce n'est pas une phase parente */}
          {(!(!stepId && currentPhase?.steps && currentPhase.steps.length > 0)) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Photos de l'étape ({phasePhotos.length})
                </Text>
                <View style={styles.buttonGroup}>

                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={showMediaOptions}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="add-a-photo" size={20} color="#FFFFFF" />
                        <Text style={styles.addPhotoButtonText}>Ajouter</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

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
                  <Text style={styles.emptyGalleryText}>Aucune photo ajoutée</Text>
                  <Text style={styles.emptyGallerySubtext}>
                    Ajoutez des photos pour documenter cette étape
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
                  currentUserId={user?.uid}
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
    paddingBottom: 50,
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
  statusInfo: {
    flex: 1,
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
  progressControl: {
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 10,
  },
  progressSlider: {
    width: '100%',
    height: 40,
    marginBottom: 10,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
    paddingBottom: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E96C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#E96C2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addPhotoButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 4,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryItem: {
    width: (width - 60) / 2,
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