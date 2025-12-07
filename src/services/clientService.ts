import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  where,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FirebaseClient } from '../types/firebase';
import { COLLECTIONS } from '../types/firebase';
import { credentialGeneratorService, type GeneratedCredentials } from './credentialGeneratorService';

export class ClientService {
  private collectionName = COLLECTIONS.clients;

  /**
   * Add a new client
   */
  async addClient(clientData: Omit<FirebaseClient, 'id' | 'createdAt'>): Promise<string> {
    const clientRef = collection(db, this.collectionName);
    const newClient = {
      ...clientData,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(clientRef, newClient);
    return docRef.id;
  }

  /**
   * Add a new client with automatic credential generation
   */
  async addClientWithCredentials(clientData: Omit<FirebaseClient, 'id' | 'createdAt'>): Promise<{
    clientId: string;
    credentials: {
      username: string;
      password: string;
      loginUrl: string;
    };
  }> {
    try {
      console.log('🔄 Création du client avec génération automatique des credentials...');

      // 1. Créer le client dans Firestore
      const clientId = await this.addClient(clientData);
      console.log('✅ Client créé avec ID:', clientId);

      // 2. Récupérer les données complètes du client (avec ID)
      const completeClientData = await this.getClientById(clientId);
      if (!completeClientData) {
        throw new Error('Impossible de récupérer les données du client créé');
      }

      // 3. Générer les credentials automatiquement
      const credentialsResult = await credentialGeneratorService.generateAndFormatCredentials(
        completeClientData,
        clientId
      );

      if (!credentialsResult.success || !credentialsResult.credentials) {
        throw new Error(credentialsResult.error || 'Erreur lors de la génération des credentials');
      }

      console.log('✅ Credentials générés avec succès pour:', credentialsResult.credentials.username);

      return {
        clientId,
        credentials: credentialsResult.credentials
      };

    } catch (error) {
      console.error('❌ Erreur lors de la création du client avec credentials:', error);
      throw error;
    }
  }

  /**
   * Get all clients
   */
  async getClients(): Promise<FirebaseClient[]> {
    const clientRef = collection(db, this.collectionName);
    const q = query(clientRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseClient));
  }

  /**
   * Get clients by status
   */
  async getClientsByStatus(status: FirebaseClient['status']): Promise<FirebaseClient[]> {
    const clientRef = collection(db, this.collectionName);
    const q = query(
      clientRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseClient));
  }

  /**
   * Get recent clients (limited number)
   */
  async getRecentClients(limitCount: number = 10): Promise<FirebaseClient[]> {
    const clientRef = collection(db, this.collectionName);
    const q = query(
      clientRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseClient));
  }

  /**
   * Update a client
   */
  async updateClient(id: string, updates: Partial<Omit<FirebaseClient, 'id' | 'createdAt'>>): Promise<void> {
    const clientRef = doc(db, this.collectionName, id);
    await updateDoc(clientRef, updates);
  }

  /**
   * Delete a client
   */
  async deleteClient(id: string): Promise<void> {
    const clientRef = doc(db, this.collectionName, id);
    await deleteDoc(clientRef);
  }

  /**
   * Subscribe to real-time client updates
   */
  subscribeToClients(callback: (clients: FirebaseClient[]) => void): () => void {
    const clientRef = collection(db, this.collectionName);
    const q = query(clientRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseClient));
      callback(clients);
    });
  }

  /**
   * Subscribe to clients by status with real-time updates
   */
  subscribeToClientsByStatus(
    status: FirebaseClient['status'],
    callback: (clients: FirebaseClient[]) => void
  ): () => void {
    const clientRef = collection(db, this.collectionName);
    const q = query(
      clientRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseClient));
      callback(clients);
    });
  }

  /**
   * Search clients by name (nom or prenom)
   */
  async searchClients(searchTerm: string): Promise<FirebaseClient[]> {
    const clients = await this.getClients();
    const lowercaseSearch = searchTerm.toLowerCase();

    return clients.filter(client =>
      client.nom.toLowerCase().includes(lowercaseSearch) ||
      client.prenom.toLowerCase().includes(lowercaseSearch)
    );
  }

  /**
   * Get a client by ID
   */
  async getClientById(id: string): Promise<FirebaseClient | null> {
    try {
      const clientRef = doc(db, this.collectionName, id);
      const snapshot = await getDoc(clientRef);

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data()
      } as FirebaseClient;
    } catch (error) {
      console.error('Error getting client by ID:', error);
      return null;
    }
  }

  /**
   * Get client by user ID
   */
  async getClientByUserId(userId: string): Promise<FirebaseClient | null> {
    const clientRef = collection(db, this.collectionName);
    const q = query(clientRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as FirebaseClient;
  }

  /**
   * Get client by email
   */
  async getClientByEmail(email: string): Promise<FirebaseClient | null> {
    const clientRef = collection(db, this.collectionName);
    const q = query(clientRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as FirebaseClient;
  }

  /**
   * Update client invitation status when they log in
   */
  async updateClientInvitationStatus(
    clientId: string,
    status: 'accepted' | 'declined'
  ): Promise<void> {
    const clientRef = doc(db, this.collectionName, clientId);
    const updateData: Partial<FirebaseClient> = {
      invitationStatus: status
    };

    // Add timestamp when status is accepted (first login)
    if (status === 'accepted') {
      updateData.acceptedAt = Timestamp.now();
    }

    await updateDoc(clientRef, updateData);
  }

  /**
   * Find client by user email and update their status to accepted (first login)
   */
  async acceptClientInvitationByEmail(email: string, userId?: string): Promise<{ success: boolean; clientId?: string }> {
    try {
      // Find the client by email
      const client = await this.getClientByEmail(email);

      if (!client || !client.id) {
        console.log('No client found for email:', email);
        return { success: false };
      }

      // Prepare updates
      const updates: Partial<FirebaseClient> = {
        invitationStatus: 'accepted',
        acceptedAt: Timestamp.now(),
        status: 'En cours' // Changer le statut du projet à "En cours" lors de la première connexion
      };

      // Link Firebase Auth userId to client if provided
      if (userId) {
        updates.userId = userId;
        console.log('Linking client', client.id, 'to Firebase Auth user:', userId);
      }

      // Update the client
      const clientRef = doc(db, this.collectionName, client.id);
      await updateDoc(clientRef, updates);

      console.log('Successfully updated client invitation status and linked userId for:', email);
      return { success: true, clientId: client.id };
    } catch (error) {
      console.error('Error updating client invitation status:', error);
      return { success: false };
    }
  }
}

export const clientService = new ClientService();