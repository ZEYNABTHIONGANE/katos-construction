import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SectionList,
  Platform,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeTabParamList } from '../../types';
import { useClientChantier } from '../../hooks/useClientChantier';
import { useClientDocuments } from '../../hooks/useDocuments';
import { useClientAuth } from '../../hooks/useClientAuth';
import { ResizeMode } from 'expo-av';
import VideoModal from '../../components/VideoModal';

// Types
import { FirebaseDocument, DocumentCategory } from '../../types/firebase';

type Props = NativeStackScreenProps<HomeTabParamList, 'Documents'>;

export default function ClientDocumentsScreenV3({ navigation }: Props) {
  const { session } = useClientAuth();
  const { chantier, hasChantier, name: chantierName } = useClientChantier();

  // Use the existing client documents hook instead of the new one for now
  const {
    documents,
    loading,
    error,
    totalDocuments,
    documentsByCategory,
    formatFileSize,
    getDocumentIcon,
    clearError
  } = useClientDocuments(chantier?.id || '');

  // Local state for filtering
  const [filteredDocuments, setFilteredDocuments] = useState<FirebaseDocument[]>([]);

  // Calculate stats locally
  const newDocuments = documents.filter(doc => {
    const uploadDate = doc.uploadedAt?.toDate?.() || new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return uploadDate > weekAgo;
  }).length;

  const unreadDocuments = 0; // Will implement later

  // Local functions
  const markAsRead = async (documentId: string) => {
    // Placeholder - will implement later
    console.log('Mark as read:', documentId);
  };

  const refreshDocuments = () => {
    // Placeholder - will implement later
    clearError();
  };

  const filterDocuments = (filters: any) => {
    // Simple filtering logic
    if (filters.category && filters.category !== 'all') {
      setFilteredDocuments(documents.filter(doc => doc.category === filters.category));
    } else {
      setFilteredDocuments(documents);
    }
  };

  const isDocumentNew = (document: FirebaseDocument): boolean => {
    const uploadDate = document.uploadedAt?.toDate?.() || new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return uploadDate > weekAgo;
  };

  const isDocumentUnread = (document: FirebaseDocument): boolean => {
    return false; // Placeholder
  };

  // Debug logs
  useEffect(() => {
    console.log('ClientDocumentsScreenV3 Debug:', {
      chantierId: chantier?.id,
      loading,
      documentsCount: documents.length,
      documents: documents
    });
  }, [chantier, loading, documents]);

  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<FirebaseDocument | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<FirebaseDocument | null>(null);

  // Handle category filter change
  const handleCategoryChange = (category: DocumentCategory | 'all') => {
    setSelectedCategory(category);
    filterDocuments({
      category,
    });
  };

  // Handle document press (mark as read and show details)
  const handleDocumentPress = (doc: FirebaseDocument) => {
    // Mark as read logic is handled by useDocuments hook automatically if implemented, or we can do it here
    const docType = (doc as any).type || doc.category;

    if (doc.category === 'video' || doc.mimeType?.includes('video')) {
       setSelectedVideo(doc);
       setIsVideoModalVisible(true);
       return;
    }
    
    // Always open viewer if supported, otherwise do nothing or show toast (for now, assume viewer handles supported types)
    if (doc.mimeType?.includes('image') || doc.mimeType?.includes('pdf') || docType === 'photo' || docType === 'plan' || docType === 'contract' || docType === 'invoice' || docType === 'report' || docType === 'permit') {
      setViewingDocument(doc);
      setModalVisible(true);
    } else {
       Alert.alert('Info', 'Ce type de document ne peut pas être visualisé dans l\'application.');
    }
  };



  const getViewerUrl = (url: string, mimeType?: string) => {
    if (Platform.OS === 'android' && mimeType?.includes('pdf')) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    refreshDocuments();
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getCategoryLabel = (category: DocumentCategory): string => {
    const labels: Record<DocumentCategory, string> = {
      'contract': 'Contrat',
      'plan': 'Plan',
      'invoice': 'Facture',
      'permit': 'Autorisation',
      'photo': 'Photo',
      'video': 'Vidéo',
      'report': 'Rapport',
      'other': 'Autre'
    };
    return labels[category] || category;
  };

  const getDocumentColor = (category: DocumentCategory): string => {
    switch (category) {
      case 'contract': return '#2B2E83';
      case 'plan': return '#E96C2E';
      case 'invoice': return '#4CAF50';
      case 'permit': return '#FF9800';
      case 'photo': return '#03A9F4';
      case 'report': return '#9C27B0';
      case 'other': return '#607D8B';
      default: return '#6B7280';
    }
  };

  const renderDocument = ({ item }: { item: FirebaseDocument }) => {
    const iconName = getDocumentIcon(item.mimeType);
    const formattedSize = formatFileSize(item.size);
    const uploadDate = item.uploadedAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue';
    const isNew = isDocumentNew(item);
    const unread = isDocumentUnread(item);

    return (
      <View style={[styles.documentCard, unread && styles.documentCardUnread]}>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => handleDocumentPress(item)}
        >
          <View style={styles.documentHeader}>
            <View style={[styles.iconContainer, { backgroundColor: getDocumentColor(item.category) }]}>
              <MaterialIcons name={iconName as any} size={24} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.documentContent}>
            <View style={styles.topRow}>
              <Text style={[styles.documentName, unread && styles.documentNameUnread]} numberOfLines={1}>
                {item.originalName}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.documentCategory}>
                {getCategoryLabel(item.category)}
              </Text>
              <Text style={styles.documentDate}>{uploadDate}</Text>
            </View>



            <View style={styles.metaRow}>
              {item.size > 0 && <Text style={styles.fileSize}>{formattedSize}</Text>}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const documentCategories = [
    { label: 'Tous', value: 'all' as const, count: totalDocuments },
    { label: 'Contrats', value: 'contract' as const, count: documentsByCategory['contract']?.length || 0 },
    { label: 'Plans', value: 'plan' as const, count: documentsByCategory['plan']?.length || 0 },
    { label: 'Factures', value: 'invoice' as const, count: documentsByCategory['invoice']?.length || 0 },
    { label: 'Autorisations', value: 'permit' as const, count: documentsByCategory['permit']?.length || 0 },
    { label: 'Photos', value: 'photo' as const, count: documentsByCategory['photo']?.length || 0 },
    { label: 'Vidéos', value: 'video' as const, count: documentsByCategory['video']?.length || 0 },
    { label: 'Rapports', value: 'report' as const, count: documentsByCategory['report']?.length || 0 },
    { label: 'Autres', value: 'other' as const, count: documentsByCategory['other']?.length || 0 },
  ];

  // Show loading state
  if (!hasChantier) {
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
            <Text style={styles.headerTitle}>Mes documents</Text>
            <View style={styles.headerRight} />
          </View>
          <View style={styles.errorContent}>
            <MaterialIcons name="description" size={64} color="#E0E0E0" />
            <Text style={styles.errorText}>Aucun chantier disponible</Text>
            <Text style={styles.errorSubtext}>
              Vos documents apparaîtront ici une fois votre chantier créé
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
          <Text style={styles.headerTitle}>Mes documents</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <MaterialIcons
              name="refresh"
              size={24}
              color="#FFFFFF"
              style={refreshing ? styles.spinning : undefined}
            />
          </TouchableOpacity>
        </View>

        {/* Project Info with Statistics */}
        <View style={styles.projectInfo}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectName}>{chantierName}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalDocuments}</Text>
                <Text style={styles.statLabel}>Documents</Text>
              </View>
              {newDocuments > 0 && (
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.newStatNumber]}>{newDocuments}</Text>
                  <Text style={styles.statLabel}>Nouveaux</Text>
                </View>
              )}
              {unreadDocuments > 0 && (
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.unreadStatNumber]}>{unreadDocuments}</Text>
                  <Text style={styles.statLabel}>Non lus</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
            {documentCategories.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.filterChip,
                  selectedCategory === cat.value && styles.filterChipActive
                ]}
                onPress={() => handleCategoryChange(cat.value)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCategory === cat.value && styles.filterChipTextActive
                ]}>
                  {cat.label}
                  {cat.count > 0 && (
                    <Text> ({cat.count})</Text>
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error" size={20} color="#F44336" />
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorBannerClose}>
              <MaterialIcons name="close" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}

        {/* Documents List */}
        <FlatList
          data={selectedCategory === 'all' ? documents : filteredDocuments}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.documentsContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#E96C2E']}
              tintColor="#E96C2E"
            />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2B2E83" />
                <Text style={styles.loadingText}>Chargement des documents...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="description" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>
                  {selectedCategory === 'all' ? 'Aucun document' : `Aucun document de type "${getCategoryLabel(selectedCategory as DocumentCategory)}"`}
                </Text>
              </View>
            )
          }
        />
        {/* Document Viewer Modal */}
        <Modal
          visible={!!viewingDocument}
          animationType="slide"
          onRequestClose={() => setViewingDocument(null)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 10}}>
              <TouchableOpacity 
                onPress={() => setViewingDocument(null)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                style={{ padding: 10, backgroundColor: '#F3F4F6', borderRadius: 20 }}
              >
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '600', maxWidth: '80%' }} numberOfLines={1}>
                {viewingDocument?.originalName}
              </Text>
              <View style={{ width: 44 }} /> 
            </View>
            {viewingDocument?.url && (
              <WebView
                source={{ uri: getViewerUrl(viewingDocument.url, viewingDocument.mimeType) }}
                style={{ flex: 1 }}
                startInLoadingState
                renderLoading={() => (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#E96C2E" />
                  </View>
                )}
              />
            )}
          </SafeAreaView>
        </Modal>

        <VideoModal
          visible={isVideoModalVisible}
          videoUri={selectedVideo?.url || ''}
          onClose={() => {
              setIsVideoModalVisible(false);
              setSelectedVideo(null);
          }}
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
  refreshButton: {
    padding: 8,
  },
  spinning: {
    // Add rotation animation if needed
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
  projectInfo: {

    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    marginLeft: 16,
  },
  statNumber: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
  },
  newStatNumber: {
    color: '#4CAF50',
  },
  unreadStatNumber: {
    color: '#FF9800',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#E96C2E',
    borderColor: '#E96C2E',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_600SemiBold',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  documentsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row', // Added for new layout
    alignItems: 'center', // Added for new layout
  },
  documentCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#E96C2E',
  },
  documentHeader: {
    // Removed flex-direction row, now just for icon container
    marginRight: 12,
  },
  iconContainer: { // New style
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: { // Old style, replaced by documentContent
    flex: 1,
  },
  documentContent: { // New style
    flex: 1,
  },
  topRow: { // New style
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentName: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    flex: 1,
  },
  documentNameUnread: { // New style
    fontFamily: 'FiraSans_700Bold',
  },
  newBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  newBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_500Medium',
    marginRight: 6,
    textTransform: 'uppercase',
  },
  documentDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  fileSize: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
  },
  documentDetails: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
  },
  visibilityBothBadge: {
    backgroundColor: '#F0F9F0',
  },
  visibilityClientBadge: {
    backgroundColor: '#FFF8E1',
  },
  visibilityText: {
    fontSize: 10,
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 4,
  },
  visibilityBothText: {
    color: '#4CAF50',
  },
  visibilityClientText: {
    color: '#FF9800',
  },
  downloadButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
    marginBottom: 24,
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
});