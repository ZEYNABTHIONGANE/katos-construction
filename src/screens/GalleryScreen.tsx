import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  Image,
  StatusBar,
  Alert,
  RefreshControl,
  AccessibilityInfo,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { AppTabsParamList } from '../navigation/RootNavigator';
import { useSessionStore } from '../store/session';
import { useMedia, useMediaStats } from '../hooks/useMedia';
import MediaCard from '../components/MediaCard';
import UploadButton from '../components/UploadButton';
import { Media } from '../types/media';

type Props = BottomTabScreenProps<AppTabsParamList, 'Gallery'>;

const { width, height } = Dimensions.get('window');

export default function GalleryScreen({ }: Props) {
  const { appUser } = useSessionStore();
  const projectId = appUser?.projectId;

  // Hooks pour les médias
  const {
    media,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  } = useMedia(projectId);
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useMediaStats(projectId);

  // État pour le modal viewer
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');

  // Filtrer les médias selon le type sélectionné
  const filteredMedia = useMemo(() => (
    selectedFilter === 'all'
      ? media
      : media.filter(item => item.type === selectedFilter)
  ), [media, selectedFilter]);

  const handleRefresh = useCallback(async () => {
    if (!projectId) {
      return;
    }

    try {
      AccessibilityInfo.announceForAccessibility?.('Rafraîchissement de la galerie');
      await Promise.allSettled([
        refresh(),
        refreshStats(),
      ]);
    } catch (err) {
      console.error('❌ Erreur rafraîchissement médias:', err);
    }
  }, [projectId, refresh, refreshStats]);

  // Gérer la sélection d'un média
  const handleMediaPress = (mediaItem: Media) => {
    setSelectedMedia(mediaItem);
  };

  // Fermer le modal viewer
  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  // Callback appelé après upload réussi
  const handleUploadComplete = () => {
    // Les données se mettent à jour automatiquement grâce au hook useMedia
    console.log('✅ Upload terminé, données mises à jour automatiquement');
  };

  // Categories dynamiques basées sur les stats
  const categories = [
    { id: 'all', title: 'Tous les médias', count: stats.total, color: '#2E7D3E', filter: 'all' as const },
    { id: 'image', title: 'Photos', count: stats.images, color: '#FF6B35', filter: 'image' as const },
    { id: 'video', title: 'Vidéos', count: stats.videos, color: '#4A90E2', filter: 'video' as const },
    { id: 'document', title: 'Documents', count: stats.documents, color: '#9B59B6', filter: 'document' as const },
  ];
  // État de chargement
  if (!projectId) {
    return (
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackIcon}>ℹ️</Text>
        <Text style={styles.feedbackTitle}>Aucun projet sélectionné</Text>
        <Text style={styles.feedbackText}>
          Associez un projet à votre compte pour accéder à la galerie.
        </Text>
      </View>
    );
  }

  if (loading || statsLoading) {
    return (
      <View style={styles.feedbackContainer}>
        <ActivityIndicator size="large" color="#2E7D3E" />
        <Text style={styles.feedbackText}>Chargement des médias...</Text>
      </View>
    );
  }

  // Erreur de chargement
  if (error || statsError) {
    return (
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackIcon}>⚠️</Text>
        <Text style={styles.feedbackTitle}>Erreur de chargement</Text>
        <Text style={styles.feedbackText}>{error || statsError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Réessayer de charger les médias"
          onPress={() => {
            Alert.alert('Erreur', 'Impossible de charger les médias. Vérifiez votre connexion.');
            handleRefresh();
          }}
        >
          <Text style={styles.retryButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor="#2E7D3E"
            colors={['#2E7D3E']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📸 Galerie du projet</Text>
          <Text style={styles.headerSubtitle}>
            {stats.total} média{stats.total > 1 ? 's' : ''} disponible{stats.total > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Filtres par catégories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Filtres</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { borderLeftColor: category.color },
                  selectedFilter === category.filter && styles.categorySelected,
                  category.count === 0 && styles.categoryDisabled
                ]}
                onPress={() => setSelectedFilter(category.filter)}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedFilter === category.filter, disabled: category.count === 0 }}
                accessibilityLabel={`${category.title}. ${category.count} éléments`}
                disabled={category.count === 0}
              >
                <Text style={[
                  styles.categoryTitle,
                  category.count === 0 && styles.categoryTitleDisabled
                ]}>
                  {category.title}
                </Text>
                <Text style={[
                  styles.categoryCount,
                  category.count === 0 && styles.categoryCountDisabled
                ]}>
                  {category.count} {category.count <= 1 ? 'élément' : 'éléments'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Grille des médias */}
        {filteredMedia.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedFilter === 'all' ? 'Tous les médias' :
               selectedFilter === 'image' ? 'Photos' :
               selectedFilter === 'video' ? 'Vidéos' : 'Documents'}
              {filteredMedia.length !== stats.total && ` (${filteredMedia.length})`}
            </Text>
            <View style={styles.mediaGrid}>
              {filteredMedia.map((mediaItem) => (
                <MediaCard
                  key={mediaItem.id}
                  media={mediaItem}
                  onPress={handleMediaPress}
                  accessibilityHint="Ouvrir le média"
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.feedbackIcon}>📸</Text>
            <Text style={styles.feedbackTitle}>
              {selectedFilter === 'all' ? 'Aucun média' :
               selectedFilter === 'image' ? 'Aucune photo' :
               selectedFilter === 'video' ? 'Aucune vidéo' : 'Aucun document'}
            </Text>
            <Text style={styles.feedbackText}>
              Les médias uploadés par votre chef de projet apparaîtront ici
            </Text>
          </View>
        )}

        {hasMore && (
          <View style={styles.loadMoreWrapper}>
            <TouchableOpacity
              style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
              onPress={loadMore}
              disabled={loadingMore}
              accessibilityRole="button"
              accessibilityLabel="Charger plus de médias"
              accessibilityState={{ disabled: loadingMore }}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#2E7D3E" />
              ) : (
                <Text style={styles.loadMoreText}>Charger plus de médias</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bouton d'upload pour les chefs */}
        {projectId && (
          <UploadButton
            projectId={projectId}
            onUploadComplete={handleUploadComplete}
          />
        )}
      </ScrollView>

      {/* Modal Viewer */}
      {selectedMedia && (
        <Modal
          visible={true}
          transparent={false}
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
                accessibilityRole="button"
                accessibilityLabel="Fermer l'aperçu du média"
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.modalHeaderInfo}>
                {selectedMedia.title && (
                  <Text style={styles.modalTitle}>{selectedMedia.title}</Text>
                )}
                <Text style={styles.modalDate}>
                  {selectedMedia.createdAt.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.modalContent}>
              {selectedMedia.type === 'image' ? (
                <Image
                  source={{ uri: selectedMedia.downloadURL }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              ) : selectedMedia.type === 'video' ? (
                <View style={styles.modalVideoContainer}>
                  <Text style={styles.modalVideoText}>🎥</Text>
                  <Text style={styles.modalVideoSubtext}>
                    Lecteur vidéo en développement
                  </Text>
                </View>
              ) : (
                <View style={styles.modalDocumentContainer}>
                  <Text style={styles.modalDocumentText}>📄</Text>
                  <Text style={styles.modalDocumentName}>
                    {selectedMedia.title || 'Document'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categoriesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categorySelected: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#2E7D3E',
  },
  categoryDisabled: {
    opacity: 0.5,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryTitleDisabled: {
    color: '#999',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  categoryCountDisabled: {
    color: '#ccc',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // États de feedback
  feedbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 40,
  },
  feedbackIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#2E7D3E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadMoreWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2E7D3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  loadMoreButtonDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    color: '#2E7D3E',
    fontWeight: '600',
    fontSize: 14,
  },
  // État vide
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
    marginTop: 50,
  },
  // Modal Viewer
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalHeaderInfo: {
    flex: 1,
    marginLeft: 15,
  },
  modalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: height - 120,
  },
  modalVideoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  modalVideoText: {
    fontSize: 64,
    marginBottom: 20,
  },
  modalVideoSubtext: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  modalDocumentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  modalDocumentText: {
    fontSize: 64,
    marginBottom: 20,
  },
  modalDocumentName: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
