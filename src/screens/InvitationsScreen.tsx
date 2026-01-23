import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useInvitations } from '../hooks/useInvitations';
import { InvitationCard } from '../components/InvitationCard';

export const InvitationsScreen: React.FC = () => {
  const {
    invitations,
    pendingInvitations,
    loading,
    error,
    acceptInvitation,
    declineInvitation,
    refreshInvitations
  } = useInvitations();

  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleAcceptInvitation = async (token: string) => {
    setActionLoading(true);
    try {
      const result = await acceptInvitation(token);
      if (result.success) {
        Alert.alert(
          'Invitation acceptée',
          'Vous avez accepté l\'invitation avec succès. Vous pouvez maintenant accéder aux informations de votre projet.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erreur',
          result.reason || 'Impossible d\'accepter l\'invitation',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'acceptation de l\'invitation',
        [{ text: 'OK' }]
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvitation = async (token: string) => {
    setActionLoading(true);
    try {
      const result = await declineInvitation(token);
      if (result.success) {
        Alert.alert(
          'Invitation déclinée',
          'Vous avez décliné l\'invitation.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erreur',
          result.reason || 'Impossible de décliner l\'invitation',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors du refus de l\'invitation',
        [{ text: 'OK' }]
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshInvitations();
    } finally {
      setRefreshing(false);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Aucune invitation</Text>
      <Text style={styles.emptySubtitle}>
        Vous n'avez reçu aucune invitation pour le moment.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.refreshButtonText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPendingInvitations = () => {
    if (pendingInvitations.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Invitations en attente ({pendingInvitations.length})
        </Text>
        {pendingInvitations.map((invitation) => (
          <InvitationCard
            key={invitation.id}
            invitation={invitation}
            onAccept={handleAcceptInvitation}
            onDecline={handleDeclineInvitation}
            loading={actionLoading}
          />
        ))}
      </View>
    );
  };

  const renderAllInvitations = () => {
    const otherInvitations = invitations.filter(
      inv => inv.status !== 'pending' || inv.expiresAt.toDate() < new Date()
    );

    if (otherInvitations.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Historique des invitations ({otherInvitations.length})
        </Text>
        {otherInvitations.map((invitation) => (
          <InvitationCard
            key={invitation.id}
            invitation={invitation}
            onAccept={handleAcceptInvitation}
            onDecline={handleDeclineInvitation}
            loading={actionLoading}
          />
        ))}
      </View>
    );
  };

  if (loading && invitations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des invitations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <View>
            {renderPendingInvitations()}
            {renderAllInvitations()}
          </View>
        )}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});