import { useState, useEffect, useCallback } from 'react';
import { invitationService } from '../services/invitationService';
import { clientService } from '../services/clientService';
import type { FirebaseInvitation, FirebaseClient } from '../types/firebase';
import { useAuth } from './useAuth';

interface InvitationWithClient extends FirebaseInvitation {
  client?: FirebaseClient;
}

export const useInvitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<InvitationWithClient[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<InvitationWithClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les invitations pour l'utilisateur connecté
  const loadUserInvitations = useCallback(async () => {
    if (!user?.email) return;

    if (!loading) setLoading(true);
    setError(null);

    try {
      const userInvitations = await invitationService.getInvitationsByEmail(user.email);

      // Enrichir les invitations avec les données client
      const enrichedInvitations = await Promise.all(
        userInvitations.map(async (invitation) => {
          const client = await clientService.getClientById(invitation.clientId);
          return {
            ...invitation,
            client
          };
        })
      );

      setInvitations(enrichedInvitations);

      // Filtrer les invitations en attente
      const pending = enrichedInvitations.filter(
        inv => inv.status === 'pending' && inv.expiresAt.toDate() > new Date()
      );
      setPendingInvitations(pending);
    } catch (err) {
      console.error('Erreur lors du chargement des invitations:', err);
      setError('Impossible de charger les invitations');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Valider une invitation par token
  const validateInvitation = useCallback(async (token: string) => {
    if (!loading) setLoading(true);
    setError(null);

    try {
      const validation = await invitationService.validateInvitation(token);

      if (validation.isValid && validation.invitation) {
        const client = await clientService.getClientById(validation.invitation.clientId);
        return {
          isValid: true,
          invitation: {
            ...validation.invitation,
            client
          }
        };
      }

      return {
        isValid: false,
        reason: validation.reason
      };
    } catch (err) {
      console.error('Erreur lors de la validation:', err);
      setError('Erreur lors de la validation de l\'invitation');
      return {
        isValid: false,
        reason: 'Erreur de validation'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Accepter une invitation
  const acceptInvitation = useCallback(async (token: string) => {
    if (!user?.uid) {
      setError('Utilisateur non connecté');
      return { success: false, reason: 'Utilisateur non connecté' };
    }

    if (!loading) setLoading(true);
    setError(null);

    try {
      const result = await invitationService.acceptInvitation(token, user.uid);

      if (result.success) {
        // Recharger les invitations après acceptation
        await loadUserInvitations();
      } else {
        setError(result.reason || 'Erreur lors de l\'acceptation');
      }

      return result;
    } catch (err) {
      console.error('Erreur lors de l\'acceptation:', err);
      const errorMessage = 'Erreur lors de l\'acceptation de l\'invitation';
      setError(errorMessage);
      return { success: false, reason: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.uid, loadUserInvitations]);

  // Décliner une invitation
  const declineInvitation = useCallback(async (token: string) => {
    if (!loading) setLoading(true);
    setError(null);

    try {
      const success = await invitationService.declineInvitation(token);

      if (success) {
        // Recharger les invitations après déclinaison
        await loadUserInvitations();
        return { success: true };
      } else {
        setError('Erreur lors du refus de l\'invitation');
        return { success: false, reason: 'Erreur lors du refus' };
      }
    } catch (err) {
      console.error('Erreur lors du refus:', err);
      const errorMessage = 'Erreur lors du refus de l\'invitation';
      setError(errorMessage);
      return { success: false, reason: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadUserInvitations]);

  // Récupérer le client associé à l'utilisateur
  const getUserClient = useCallback(async () => {
    if (!user?.uid) return null;

    try {
      return await clientService.getClientByUserId(user.uid);
    } catch (err) {
      console.error('Erreur lors de la récupération du client:', err);
      return null;
    }
  }, [user?.uid]);

  // Charger les invitations au montage du composant
  useEffect(() => {
    if (user?.email) {
      loadUserInvitations();
    }
  }, [user?.email, loadUserInvitations]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = invitationService.subscribeToUserInvitations(
      user.email,
      async (newInvitations) => {
        // Enrichir les nouvelles invitations avec les données client
        const enrichedInvitations = await Promise.all(
          newInvitations.map(async (invitation) => {
            const client = await clientService.getClientById(invitation.clientId);
            return {
              ...invitation,
              client
            };
          })
        );

        setInvitations(enrichedInvitations);

        // Mettre à jour les invitations en attente
        const pending = enrichedInvitations.filter(
          inv => inv.status === 'pending' && inv.expiresAt.toDate() > new Date()
        );
        setPendingInvitations(pending);
      }
    );

    return unsubscribe;
  }, [user?.email]);

  return {
    invitations,
    pendingInvitations,
    loading,
    error,
    validateInvitation,
    acceptInvitation,
    declineInvitation,
    getUserClient,
    refreshInvitations: loadUserInvitations
  };
};