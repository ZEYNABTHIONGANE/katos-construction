import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { FirebaseInvitation, FirebaseClient } from '../types/firebase';

interface InvitationWithClient extends FirebaseInvitation {
  client?: FirebaseClient;
}

interface InvitationCardProps {
  invitation: InvitationWithClient;
  onAccept: (token: string) => Promise<void>;
  onDecline: (token: string) => Promise<void>;
  loading?: boolean;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline,
  loading = false
}) => {
  const isExpired = invitation.expiresAt.toDate() < new Date();
  const isAccepted = invitation.status === 'accepted';
  const isDeclined = invitation.status === 'declined';
  const isPending = invitation.status === 'pending' && !isExpired;

  const handleAccept = () => {
    if (loading) return;

    Alert.alert(
      'Accepter l\'invitation',
      `Voulez-vous accepter l'invitation pour le projet "${invitation.client?.projetAdhere}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          style: 'default',
          onPress: () => onAccept(invitation.token)
        }
      ]
    );
  };

  const handleDecline = () => {
    if (loading) return;

    Alert.alert(
      'Décliner l\'invitation',
      'Êtes-vous sûr de vouloir décliner cette invitation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Décliner',
          style: 'destructive',
          onPress: () => onDecline(invitation.token)
        }
      ]
    );
  };

  const getStatusColor = () => {
    if (isAccepted) return '#4CAF50';
    if (isDeclined) return '#F44336';
    if (isExpired) return '#9E9E9E';
    return '#FF9800';
  };

  const getStatusText = () => {
    if (isAccepted) return 'Acceptée';
    if (isDeclined) return 'Déclinée';
    if (isExpired) return 'Expirée';
    return 'En attente';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invitation Client</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {invitation.client && (
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>
            {invitation.client.prenom} {invitation.client.nom}
          </Text>
          <Text style={styles.projectName}>
            Projet: {invitation.client.projetAdhere}
          </Text>
          <Text style={styles.location}>
            📍 {invitation.client.localisationSite}
          </Text>
          <Text style={styles.projectStatus}>
            Statut: {invitation.client.status}
          </Text>
        </View>
      )}

      <View style={styles.details}>
        <Text style={styles.detailText}>
          Email: {invitation.email}
        </Text>
        <Text style={styles.detailText}>
          Créée le: {invitation.createdAt.toDate().toLocaleDateString('fr-FR')}
        </Text>
        <Text style={styles.detailText}>
          Expire le: {invitation.expiresAt.toDate().toLocaleDateString('fr-FR')}
        </Text>
      </View>

      {isPending && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleAccept}
            disabled={loading}
          >
            <Text style={styles.acceptButtonText}>
              {loading ? 'Traitement...' : 'Accepter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            disabled={loading}
          >
            <Text style={styles.declineButtonText}>
              {loading ? 'Traitement...' : 'Décliner'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isExpired && (
        <View style={styles.expiredMessage}>
          <Text style={styles.expiredText}>
            Cette invitation a expiré
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  clientInfo: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  projectStatus: {
    fontSize: 14,
    color: '#666',
  },
  details: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  declineButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  declineButtonText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 14,
  },
  expiredMessage: {
    backgroundColor: '#ffe0e0',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  expiredText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: '500',
  },
});