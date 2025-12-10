import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { NotificationBadge } from '../../components/ui/NotificationBadge';
import {
  mobileDocumentService,
  type UnifiedDocument,
  type DocumentNotification,
  type DocumentCategory
} from '../../services/mobileDocumentService';
import { useAuthContext } from '../../context/AuthContext';

export const ClientDocumentsScreenV2: React.FC = () => {
  const { user } = useAuthContext();
  const [documents, setDocuments] = useState<UnifiedDocument[]>([]);
  const [notifications, setNotifications] = useState<DocumentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.clientId) {
      loadDocuments();
      loadNotifications();
    }
  }, [user?.clientId]);

  const loadDocuments = async () => {
    if (!user?.clientId) return;

    try {
      setError(null);
      const docs = await mobileDocumentService.getClientDocuments(user.clientId);
      setDocuments(docs);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setError('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!user?.clientId) return;

    try {
      const notifs = await mobileDocumentService.getDocumentNotifications(user.clientId);
      setNotifications(notifs);
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDocuments(), loadNotifications()]);
    setRefreshing(false);
  };

  const getDocumentsByCategory = async () => {
    if (!user?.clientId) return {};
    return await mobileDocumentService.getDocumentsByCategory(user.clientId);
  };

  const getFilteredDocuments = () => {
    if (selectedCategory === 'all') {
      return documents;
    }
    return documents.filter(doc => doc.type === selectedCategory);
  };

  const getCategories = (): DocumentCategory[] => {
    const categories: DocumentCategory[] = [
      {
        id: 'all',
        name: 'Tous',
        icon: '📁',
        color: '#6B7280',
        count: documents.length,
        hasUnread: notifications.some(n => !n.isRead)
      }
    ];

    // Compter les documents par catégorie
    const categoryCounts: Record<string, number> = {};
    documents.forEach(doc => {
      categoryCounts[doc.type] = (categoryCounts[doc.type] || 0) + 1;
    });

    // Ajouter les catégories avec des documents
    const categoryMap = {
      contract: { name: 'Contrats', icon: '📄', color: '#10B981' },
      invoice: { name: 'Factures', icon: '🧾', color: '#F59E0B' },
      plan: { name: 'Plans', icon: '📋', color: '#3B82F6' },
      photo: { name: 'Photos', icon: '📷', color: '#8B5CF6' },
      report: { name: 'Rapports', icon: '📊', color: '#F97316' },
      permit: { name: 'Permis', icon: '🔖', color: '#EF4444' },
      progress_update: { name: 'Suivi', icon: '📈', color: '#6366F1' },
      other: { name: 'Autres', icon: '📎', color: '#6B7280' }
    };

    Object.entries(categoryCounts).forEach(([type, count]) => {
      const categoryInfo = categoryMap[type as keyof typeof categoryMap];
      if (categoryInfo && count > 0) {
        categories.push({
          id: type,
          name: categoryInfo.name,
          icon: categoryInfo.icon,
          color: categoryInfo.color,
          count
        });
      }
    });

    return categories;
  };

  const handleDocumentPress = (document: UnifiedDocument) => {
    if (mobileDocumentService.canDownloadDocument(document)) {
      // Ouvrir ou télécharger le document
      handleViewDocument(document);
    } else {
      Alert.alert(
        'Document non disponible',
        'Ce document ne peut pas être téléchargé pour le moment.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleViewDocument = (document: UnifiedDocument) => {
    // TODO: Implémenter l'ouverture du document
    console.log('Ouvrir document:', document.url);
  };

  const handleDownloadDocument = (document: UnifiedDocument) => {
    if (!mobileDocumentService.canDownloadDocument(document)) {
      Alert.alert(
        'Téléchargement non autorisé',
        'Ce document ne peut pas être téléchargé.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // TODO: Implémenter le téléchargement
    console.log('Télécharger document:', document.url);
  };

  const handleMarkNotificationsAsRead = async () => {
    if (!user?.clientId) return;

    try {
      await mobileDocumentService.markAllNotificationsAsRead(user.clientId);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Erreur lors du marquage des notifications:', err);
    }
  };

  const renderDocumentItem = ({ item: document }: { item: UnifiedDocument }) => {
    const isReadOnly = mobileDocumentService.isDocumentReadOnly(document);
    const canDownload = mobileDocumentService.canDownloadDocument(document);
    const isNew = new Date().getTime() - document.uploadedAt.toDate().getTime() < 7 * 24 * 60 * 60 * 1000;

    return (
      <TouchableOpacity
        style={styles.documentCard}
        onPress={() => handleDocumentPress(document)}
        activeOpacity={0.7}
      >
        <Card style={styles.documentCardContent}>
          <View style={styles.documentHeader}>
            <View style={styles.documentIcon}>
              <Text style={styles.documentEmoji}>
                {mobileDocumentService.getDocumentIcon(document.type)}
              </Text>
            </View>

            <View style={styles.documentInfo}>
              <View style={styles.documentTitleRow}>
                <Text style={styles.documentTitle} numberOfLines={1}>
                  {document.name}
                </Text>
                {isNew && <View style={styles.newBadge} />}
              </View>

              <View style={styles.documentMeta}>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: mobileDocumentService.getDocumentColor(document.type) + '20' }
                ]}>
                  <Text style={[
                    styles.typeText,
                    { color: mobileDocumentService.getDocumentColor(document.type) }
                  ]}>
                    {mobileDocumentService.getCategoryDisplayName(document.type)}
                  </Text>
                </View>

                <Text style={styles.documentSize}>
                  {mobileDocumentService.formatFileSize(document.size)}
                </Text>
              </View>

              {document.description && (
                <Text style={styles.documentDescription} numberOfLines={2}>
                  {document.description}
                </Text>
              )}

              <View style={styles.documentFooter}>
                <Text style={styles.documentDate}>
                  {document.source === 'admin_upload' ? 'Reçu' : 'Envoyé'} {' '}
                  {mobileDocumentService.formatDate(document.uploadedAt)}
                </Text>

                <View style={styles.documentTags}>
                  {isReadOnly && (
                    <View style={styles.readOnlyTag}>
                      <Ionicons name="lock-closed" size={12} color="#6B7280" />
                      <Text style={styles.tagText}>Lecture seule</Text>
                    </View>
                  )}

                  {document.source === 'admin_upload' && (
                    <View style={styles.officialTag}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={[styles.tagText, { color: '#10B981' }]}>Officiel</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.documentActions}>
              {canDownload ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDownloadDocument(document)}
                >
                  <Ionicons name="download-outline" size={20} color="#3B82F6" />
                </TouchableOpacity>
              ) : (
                <View style={styles.disabledButton}>
                  <Ionicons name="download-outline" size={20} color="#D1D5DB" />
                </View>
              )}

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderCategoryItem = ({ item: category }: { item: DocumentCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        selectedCategory === category.id && styles.selectedCategoryCard
      ]}
      onPress={() => setSelectedCategory(category.id)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryContent}>
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <View style={styles.categoryInfo}>
          <Text style={[
            styles.categoryName,
            selectedCategory === category.id && styles.selectedCategoryText
          ]}>
            {category.name}
          </Text>
          <Text style={styles.categoryCount}>
            {category.count} document{category.count !== 1 ? 's' : ''}
          </Text>
        </View>
        {category.hasUnread && <NotificationBadge />}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="folder-open-outline"
      title="Aucun document"
      description={
        selectedCategory === 'all'
          ? "Vous n'avez pas encore reçu de documents."
          : `Aucun document dans la catégorie "${getCategories().find(c => c.id === selectedCategory)?.name}".`
      }
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Chargement des documents...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <EmptyState
          icon="alert-circle-outline"
          title="Erreur de chargement"
          description={error}
          actionText="Réessayer"
          onAction={loadDocuments}
        />
      </SafeAreaView>
    );
  }

  const filteredDocuments = getFilteredDocuments();
  const categories = getCategories();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mes documents</Text>
          <Text style={styles.headerSubtitle}>
            {documents.length} document{documents.length !== 1 ? 's' : ''} disponible{documents.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleMarkNotificationsAsRead}
          >
            <Ionicons name="notifications" size={24} color="#3B82F6" />
            <NotificationBadge count={unreadCount} />
          </TouchableOpacity>
        )}
      </View>

      {/* Info sur les restrictions */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          Les documents sont envoyés par votre équipe projet et sont en lecture seule.
        </Text>
      </View>

      {/* Catégories */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
          contentContainerStyle={styles.categoriesListContent}
        />
      </View>

      {/* Documents */}
      <FlatList
        data={filteredDocuments}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id!}
        style={styles.documentsList}
        contentContainerStyle={styles.documentsListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
  categoriesSection: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesList: {
    paddingVertical: 8,
  },
  categoriesListContent: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    marginRight: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryCard: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minWidth: 120,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedCategoryText: {
    color: '#1E40AF',
  },
  categoryCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  documentsList: {
    flex: 1,
  },
  documentsListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  documentCard: {
    marginBottom: 12,
  },
  documentCardContent: {
    padding: 16,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentEmoji: {
    fontSize: 24,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  newBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: 8,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  documentSize: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  documentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  documentTags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readOnlyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginLeft: 8,
  },
  officialTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    marginLeft: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 2,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  disabledButton: {
    padding: 8,
    marginLeft: 4,
    opacity: 0.5,
  },
});

export default ClientDocumentsScreenV2;