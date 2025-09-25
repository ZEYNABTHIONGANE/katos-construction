import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { AppTabsParamList } from '../navigation/RootNavigator';
import { useSessionStore } from '../store/session';
import { useSelections, useSelectionsStats } from '../hooks/useSelections';
import { useCatalog, useCatalogCategories } from '../hooks/useCatalog';
import { createSelection, isItemSelected } from '../services/selections';
import { CatalogItem } from '../types/catalog';
import { Selection } from '../types/selection';
import SelectionsAdmin from '../components/SelectionsAdmin';

type Props = BottomTabScreenProps<AppTabsParamList, 'Selections'>;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'validated': return '#2E7D3E';
    case 'rejected': return '#FF6B35';
    case 'pending': return '#4A90E2';
    default: return '#9B9B9B';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'validated': return '✅ Validé';
    case 'rejected': return '❌ Rejeté';
    case 'pending': return '⏳ En attente';
    default: return '➖ Aucune';
  }
};

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: string } = {
    'paint': '🎨',
    'tiles': '🏺',
    'flooring': '🪵',
    'fixtures': '🚿',
    'lighting': '💡',
    'hardware': '⚡',
    'materials': '🚪',
  };
  return icons[category] || '📦';
};

export default function SelectionsScreen({ }: Props) {
  const { appUser, firebaseUser } = useSessionStore();
  const projectId = appUser?.projectId;

  // États pour les modals
  const [catalogVisible, setCatalogVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectionNote, setSelectionNote] = useState('');
  const [selecting, setSelecting] = useState(false);

  // Hooks pour les données
  const { selections, loading: selectionsLoading, error: selectionsError } = useSelections(projectId);
  const { stats, loading: statsLoading, error: statsError } = useSelectionsStats(projectId);
  const { categories, loading: categoriesLoading, error: categoriesError } = useCatalogCategories();
  const {
    items: catalogItems,
    loading: catalogLoading,
    error: catalogError,
    refetch: refetchCatalog,
  } = useCatalog({
    category: selectedCategory as any || undefined,
  });

  // Ouvrir le catalogue pour une catégorie
  const openCatalog = (category: string) => {
    setSelectedCategory(category);
    setCatalogVisible(true);
  };

  // Fermer le catalogue
  const closeCatalog = () => {
    setCatalogVisible(false);
    setSelectedCategory(null);
    setSelectionNote('');
  };

  // Sélectionner un élément du catalogue
  const selectItem = async (item: CatalogItem) => {
    if (!projectId || !firebaseUser) return;

    setSelecting(true);

    try {
      // Vérifier si déjà sélectionné
      const alreadySelected = await isItemSelected(projectId, item.id, item.category);
      if (alreadySelected) {
        Alert.alert('Déjà sélectionné', 'Cet élément est déjà dans vos sélections');
        return;
      }

      // Créer la sélection
      await createSelection(projectId, {
        category: item.category,
        itemId: item.id,
        label: item.label,
        note: selectionNote.trim() || undefined,
        status: 'pending',
        selectedBy: firebaseUser.uid,
        quantity: 1,
        unit: item.priceUnit || 'pièce',
        estimatedPrice: item.basePrice,
        productReference: item.specs?.reference,
      });

      Alert.alert('Succès', 'Élément ajouté à vos sélections');
      closeCatalog();

    } catch (error) {
      console.error('❌ Erreur sélection:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter cette sélection');
    } finally {
      setSelecting(false);
    }
  };

  // Grouper les sélections par catégorie
  const selectionsByCategory = useMemo(() => {
    return selections.reduce((acc, selection) => {
      if (!acc[selection.category]) {
        acc[selection.category] = [];
      }
      acc[selection.category].push(selection);
      return acc;
    }, {} as Record<string, Selection[]>);
  }, [selections]);

  // Afficher l'interface admin si l'utilisateur est chef
  if (appUser?.role === 'chef' && projectId && firebaseUser) {
    return (
      <SelectionsAdmin
        projectId={projectId}
        chefUserId={firebaseUser.uid}
      />
    );
  }

  if (!projectId) {
    return (
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackIcon}>ℹ️</Text>
        <Text style={styles.feedbackTitle}>Aucun projet associé</Text>
        <Text style={styles.feedbackText}>
          Demandez à votre chef de projet de vous associer avant de réaliser des sélections.
        </Text>
      </View>
    );
  }

  if (selectionsLoading && statsLoading && categoriesLoading) {
    return (
      <View style={styles.feedbackContainer}>
        <ActivityIndicator size="large" color="#2E7D3E" />
        <Text style={styles.feedbackText}>Chargement de vos sélections...</Text>
      </View>
    );
  }

  if (selectionsError || statsError || categoriesError) {
    return (
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackIcon}>⚠️</Text>
        <Text style={styles.feedbackTitle}>Impossible de charger les sélections</Text>
        <Text style={styles.feedbackText}>
          {selectionsError || statsError || categoriesError}
        </Text>
      </View>
    );
  }

  const isRefreshing = selectionsLoading || statsLoading || categoriesLoading;

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              refetchCatalog?.();
            }}
            tintColor="#2E7D3E"
            colors={['#2E7D3E']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎯 Sélections de finitions</Text>
          <Text style={styles.headerSubtitle}>
            Choisissez et validez vos finitions avec votre chef de projet
          </Text>
        </View>

        {/* Statistiques temps réel */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.validated}</Text>
            <Text style={styles.statLabel}>Validées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Rejetées</Text>
          </View>
        </View>

        {/* Sections de sélections par catégorie */}
        {categories.map((categoryInfo) => {
          const categorySelections = selectionsByCategory[categoryInfo.category] || [];

          return (
            <View key={categoryInfo.category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(categoryInfo.category)}</Text>
                <Text style={styles.categoryTitle}>{categoryInfo.label}</Text>
                <Text style={styles.categoryCount}>
                  ({categorySelections.length})
                </Text>
              </View>

              {categorySelections.length > 0 ? (
                categorySelections.map((selection) => (
                  <View key={selection.id} style={styles.selectionCard}>
                    <View style={styles.selectionHeader}>
                      <Text style={styles.selectionName}>{selection.label}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(selection.status) }
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getStatusText(selection.status)}
                        </Text>
                      </View>
                    </View>
                    {selection.note && (
                      <Text style={styles.selectionNote}>{selection.note}</Text>
                    )}
                    {selection.reviewNote && (
                      <Text style={styles.reviewNote}>
                        Chef: {selection.reviewNote}
                      </Text>
                    )}
                    {selection.estimatedPrice && (
                      <Text style={styles.priceText}>
                        ~{selection.estimatedPrice}€{selection.unit ? `/${selection.unit}` : ''}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <TouchableOpacity
                  style={styles.addSelectionCard}
                  onPress={() => openCatalog(categoryInfo.category)}
                  accessibilityRole="button"
                  accessibilityLabel={`Choisir un élément pour ${categoryInfo.label}`}
                >
                  <Text style={styles.addSelectionIcon}>➕</Text>
                  <Text style={styles.addSelectionText}>
                    Choisir dans le catalogue
                  </Text>
                  <Text style={styles.availableItems}>
                    {categoryInfo.count} disponible{categoryInfo.count > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Message si aucune catégorie */}
        {categories.length === 0 && (
          <View style={styles.emptyCatalog}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Catalogue en préparation</Text>
            <Text style={styles.emptyText}>
              Le catalogue sera bientôt disponible pour faire vos sélections
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal Catalogue */}
      <Modal
        visible={catalogVisible}
        animationType="slide"
        onRequestClose={closeCatalog}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closeCatalog}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fermer le catalogue"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {getCategoryIcon(selectedCategory || '')} {' '}
              {categories.find(c => c.category === selectedCategory)?.label || 'Catalogue'}
            </Text>
            <View style={styles.closeButton} />
          </View>

          {catalogLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#2E7D3E" />
              <Text style={styles.feedbackText}>Chargement du catalogue...</Text>
            </View>
          ) : (
            <ScrollView style={styles.catalogContent}>
              {catalogItems.map((item) => (
                <View key={item.id} style={styles.catalogItem}>
                  {item.images && item.images[0] && (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.label}</Text>
                    {item.description && (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    )}
                    {item.specs && (
                      <View style={styles.itemSpecs}>
                        {item.specs.brand && <Text style={styles.specText}>Marque: {item.specs.brand}</Text>}
                        {item.specs.color && <Text style={styles.specText}>Couleur: {item.specs.color}</Text>}
                      </View>
                    )}
                    {item.basePrice && (
                      <Text style={styles.itemPrice}>
                        {item.basePrice}€{item.priceUnit ? `/${item.priceUnit}` : ''}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => selectItem(item)}
                    disabled={selecting}
                    accessibilityRole="button"
                    accessibilityLabel={`Sélectionner ${item.label}`}
                  >
                    {selecting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.selectButtonText}>Sélectionner</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}

              {/* Zone pour note facultative */}
              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Note personnelle (facultative) :</Text>
                <TextInput
                  style={styles.noteInput}
                  value={selectionNote}
                  onChangeText={setSelectionNote}
                  placeholder="Ajouter une note pour cette sélection..."
                  multiline
                  maxLength={200}
                />
              </View>
            </ScrollView>
          )}
          {catalogError && (
            <View style={styles.modalError}>
              <Text style={styles.modalErrorText}>{catalogError}</Text>
            </View>
          )}
        </View>
      </Modal>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 20,
    marginBottom: 10,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
  },
  selectionCard: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selectionName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: 'white',
    fontWeight: 'bold',
  },
  selectionNote: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  addSelectionCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  addSelectionIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#2E7D3E',
  },
  addSelectionText: {
    flex: 1,
    fontSize: 15,
    color: '#2E7D3E',
    fontWeight: '500',
  },
  availableItems: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewNote: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 4,
    fontStyle: 'italic',
  },
  priceText: {
    fontSize: 13,
    color: '#2E7D3E',
    fontWeight: '600',
    marginTop: 4,
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
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // État vide catalogue
  emptyCatalog: {
    backgroundColor: 'white',
    margin: 20,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal catalogue
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#2E7D3E',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  catalogContent: {
    flex: 1,
    padding: 15,
  },
  catalogItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  itemSpecs: {
    marginBottom: 8,
  },
  specText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D3E',
  },
  selectButton: {
    backgroundColor: '#2E7D3E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noteSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalError: {
    backgroundColor: '#feeceb',
    margin: 20,
    padding: 16,
    borderRadius: 8,
  },
  modalErrorText: {
    color: '#b3261e',
    textAlign: 'center',
  },
});
