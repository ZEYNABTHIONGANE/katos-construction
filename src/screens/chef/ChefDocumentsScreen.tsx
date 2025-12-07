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
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChefTabParamList } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useDocuments } from '../../hooks/useDocuments';
import { chantierService } from '../../services/chantierService';
import { documentService } from '../../services/documentService';
import DocumentUploadModal from '../../components/DocumentUploadModal';
import type { DocumentCategory, DocumentVisibility, FirebaseDocument } from '../../types/firebase';

type Props = NativeStackScreenProps<ChefTabParamList, 'ChefDashboard'>;

interface DocumentWithClient {
  document: FirebaseDocument;
  chantierName?: string;
  clientName?: string;
}

export default function ChefDocumentsScreen({ navigation }: Props) {
  const { userData } = useAuth();

  // States for chef-specific logic
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [chefChantiers, setChefChantiers] = useState<any[]>([]);
  const [selectedChantier, setSelectedChantier] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [availableClients, setAvailableClients] = useState<{id: string; name: string; email?: string}[]>([]);

  // Load chantiers for chef
  useEffect(() => {
    console.log('🔄 ChefDocuments: useEffect triggered for chef');

    const loadChefChantiers = async () => {
      try {
        console.log('🔍 ChefDocuments: Loading chantiers for chef');

        // Step 1: Get all chantiers from the chantiers collection
        const chantiersWithDocs = [];

        try {
          console.log('🔍 ChefDocuments: Loading all chantiers from database...');

          // First get chantiers assigned to this chef if user is available
          if (userData?.uid) {
            try {
              const chefChantiers = await chantierService.getChefChantiers(userData.uid);
              console.log(`🏗️ ChefDocuments: Found ${chefChantiers.length} assigned chantiers for chef`);

              for (const chantier of chefChantiers) {
                const docs = await documentService.getChantierDocuments(chantier.id!, 'chef');
                console.log(`📄 ChefDocuments: Assigned chantier "${chantier.name}" (${chantier.id}) has ${docs.length} documents`);

                chantiersWithDocs.push({
                  id: chantier.id!,
                  name: chantier.name,
                  documentCount: docs.length,
                  isRealChantier: true,
                  isAssigned: true
                });
              }
            } catch (chefError) {
              console.log('⚠️ ChefDocuments: Error getting chef chantiers:', chefError);
            }
          }

          // For testing: Also check if there are other chantiers with documents
          // This is a fallback in case the chef is not properly assigned to chantiers
          console.log('🔍 ChefDocuments: Checking for any other chantiers with documents...');

          // Try to get a client chantier as a test (using a simple approach)
          try {
            // This is a simple way to find any chantier with documents
            // We'll query the documentService which might have methods to find any chantierId
            const possibleChantierIds = ['', 'test-chantier'];

            for (const chantierId of possibleChantierIds) {
              try {
                const docs = await documentService.getChantierDocuments(chantierId, 'chef');
                console.log(`📄 ChefDocuments: Test chantierId "${chantierId}" has ${docs.length} documents`);

                if (docs.length > 0) {
                  chantiersWithDocs.push({
                    id: chantierId,
                    name: chantierId === '' ? 'Documents sans chantier' : `Chantier de test (${chantierId})`,
                    documentCount: docs.length,
                    isTest: true
                  });
                }
              } catch (err) {
                console.log(`❌ ChefDocuments: Error checking test chantierId "${chantierId}":`, err);
              }
            }

            // Get ALL chantiers from the database to find any with documents
            console.log('🔍 ChefDocuments: Getting all chantiers from database...');
            const allChantiers = await chantierService.getAllChantiers();
            console.log(`🏗️ ChefDocuments: Found ${allChantiers.length} total chantiers in database`);

            for (const chantier of allChantiers) {
              try {
                const docs = await documentService.getChantierDocuments(chantier.id!, 'chef');
                console.log(`📄 ChefDocuments: Chantier "${chantier.name}" (${chantier.id}) has ${docs.length} documents`);

                if (docs.length > 0) {
                  // Check if this chantier is already in our list (avoid duplicates)
                  const alreadyExists = chantiersWithDocs.some(existing => existing.id === chantier.id);
                  if (!alreadyExists) {
                    chantiersWithDocs.push({
                      id: chantier.id!,
                      name: chantier.name,
                      documentCount: docs.length,
                      isRealChantier: true,
                      clientId: chantier.clientId
                    });
                  }
                }
              } catch (docError) {
                console.log(`❌ ChefDocuments: Error checking documents for chantier ${chantier.id}:`, docError);
              }
            }
          } catch (testError) {
            console.log('⚠️ ChefDocuments: Could not check for other chantiers:', testError);
          }

        } catch (generalError) {
          console.log('❌ ChefDocuments: Error in chantier discovery:', generalError);
        }

        console.log('✅ ChefDocuments: Total chantiers with documents found:', chantiersWithDocs.length);
        console.log('📋 ChefDocuments: Chantiers details:', chantiersWithDocs);

        // Extract unique clients from chantiers
        const clientsMap = new Map();
        chantiersWithDocs.forEach(chantier => {
          if (chantier.clientId && chantier.clientId.trim() !== '') {
            clientsMap.set(chantier.clientId, {
              id: chantier.clientId,
              name: `Client ${chantier.clientId.substring(0, 8)}...`,
              email: undefined
            });
          }
        });
        const uniqueClients = Array.from(clientsMap.values());
        console.log('👥 ChefDocuments: Available clients:', uniqueClients);
        setAvailableClients(uniqueClients);

        if (chantiersWithDocs.length > 0) {
          setChefChantiers(chantiersWithDocs);
          setSelectedChantier(chantiersWithDocs[0].id); // Use first chantier with documents
          console.log('🎯 ChefDocuments: Selected chantier:', chantiersWithDocs[0]);
        } else {
          console.log('⚠️ ChefDocuments: No chantiers with documents found');
          // Even if no documents, set up empty chantier for testing
          setChefChantiers([{
            id: '',
            name: 'Documents sans chantier',
            documentCount: 0
          }]);
          setSelectedChantier('');
        }

      } catch (error) {
        console.error('❌ ChefDocuments: Error in loadChefChantiers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChefChantiers();
  }, [userData?.uid]); // Only depend on user ID

  console.log('🏗️ ChefDocuments: State', {
    selectedChantier,
    chefChantiersCount: chefChantiers.length
  });

  // Get documents using the same logic as client, but with chef role
  const {
    documents,
    loading: documentsLoading,
    uploading,
    uploadDocument,
    deleteDocument,
    updateDocument,
    formatFileSize,
    getDocumentIcon,
    totalDocuments,
  } = useDocuments({
    chantierId: selectedChantier,
    userRole: 'chef',
    autoSubscribe: true,
  });


  const handleUploadDocument = async (
    file: { uri: string; name: string; size: number; mimeType?: string },
    category: DocumentCategory,
    title: string,
    description?: string,
    visibility: DocumentVisibility = 'both'
  ): Promise<boolean> => {
    if (!userData) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return false;
    }

    if (!selectedChantier) {
      Alert.alert('Erreur', 'Veuillez sélectionner un chantier');
      return false;
    }

    try {
      // Upload to the selected chantier (which is automatically associated to its client)
      const selectedChantierData = chefChantiers.find(c => c.id === selectedChantier);
      console.log(`📄 Uploading to chantier: ${selectedChantier} for client: ${selectedChantierData?.clientId || 'unknown'}`);

      const uploadedDoc = await documentService.uploadDocument(
        file,
        selectedChantier,
        category,
        userData.uid,
        {
          description: description || `${title} - Uploadé par ${userData.displayName}`,
          visibility: 'both' // Always visible to both client and chef
        }
      );

      if (uploadedDoc) {
        // Documents will auto-refresh through the subscription
        const chantierName = selectedChantierData?.name || 'chantier sélectionné';
        Alert.alert('Succès', `Document uploadé pour le ${chantierName}`);
      }

      return !!uploadedDoc;
    } catch (error) {
      console.error('Error uploading document:', error);
      return false;
    }
  };

  const handleDeleteDocument = (document: FirebaseDocument) => {
    if (!userData) return;

    Alert.alert(
      'Supprimer le document',
      `Êtes-vous sûr de vouloir supprimer "${document.originalName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteDocument(document.id, userData.uid);
            if (success) {
              Alert.alert('Succès', 'Document supprimé');
            }
          }
        }
      ]
    );
  };


  const filteredDocuments = () => {
    let filtered = documents;

    console.log('📋 ChefDocuments: Filtering documents', {
      totalDocuments: documents.length,
      searchQuery,
      selectedCategory
    });

    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    console.log('📋 ChefDocuments: Filtered result:', filtered.length, 'documents');
    return filtered;
  };

  const renderDocument = ({ item }: { item: FirebaseDocument }) => {
    const iconName = getDocumentIcon(item.mimeType);
    const formattedSize = formatFileSize(item.size);
    const uploadDate = item.uploadedAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue';
    const isClientDocument = item.uploadedBy && item.uploadedBy.startsWith('CLI');

    if (isClientDocument) {
      console.log('👥 Chef view: Client document found:', {
        name: item.originalName,
        uploadedBy: item.uploadedBy,
        visibility: item.visibility
      });
    }

    // For chef view, we can show chantier name if available
    const currentChantier = chefChantiers.find(c => c.id === selectedChantier);
    const showChantierInfo = currentChantier?.name;

    return (
      <View style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={styles.documentIcon}>
            <MaterialIcons
              name={iconName as any}
              size={24}
              color="#E96C2E"
            />
          </View>
          <View style={styles.documentInfo}>
            <View style={styles.documentTitleRow}>
              <Text style={styles.documentName}>{item.originalName}</Text>
              {/* Badge pour identifier si uploadé par un client */}
              {isClientDocument && (
                <View style={styles.clientBadge}>
                  <MaterialIcons name="person" size={12} color="#FFFFFF" />
                  <Text style={styles.clientBadgeText}>Client</Text>
                </View>
              )}
            </View>
            <Text style={styles.documentDetails}>
              {item.category} • {formattedSize} • {uploadDate}
            </Text>
            {showChantierInfo && (
              <Text style={styles.chantierInfo}>
                Chantier: {showChantierInfo}
              </Text>
            )}
            {item.description && (
              <Text style={styles.documentDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.documentActions}>
          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteDocument(item)}
          >
            <MaterialIcons name="delete-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const documentCategories = [
    { label: 'Toutes les catégories', value: 'all' },
    { label: 'Contrats', value: 'contract' },
    { label: 'Plans', value: 'plan' },
    { label: 'Factures', value: 'invoice' },
    { label: 'Autorisations', value: 'permit' },
    { label: 'Photos', value: 'photo' },
    { label: 'Rapports', value: 'report' },
    { label: 'Autres', value: 'other' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gestion des Documents</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowUploadModal(true)}
            disabled={!selectedChantier}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Chantier Selection */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Chantier</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, !selectedChantier && styles.filterChipActive]}
                onPress={() => setSelectedChantier('')}
              >
                <Text style={[styles.filterChipText, !selectedChantier && styles.filterChipTextActive]}>
                  Tous
                </Text>
              </TouchableOpacity>
              {chefChantiers.map(chantier => (
                <TouchableOpacity
                  key={chantier.id}
                  style={[styles.filterChip, selectedChantier === chantier.id && styles.filterChipActive]}
                  onPress={() => setSelectedChantier(chantier.id)}
                >
                  <Text style={[styles.filterChipText, selectedChantier === chantier.id && styles.filterChipTextActive]}>
                    {chantier.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {documentCategories.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.filterChip, selectedCategory === cat.value && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(cat.value as any)}
                >
                  <Text style={[styles.filterChipText, selectedCategory === cat.value && styles.filterChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {totalDocuments}
            </Text>
            <Text style={styles.statLabel}>Total documents</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {filteredDocuments().filter(d => d.uploadedBy?.startsWith('CLI')).length}
            </Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {filteredDocuments().filter(d => !d.uploadedBy?.startsWith('CLI')).length}
            </Text>
            <Text style={styles.statLabel}>Équipe</Text>
          </View>
        </View>

        {/* Documents List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {(() => {
            const isLoading = loading || documentsLoading;
            const filteredCount = filteredDocuments().length;
            console.log('🎯 ChefDocuments: Render state', {
              loading,
              documentsLoading,
              isLoading,
              filteredCount,
              selectedChantier,
              chefChantiersCount: chefChantiers.length
            });
            return isLoading;
          })() ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2B2E83" />
              <Text style={styles.loadingText}>Chargement des documents...</Text>
            </View>
          ) : !selectedChantier ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="home-work" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>Aucun chantier disponible</Text>
              <Text style={styles.emptySubtext}>
                Les documents apparaîtront ici une fois le chantier assigné
              </Text>
            </View>
          ) : filteredDocuments().length > 0 ? (
            <FlatList
              data={filteredDocuments()}
              renderItem={renderDocument}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.documentsContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="description" size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>Aucun document trouvé</Text>
              <Text style={styles.emptySubtext}>
                {selectedChantier
                  ? 'Aucun document pour ce chantier'
                  : 'Sélectionnez un chantier pour commencer'
                }
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Upload Modal */}
        <DocumentUploadModal
          visible={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadDocument}
          uploading={uploading}
          userRole="chef"
          availableClients={availableClients}
        />

        {/* Debug Info - Remove in production */}
        {__DEV__ && (
          <View style={{ position: 'absolute', bottom: 100, left: 20, backgroundColor: '#000', padding: 10, borderRadius: 5 }}>
            <Text style={{ color: '#fff', fontSize: 10 }}>
              Debug: {availableClients.length} clients disponibles
            </Text>
          </View>
        )}
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
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_700Bold',
  },
  addButton: {
    backgroundColor: '#E96C2E',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 6,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#2B2E83',
    fontFamily: 'FiraSans_400Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    color: '#2B2E83',
    fontFamily: 'FiraSans_700Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  documentsContainer: {
    padding: 20,
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
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  documentTitleRow: {
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
  clientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  clientBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'FiraSans_600SemiBold',
    marginLeft: 2,
  },
  documentDetails: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    marginBottom: 4,
  },
  chantierInfo: {
    fontSize: 12,
    color: '#E96C2E',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'FiraSans_400Regular',
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'FiraSans_400Regular',
    textAlign: 'center',
  },
});