import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { chantierService } from '../../services/chantierService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import type { FirebaseChantier, ProgressPhoto } from '../../types/firebase';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<ChefTabParamList, 'ChefGallery'>;

export default function ChefGalleryScreen({ navigation }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<FirebaseChantier[]>([]);
  const [selectedProject, setSelectedProject] = useState<FirebaseChantier | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImageCarousel, setShowImageCarousel] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      loadChefChantiers();
    }
  }, [user, authLoading]);

  const loadChefChantiers = async () => {
    try {
      setLoading(true);

      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour accéder à cette page');
        return;
      }

      const chefId = user.uid;
      const unsubscribe = chantierService.subscribeToChefChantiers(chefId, (chantiersData) => {
        setProjects(chantiersData);
        // Auto-select first project if none selected
        if (!selectedProject && chantiersData.length > 0) {
          setSelectedProject(chantiersData[0]);
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erreur lors du chargement des chantiers:', error);
      Alert.alert('Erreur', 'Impossible de charger les chantiers');
      setLoading(false);
    }
  };

  const addMediaToGallery = () => {
    if (!selectedProject) {
      Alert.alert('Erreur', 'Veuillez sélectionner un chantier');
      return;
    }

    Alert.alert(
      "Ajouter un média",
      "Choisissez le type de média à ajouter",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Photo", onPress: () => selectMedia('image') },
        { text: "Vidéo", onPress: () => selectMedia('video') },
      ]
    );
  };

  const selectMedia = async (mediaType: 'image' | 'video') => {
    if (!selectedProject || !user) return;

    try {
      setUploading(true);

      // Request permission silently
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour ajouter des médias.");
        setUploading(false);
        return;
      }

      const mediaTypes = mediaType === 'image'
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypes,
        allowsEditing: true,
        aspect: mediaType === 'image' ? [4, 3] : undefined,
        quality: mediaType === 'image' ? 0.8 : 0.7,
        videoMaxDuration: mediaType === 'video' ? 60 : undefined, // 60 seconds max for videos
      });

      if (!result.canceled && result.assets[0]) {
        try {
          const asset = result.assets[0];
          const mediaUri = asset.uri;

          // Upload media to Firebase Storage
          const mediaUrl = await storageService.uploadMediaFromUri(
            mediaUri,
            `chantiers/${selectedProject.id}/gallery`,
            mediaType
          );

          // For videos, we might want to generate a thumbnail in the future
          // For now, we'll use the video URL as both main URL and thumbnail
          const thumbnailUrl = mediaType === 'video' ? mediaUrl : undefined;
          const duration = mediaType === 'video' ? asset.duration : undefined;

          // Add media to the chantier's gallery
          await chantierService.addPhasePhoto(
            selectedProject.id!,
            '', // Empty phaseId for general gallery photos
            mediaUrl,
            `${mediaType === 'image' ? 'Photo' : 'Vidéo'} ajoutée depuis l'application mobile`,
            user.uid,
            mediaType,
            duration,
            thumbnailUrl
          );

          // Refresh project data to show new media immediately
          const updatedProject = await chantierService.getChantierById(selectedProject.id!);
          if (updatedProject) {
            setSelectedProject(updatedProject);

            // Update projects list too
            setProjects(prevProjects =>
              prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
            );
          }

          Alert.alert('Succès', `${mediaType === 'image' ? 'Photo' : 'Vidéo'} ajoutée avec succès!`);

        } catch (uploadError) {
          console.error('Erreur lors de l\'upload du média:', uploadError);
          Alert.alert('Erreur', `Impossible d'ajouter ${mediaType === 'image' ? 'la photo' : 'la vidéo'}`);
        }
      }
    } catch (error) {
      console.error('Erreur générale lors de l\'ajout de média:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection du média');
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (photoId: string) => {
    if (!selectedProject || !user) return;

    Alert.alert(
      "Supprimer le média",
      "Êtes-vous sûr de vouloir supprimer ce média ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await chantierService.removePhasePhoto(selectedProject.id!, photoId, user.uid);

              // Refresh project data to show changes immediately
              const updatedProject = await chantierService.getChantierById(selectedProject.id!);
              if (updatedProject) {
                setSelectedProject(updatedProject);

                // Update projects list too
                setProjects(prevProjects =>
                  prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
                );
              }

              Alert.alert('Succès', 'Média supprimé avec succès');
            } catch (error) {
              console.error('Erreur lors de la suppression du média:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le média');
            }
          }
        }
      ]
    );
  };

  const openImageCarousel = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageCarousel(true);
  };

  const renderMediaItem = ({ item, index }: { item: ProgressPhoto; index: number }) => (
    <View style={styles.mediaItemContainer}>
      <TouchableOpacity onPress={() => openImageCarousel(index)}>
        {item.type === 'video' ? (
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: item.thumbnailUrl || item.url }}
              style={styles.mediaItem}
              resizeMode="cover"
              shouldPlay={false}
              isLooping={false}
              useNativeControls={false}
            />
            <View style={styles.videoOverlay}>
              <MaterialIcons name="play-circle-filled" size={40} color="rgba(255,255,255,0.9)" />
              {item.duration && (
                <Text style={styles.videoDuration}>
                  {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, '0')}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <Image source={{ uri: item.url }} style={styles.mediaItem} />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteMedia(item.id)}
      >
        <MaterialIcons name="delete" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      {item.description && (
        <Text style={styles.mediaDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </View>
  );

  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <AppHeader
          title="Galerie"
          showNotification={true}
          onNotificationPress={() => {}}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2B2E83" />
          <Text style={styles.loadingText}>Chargement en cours...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Galerie"
        showNotification={true}
        onNotificationPress={() => {}}
      />

      {/* Project Selector */}
      <View style={styles.projectSelector}>
        <Text style={styles.selectorLabel}>Chantier sélectionné :</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {projects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={[
                styles.projectChip,
                selectedProject?.id === project.id && styles.projectChipActive
              ]}
              onPress={() => setSelectedProject(project)}
            >
              <Text style={[
                styles.projectChipText,
                selectedProject?.id === project.id && styles.projectChipTextActive
              ]}>
                {project.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Add Media Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={[styles.addButton, (!selectedProject || uploading) && styles.addButtonDisabled]}
          onPress={addMediaToGallery}
          disabled={!selectedProject || uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          )}
          <Text style={styles.addButtonText}>
            {uploading ? 'Upload en cours...' : 'Ajouter un média'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Media Gallery */}
      <ScrollView style={styles.galleryContainer} showsVerticalScrollIndicator={false}>
        {!selectedProject ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="photo-library" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>Sélectionnez un chantier</Text>
            <Text style={styles.emptySubtext}>Choisissez un chantier pour voir et ajouter des médias</Text>
          </View>
        ) : selectedProject.gallery.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="photo-camera" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>Aucun média</Text>
            <Text style={styles.emptySubtext}>Ajoutez des photos et vidéos pour documenter l'avancement</Text>
          </View>
        ) : (
          <FlatList
            data={selectedProject.gallery}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.mediaGrid}
            columnWrapperStyle={styles.mediaRow}
          />
        )}
      </ScrollView>

      {/* Image Carousel Modal */}
      <Modal
        visible={showImageCarousel}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <TouchableOpacity onPress={() => setShowImageCarousel(false)} style={styles.carouselCloseButton}>
              <MaterialIcons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.carouselTitle}>
              {selectedImageIndex + 1} / {selectedProject?.gallery?.length || 0}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (selectedProject?.gallery[selectedImageIndex]) {
                  setShowImageCarousel(false);
                  deleteMedia(selectedProject.gallery[selectedImageIndex].id);
                }
              }}
              style={styles.carouselDeleteButton}
            >
              <MaterialIcons name="delete" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {selectedProject?.gallery && selectedProject.gallery.length > 0 && (
            <FlatList
              data={selectedProject.gallery}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedImageIndex}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setSelectedImageIndex(index);
              }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.carouselItemContainer}>
                  {item.type === 'video' ? (
                    <Video
                      source={{ uri: item.url }}
                      style={styles.carouselVideo}
                      resizeMode="contain"
                      shouldPlay={false}
                      isLooping={false}
                      useNativeControls={true}
                    />
                  ) : (
                    <Image
                      source={{ uri: item.url }}
                      style={styles.carouselImage}
                      resizeMode="contain"
                    />
                  )}
                  {item.description && (
                    <Text style={styles.carouselDescription}>{item.description}</Text>
                  )}
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  projectSelector: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectorLabel: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 12,
  },
  projectChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  projectChipActive: {
    backgroundColor: '#2B2E83',
    borderColor: '#2B2E83',
  },
  projectChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
  },
  projectChipTextActive: {
    color: '#FFFFFF',
  },
  addButtonContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#E96C2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#E96C2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 8,
  },
  galleryContainer: {
    flex: 1,
    padding: 20,
  },
  mediaGrid: {
    paddingBottom: 100, // Space for tab bar
  },
  mediaRow: {
    justifyContent: 'space-between',
  },
  mediaItemContainer: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  mediaItem: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  mediaDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 40,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
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
  carouselDeleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
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
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: width,
    height: height * 0.8,
  },
  carouselVideo: {
    width: width,
    height: height * 0.8,
  },
  carouselDescription: {
    position: 'absolute',
    bottom: 100,
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
});