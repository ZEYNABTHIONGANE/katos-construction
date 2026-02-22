import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useClientChantier } from '../../hooks/useClientChantier';
import { useClientDocuments } from '../../hooks/useDocuments';
import { useAuth } from '../../hooks/useAuth';
import ProgressBar from '../../components/ProgressBar';
import DocumentUploadModal from '../../components/DocumentUploadModal';
import VideoPlayer from '../../components/VideoPlayer';
import { optimizeCloudinaryUrl, optimizeCloudinaryVideoUrl } from '../../utils/cloudinaryUtils';
import type { DocumentCategory, DocumentVisibility } from '../../types/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientProjects'>;

export default function ClientChantierDocumentsScreen({ navigation }: Props) {
  const {
    chantier,
    loading: chantierLoading,
    error: chantierError,
    hasChantier,
    name,
    address,
    globalProgress,
    status,
    photos,
    startDate,
    plannedEndDate
  } = useClientChantier();

  const { userData } = useAuth();

  // Get documents using the new hook
  const {
    documents,
    loading: documentsLoading,
    uploading,
    error: documentsError,
    uploadDocument,
    deleteDocument,
    formatFileSize,
    getDocumentIcon,
    totalDocuments,
    clearError
  } = useClientDocuments(chantier?.id || '');

  const { width } = Dimensions.get('window');

  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(-1);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photos' | 'videos'>('all');

  const openMediaViewer = (mediaUrl: string, mediaType: 'image' | 'video') => {
    // Find index in filtered list
    const mediaList = getFilteredMedia();
    const index = mediaList.findIndex(m => m.url === mediaUrl);

    if (index >= 0) {
      setSelectedMediaIndex(index);
      setShowMediaModal(true);
    }
  };

  // Memoized media filtering
  const filteredMedia = useMemo(() => {
    const photosList = photos.filter(photo => photo.type !== 'video' || !photo.type);
    const videosList = photos.filter(photo => photo.type === 'video');

    return {
      photos: photosList,
      videos: videosList,
    };
  }, [photos]);

  const getFilteredMedia = () => {
    switch (mediaFilter) {
      case 'photos':
        return filteredMedia.photos;
      case 'videos':
        return filteredMedia.videos;
      default:
        return photos;
    }
  };

  const handleUploadDocument = async (
    file: { uri: string; name: string; size: number; mimeType?: string },
    category: DocumentCategory,
    title: string,
    description?: string,
    visibility: DocumentVisibility = 'both'
  ): Promise<boolean> => {
    if (!userData || !chantier?.id) {
      Alert.alert('Erreur', 'Impossible d\'identifier l\'utilisateur ou le chantier');
      return false;
    }

    try {
      const uploadedDoc = await uploadDocument(
        file,
        category,
        userData.uid,
        {
          description: description || `${title} - Uploadé par le client`,
          visibility
        }
      );

      return !!uploadedDoc;
    } catch (error) {
      console.error('Error uploading document:', error);
      return false;
    }
  };

  const removeDocument = (documentId: string) => {
    if (!userData) return;

    Alert.alert(
      'Supprimer le document',
      'Êtes-vous sûr de vouloir supprimer ce document ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteDocument(documentId, userData.uid);
            if (success) {
              Alert.alert('Succès', 'Document supprimé');
            }
          }
        }
      ]
    );
  };

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

  const renderDocument = ({ item }: { item: any }) => {
    const iconName = getDocumentIcon(item.mimeType);
    const formattedSize = formatFileSize(item.size);
    const uploadDate = item.uploadedAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue';

    return (
      <View style={styles.documentItem}>
        <View style={styles.documentIcon}>
          <MaterialIcons
            name={iconName as any}
            size={24}
            color="#E96C2E"
          />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName}>{item.originalName}</Text>
          <Text style={styles.documentDetails}>
            {item.category} • {formattedSize} • {uploadDate}
          </Text>
          {item.description && (
            <Text style={styles.documentDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteDocumentButton}
          onPress={() => removeDocument(item.id)}
        >
          <MaterialIcons name="delete" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    );
  };

  // Show loading state
  if (chantierLoading || documentsLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2B2E83" />
        <Text style={styles.loadingText}>
          {chantierLoading ? 'Chargement du chantier...' : 'Chargement des documents...'}
        </Text>
      </View>
    );
  }

  // Show error state
  if (chantierError || !hasChantier) {
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
            <MaterialIcons name="home-work" size={48} color="#E96C2E" />
            <Text style={styles.errorText}>Aucun chantier disponible</Text>
            <Text style={styles.errorSubtext}>
              {chantierError || 'Votre chantier apparaîtra ici une fois créé par l\'administration'}
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
          {/* Chantier Info Card */}
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

            <View style={styles.datesSection}>
              <Text style={styles.dateText}>Début: {startDate}</Text>
              <Text style={styles.dateText}>Fin prévue: {plannedEndDate}</Text>
            </View>
          </View>

          {/* Supports Gallery with Photos and Videos separation */}
          {photos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Supports du chantier ({photos.length})</Text>

              {/* Filter buttons for Photos and Videos */}
              <View style={styles.mediaFilterContainer}>
                <TouchableOpacity
                  style={[
                    styles.mediaFilterButton,
                    mediaFilter === 'all' && styles.mediaFilterButtonActive
                  ]}
                  onPress={() => setMediaFilter('all')}
                >
                  <MaterialIcons name="collections" size={16} color={mediaFilter === 'all' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[
                    styles.mediaFilterText,
                    mediaFilter === 'all' && styles.mediaFilterTextActive
                  ]}>
                    Tout ({photos.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mediaFilterButton,
                    mediaFilter === 'photos' && styles.mediaFilterButtonActive
                  ]}
                  onPress={() => setMediaFilter('photos')}
                >
                  <MaterialIcons name="photo" size={16} color={mediaFilter === 'photos' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[
                    styles.mediaFilterText,
                    mediaFilter === 'photos' && styles.mediaFilterTextActive
                  ]}>
                    Photos ({filteredMedia.photos.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mediaFilterButton,
                    mediaFilter === 'videos' && styles.mediaFilterButtonActive
                  ]}
                  onPress={() => setMediaFilter('videos')}
                >
                  <MaterialIcons name="videocam" size={16} color={mediaFilter === 'videos' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[
                    styles.mediaFilterText,
                    mediaFilter === 'videos' && styles.mediaFilterTextActive
                  ]}>
                    Vidéos ({filteredMedia.videos.length})
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosContainer}
              >
                {getFilteredMedia().map((media) => (
                  <TouchableOpacity
                    key={media.id}
                    style={styles.photoItem}
                    onPress={() => openMediaViewer(media.url, media.type)}
                  >
                    {media.type === 'video' ? (
                      <View style={styles.videoContainer}>
                        <Video
                          source={{ uri: optimizeCloudinaryVideoUrl(media.url) }}
                          style={styles.photoImage}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          positionMillis={100}
                          isMuted={true}
                          useNativeControls={false}
                        />
                        <View style={styles.videoOverlay}>
                          <MaterialIcons name="play-circle-filled" size={32} color="rgba(255,255,255,0.9)" />
                          {(media as any).duration && (
                            <Text style={styles.videoDuration}>
                              {Math.floor((media as any).duration / 60)}:{String(Math.floor((media as any).duration % 60)).padStart(2, '0')}
                            </Text>
                          )}
                        </View>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: optimizeCloudinaryUrl(media.url, { width: 300 }) }}
                        style={styles.photoImage}
                        contentFit="cover"
                        transition={200}
                      />
                    )}
                    <View style={styles.photoOverlay}>
                      <Text style={styles.photoDescription} numberOfLines={2}>
                        {media.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Error message for documents */}
          {documentsError && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error" size={20} color="#F44336" />
              <Text style={styles.errorBannerText}>{documentsError}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorBannerClose}>
                <MaterialIcons name="close" size={16} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}

          {/* Documents Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Documents ({totalDocuments})</Text>
              <TouchableOpacity
                style={[styles.addDocumentButton, uploading && styles.addDocumentButtonDisabled]}
                onPress={() => setShowUploadModal(true)}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size={16} color="#FFFFFF" />
                ) : (
                  <MaterialIcons name="add" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.addDocumentButtonText}>
                  {uploading ? 'Upload...' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>

            {documents.length > 0 ? (
              <FlatList
                data={documents}
                renderItem={renderDocument}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyDocuments}>
                <MaterialIcons name="description" size={48} color="#E0E0E0" />
                <Text style={styles.emptyDocumentsText}>Aucun document</Text>
                <Text style={styles.emptyDocumentsSubtext}>Ajoutez des documents pour votre chantier</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Media Carousel Modal */}
        <Modal
          visible={showMediaModal}
          animationType="fade"
          presentationStyle="fullScreen"
          statusBarTranslucent
          onRequestClose={() => setShowMediaModal(false)}
        >
          <View style={styles.carouselContainer}>
            <View style={styles.carouselHeader}>
              <TouchableOpacity onPress={() => setShowMediaModal(false)} style={styles.carouselCloseButton}>
                <MaterialIcons name="close" size={30} color="red" />
              </TouchableOpacity>
              <Text style={styles.carouselTitle}>
                {selectedMediaIndex + 1} / {getFilteredMedia().length}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {getFilteredMedia().length > 0 && (
              <FlatList
                data={getFilteredMedia()}
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
                        isLooping={false}
                        useNativeControls={true}
                        onError={(error) => {
                          console.error('Error playing video:', error);
                          Alert.alert('Erreur vidéo', error);
                        }}
                      />
                    ) : (
                      <Image source={{ uri: item.url }} style={styles.carouselImage} resizeMode="contain" />
                    )}

                    {item.description && (
                      <Text style={styles.carouselDescription}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </Modal>

        {/* Document Upload Modal */}
        <DocumentUploadModal
          visible={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadDocument}
          uploading={uploading}
        />
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
  datesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  photosContainer: {
    paddingRight: 20,
  },
  photoItem: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  photoDescription: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_400Regular',
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E96C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addDocumentButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 4,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 2,
  },
  documentDetails: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  deleteDocumentButton: {
    padding: 8,
  },
  emptyDocuments: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyDocumentsText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDocumentsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
  carouselContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  carouselHeader: {
    position: 'absolute',
    top: 60, // Increased top spacing
    left: 0,
    right: 0,
    zIndex: 10, // Increased zIndex
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  carouselCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker background
    borderRadius: 25, // Rounder
    padding: 12, // Larger touch area
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Subtle border for visibility
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
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black', // Ensure black background for item
  },
  carouselImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    resizeMode: 'contain', // Ensure styling knows it's contain
  },
  carouselVideo: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
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
  // Media filter styles
  mediaFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  mediaFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80,
    justifyContent: 'center',
  },
  mediaFilterButtonActive: {
    backgroundColor: '#E96C2E',
    borderColor: '#E96C2E',
  },
  mediaFilterText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 4,
  },
  mediaFilterTextActive: {
    color: '#FFFFFF',
  },
  videoContainer: {
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  videoDuration: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'FiraSans_600SemiBold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    position: 'absolute',
    bottom: 8,
    right: 8,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderColor: '#F44336',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#F44336',
    fontFamily: 'FiraSans_400Regular',
  },
  errorBannerClose: {
    padding: 4,
  },
  addDocumentButtonDisabled: {
    opacity: 0.6,
  },
  documentDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 2,
  },
});