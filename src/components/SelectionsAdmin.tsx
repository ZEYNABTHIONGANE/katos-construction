import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';

import { useSelections, useSelectionsStats } from '../hooks/useSelections';
import { reviewSelection } from '../services/selections';
import { Selection } from '../types/selection';

interface SelectionsAdminProps {
  projectId: string;
  chefUserId: string;
}

export default function SelectionsAdmin({ projectId, chefUserId }: SelectionsAdminProps) {
  const { selections, loading } = useSelections(projectId);
  const { stats } = useSelectionsStats(projectId);

  // États pour la review
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'validated' | 'rejected'>('pending');

  // Filtrer les sélections selon le statut sélectionné
  const filteredSelections = selectedFilter === 'all'
    ? selections
    : selections.filter(s => s.status === selectedFilter);

  // Gérer la validation/rejet
  const handleReview = async (selection: Selection, status: 'validated' | 'rejected') => {
    setReviewingId(selection.id);

    try {
      await reviewSelection(projectId, selection.id, {
        status,
        reviewedBy: chefUserId,
        reviewNote: reviewNote.trim() || undefined,
        estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
        statusUpdatedAt: new Date(),
      });

      Alert.alert(
        'Succès',
        `Sélection ${status === 'validated' ? 'validée' : 'rejetée'} avec succès`
      );

      // Reset des champs
      setReviewNote('');
      setEstimatedPrice('');

    } catch (error) {
      console.error('❌ Erreur review:', error);
      Alert.alert('Erreur', 'Impossible de traiter la sélection');
    } finally {
      setReviewingId(null);
    }
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D3E" />
        <Text style={styles.loadingText}>Chargement des sélections...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👔 Interface Chef de Projet</Text>
        <Text style={styles.headerSubtitle}>
          Validez ou rejetez les sélections clients
        </Text>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.validated}</Text>
          <Text style={styles.statLabel}>Validées</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Rejetées</Text>
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'pending', label: 'En attente', count: stats.pending },
            { key: 'all', label: 'Toutes', count: stats.total },
            { key: 'validated', label: 'Validées', count: stats.validated },
            { key: 'rejected', label: 'Rejetées', count: stats.rejected },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des sélections */}
      {filteredSelections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>
            {selectedFilter === 'pending'
              ? 'Aucune sélection en attente'
              : `Aucune sélection ${selectedFilter === 'validated' ? 'validée' : selectedFilter === 'rejected' ? 'rejetée' : ''}`
            }
          </Text>
          <Text style={styles.emptyText}>
            Les nouvelles sélections clients apparaîtront ici
          </Text>
        </View>
      ) : (
        filteredSelections.map((selection) => (
          <View key={selection.id} style={styles.selectionCard}>
            <View style={styles.selectionHeader}>
              <View style={styles.selectionInfo}>
                <Text style={styles.categoryText}>
                  {getCategoryIcon(selection.category)} {selection.category}
                </Text>
                <Text style={styles.selectionName}>{selection.label}</Text>
                {selection.note && (
                  <Text style={styles.clientNote}>Client: "{selection.note}"</Text>
                )}
              </View>
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

            {/* Détails de la sélection */}
            <View style={styles.selectionDetails}>
              {selection.quantity && (
                <Text style={styles.detailText}>
                  Quantité: {selection.quantity} {selection.unit || 'unité(s)'}
                </Text>
              )}
              {selection.estimatedPrice && (
                <Text style={styles.priceText}>
                  Prix estimé: {selection.estimatedPrice}€
                  {selection.unit && ` / ${selection.unit}`}
                </Text>
              )}
              <Text style={styles.dateText}>
                Sélectionné le {selection.createdAt.toLocaleDateString('fr-FR')}
              </Text>
            </View>

            {/* Interface de review pour les sélections en attente */}
            {selection.status === 'pending' && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewTitle}>Actions Chef :</Text>

                <TextInput
                  style={styles.reviewInput}
                  placeholder="Note de validation/rejet (facultative)"
                  value={reviewNote}
                  onChangeText={setReviewNote}
                  multiline
                  maxLength={200}
                />

                <TextInput
                  style={styles.priceInput}
                  placeholder="Prix estimé (€)"
                  value={estimatedPrice}
                  onChangeText={setEstimatedPrice}
                  keyboardType="numeric"
                />

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReview(selection, 'rejected')}
                    disabled={reviewingId === selection.id}
                  >
                    {reviewingId === selection.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.actionButtonText}>❌ Rejeter</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.validateButton]}
                    onPress={() => handleReview(selection, 'validated')}
                    disabled={reviewingId === selection.id}
                  >
                    {reviewingId === selection.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.actionButtonText}>✅ Valider</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Affichage de la review existante */}
            {selection.reviewNote && (
              <View style={styles.existingReview}>
                <Text style={styles.reviewLabel}>Note du chef:</Text>
                <Text style={styles.reviewText}>"{selection.reviewNote}"</Text>
                {selection.statusUpdatedAt && (
                  <Text style={styles.reviewDate}>
                    Le {selection.statusUpdatedAt.toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E7D3E',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
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
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#2E7D3E',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
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
  },
  selectionCard: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  selectionInfo: {
    flex: 1,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  selectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientNote: {
    fontSize: 13,
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: 'white',
    fontWeight: 'bold',
  },
  selectionDetails: {
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 13,
    color: '#2E7D3E',
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  reviewSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: 'white',
    marginBottom: 10,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF6B35',
  },
  validateButton: {
    backgroundColor: '#2E7D3E',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  existingReview: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 13,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 11,
    color: '#666',
  },
});