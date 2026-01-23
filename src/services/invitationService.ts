import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FirebaseInvitation, FirebaseClient } from '../types/firebase';
import { clientService } from './clientService';

export class InvitationService {
  private collectionName = 'invitations';

  // Récupérer une invitation par token
  async getInvitationByToken(token: string): Promise<FirebaseInvitation | null> {
    const invitationRef = collection(db, this.collectionName);
    const q = query(invitationRef, where('token', '==', token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as FirebaseInvitation;
  }

  // Valider une invitation (vérifier si elle existe et n'est pas expirée)
  async validateInvitation(token: string): Promise<{ isValid: boolean; invitation?: FirebaseInvitation; reason?: string }> {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      return { isValid: false, reason: 'Invitation non trouvée' };
    }

    if (invitation.status === 'accepted') {
      return { isValid: false, reason: 'Invitation déjà acceptée' };
    }

    if (invitation.status === 'expired' || invitation.expiresAt.toDate() < new Date()) {
      return { isValid: false, reason: 'Invitation expirée' };
    }

    return { isValid: true, invitation };
  }

  // Accepter une invitation
  async acceptInvitation(token: string, userId: string): Promise<{ success: boolean; clientId?: string; clientData?: any; reason?: string }> {
    const validation = await this.validateInvitation(token);

    if (!validation.isValid || !validation.invitation) {
      return { success: false, reason: validation.reason };
    }

    const invitation = validation.invitation;

    try {
      // Mettre à jour l'invitation
      if (invitation.id) {
        const invitationRef = doc(db, this.collectionName, invitation.id);
        await updateDoc(invitationRef, {
          status: 'accepted',
          acceptedAt: Timestamp.now()
        });
      }

      // Mettre à jour le client avec l'ID utilisateur
      await clientService.updateClient(invitation.clientId, {
        invitationStatus: 'accepted',
        userId: userId,
        acceptedAt: Timestamp.now()
      });

      // Récupérer les données complètes du client
      const clientData = await clientService.getClientById(invitation.clientId);

      return {
        success: true,
        clientId: invitation.clientId,
        clientData
      };
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
      return { success: false, reason: 'Erreur lors de l\'acceptation' };
    }
  }

  // Authentification par token d'invitation
  async authenticateWithToken(token: string): Promise<{ success: boolean; clientData?: any; reason?: string }> {
    try {
      // Générer un ID utilisateur unique pour cette session mobile
      const mobileUserId = `mobile_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const result = await this.acceptInvitation(token, mobileUserId);

      if (result.success) {
        return {
          success: true,
          clientData: result.clientData
        };
      } else {
        return {
          success: false,
          reason: result.reason
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      return {
        success: false,
        reason: 'Erreur lors de l\'authentification'
      };
    }
  }

  // Décliner une invitation
  async declineInvitation(token: string): Promise<boolean> {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation || !invitation.id) {
      return false;
    }

    try {
      // Mettre à jour l'invitation
      const invitationRef = doc(db, this.collectionName, invitation.id);
      await updateDoc(invitationRef, {
        status: 'declined'
      });

      // Mettre à jour le client
      await clientService.updateClient(invitation.clientId, {
        invitationStatus: 'declined'
      });

      return true;
    } catch (error) {
      console.error('Erreur lors du refus de l\'invitation:', error);
      return false;
    }
  }

  // Récupérer les invitations d'un email
  async getInvitationsByEmail(email: string): Promise<FirebaseInvitation[]> {
    const invitationRef = collection(db, this.collectionName);
    const q = query(
      invitationRef,
      where('email', '==', email),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseInvitation));
  }

  // Récupérer les invitations en attente pour un email
  async getPendingInvitations(email: string): Promise<FirebaseInvitation[]> {
    const invitationRef = collection(db, this.collectionName);
    const q = query(
      invitationRef,
      where('email', '==', email),
      where('status', '==', 'pending'),
      where('expiresAt', '>', Timestamp.now()),
      orderBy('expiresAt', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseInvitation));
  }

  // Récupérer les informations du client associé à une invitation
  async getClientFromInvitation(token: string): Promise<FirebaseClient | null> {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      return null;
    }

    return await clientService.getClientById(invitation.clientId);
  }

  // Écouter les invitations en temps réel pour un email
  subscribeToUserInvitations(email: string, callback: (invitations: FirebaseInvitation[]) => void): () => void {
    const invitationRef = collection(db, this.collectionName);
    const q = query(
      invitationRef,
      where('email', '==', email),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const invitations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseInvitation));
      callback(invitations);
    });
  }
}

export const invitationService = new InvitationService();