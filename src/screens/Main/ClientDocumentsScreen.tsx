import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useClientChantier } from '../../hooks/useClientChantier';
import { useClientDocuments } from '../../hooks/useDocuments';
import { useClientAuth } from '../../hooks/useClientAuth';
import type { DocumentCategory, DocumentVisibility, FirebaseDocument } from '../../types/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDocuments'>;

export default function ClientDocumentsScreen({ navigation }: Props) {
  const { session } = useClientAuth();
  const { chantier, hasChantier, name: chantierName } = useClientChantier();

  // Get documents using the hook (read-only for clients)
  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    formatFileSize,
    getDocumentIcon,
    totalDocuments,
    documentsByCategory,
    clearError
  } = useClientDocuments(chantier?.id || '');

  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');

  const filteredDocuments = () => {
    if (selectedCategory === 'all') {
      return documents;
    }
    return documents.filter(doc => doc.category === selectedCategory);
  };

  const renderDocument = ({ item }: { item: FirebaseDocument }) => {
    const iconName = getDocumentIcon(item.mimeType);
    const formattedSize = formatFileSize(item.size);
    const uploadDate = item.uploadedAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue';

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
            <Text style={styles.documentName}>{item.originalName}</Text>
            <Text style={styles.documentDetails}>
              {getCategoryLabel(item.category)} • {formattedSize} • {uploadDate}
            </Text>
            {item.description && (
              <Text style={styles.documentDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        {/* Document Actions */}
        <View style={styles.documentActions}>
          <View style={[
            styles.visibilityBadge,
            item.visibility === 'both' ? styles.visibilityBothBadge : styles.visibilityClientBadge
          ]}>
            <MaterialIcons
              name={item.visibility === 'both' ? 'visibility' : 'visibility-off'}
              size={12}
              color={item.visibility === 'both' ? '#4CAF50' : '#FF9800'}
            />
            <Text style={[
              styles.visibilityText,
              item.visibility === 'both' ? styles.visibilityBothText : styles.visibilityClientText
            ]}>
              {item.visibility === 'both' ? 'Visible par tous' : 'Client seulement'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const getCategoryLabel = (category: DocumentCategory): string => {
    const labels: Record<DocumentCategory, string> = {
      'contract': 'Contrat',
      'plan': 'Plan',
      'invoice': 'Facture',
      'permit': 'Autorisation',
      'photo': 'Photo',
      'report': 'Rapport',
      'other': 'Autre'
    };
    return labels[category] || category;
  };

  const documentCategories = [
    { label: 'Tous', value: 'all' as const },
    { label: 'Contrats', value: 'contract' as const },
    { label: 'Plans', value: 'plan' as const },
    { label: 'Factures', value: 'invoice' as const },
    { label: 'Autorisations', value: 'permit' as const },
    { label: 'Photos', value: 'photo' as const },
    { label: 'Rapports', value: 'report' as const },
    { label: 'Autres', value: 'other' as const },
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
          <View style={styles.headerSpacer} />
        </View>

        {/* Project Info */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{chantierName}</Text>
          <Text style={styles.documentCount}>
            {totalDocuments} document{totalDocuments !== 1 ? 's' : ''}
          </Text>
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
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCategory === cat.value && styles.filterChipTextActive
                ]}>
                  {cat.label}
                  {cat.value !== 'all' && documentsByCategory[cat.value as DocumentCategory] && (
                    <Text> ({documentsByCategory[cat.value as DocumentCategory]?.length || 0})</Text>
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Error Banner */}
        {documentsError && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error" size={20} color="#F44336" />
            <Text style={styles.errorBannerText}>{documentsError}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorBannerClose}>
              <MaterialIcons name="close" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}

        {/* Documents List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {documentsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2B2E83" />
              <Text style={styles.loadingText}>Chargement des documents...</Text>
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
              <Text style={styles.emptyText}>
                {selectedCategory === 'all' ? 'Aucun document' : `Aucun document de type "${getCategoryLabel(selectedCategory as DocumentCategory)}"`}
              </Text>
              <Text style={styles.emptySubtext}>
                Les documents vous seront transmis par l'équipe de construction
              </Text>
            </View>
          )}
        </ScrollView>
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
  headerSpacer: {
    width: 40,
  },
  headerRight: {
    width: 40,
  },
  projectInfo: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  projectName: {
    fontSize: 18,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
  },
  documentCount: {
    fontSize: 14,
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
  content: {
    flex: 1,
  },
  documentsContainer: {
    paddingHorizontal: 20,
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
  documentName: {
    fontSize: 16,
    color: '#2B2E83',
    fontFamily: 'FiraSans_600SemiBold',
    marginBottom: 4,
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
  deleteButton: {
    padding: 8,
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 40,
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