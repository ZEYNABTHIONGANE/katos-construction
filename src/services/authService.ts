import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, Timestamp, query, where, collection, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { FirebaseUser, FirebaseClient } from '../types/firebase';
import { COLLECTIONS, UserRole } from '../types/firebase';
import { invitationService } from './invitationService';
import { clientService } from './clientService';

export interface ClientSession {
  clientId: string;
  clientData: FirebaseClient;
  authenticatedAt: string;
  sessionToken: string;
  authType: 'invitation' | 'firebase';
}

export class AuthService {
  private readonly SESSION_KEY = '@katos_session';
  private readonly PIN_KEY = '@katos_pin';
  /**
   * Look up email by username
   */
  async getUserEmailByUsername(username: string): Promise<string | null> {
    try {
      // Validate username format (CLI followed by digits)
      const usernameRegex = /^CLI\d{9}$/;
      if (!usernameRegex.test(username)) {
        console.log('Invalid username format:', username);
        return null;
      }

      console.log('Looking up email for username:', username);

      const usersRef = collection(db, COLLECTIONS.users);
      const q = query(
        usersRef,
        where('username', '==', username),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('No user found with username:', username);
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as FirebaseUser;

      console.log('Found user data:', {
        uid: userData.uid,
        email: userData.email,
        username: userData.username,
        isBlocked: userData.isBlocked
      });

      // Additional check to ensure the user account is not blocked
      if (userData.isBlocked) {
        console.log('User account is blocked:', username);
        throw new Error('USER_BLOCKED');
      }

      // Validate that email property exists
      if (!userData.email) {
        console.error('User document missing email field:', userData);
        throw new Error('User document is missing email field');
      }

      console.log('Successfully resolved email for username:', username);
      return userData.email;
    } catch (error: any) {
      console.error('Erreur lors de la recherche par nom d\'utilisateur:', {
        username,
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error; // Re-throw to handle in signInWithUsername
    }
  }

  /**
   * Sign in with username and password
   */
  async signInWithUsername(username: string, password: string): Promise<User> {
    try {
      // First, look up the email associated with this username
      const email = await this.getUserEmailByUsername(username);

      if (!email) {
        throw new Error('USERNAME_NOT_FOUND');
      }

      // Then use the email for Firebase Auth login
      const result = await signInWithEmailAndPassword(auth, email, password);

      // After successful login, try to find client data and create session
      try {
        // Method 1: Try finding client by userId (Preferred method for new technical accounts)
        let clientData = await clientService.getClientByUserId(result.user.uid);

        // Method 2: Fallback to email lookup if userId link not established yet
        if (!clientData) {
          console.log('Client not found by userId, trying email lookup fallback...');
          const updateResult = await clientService.acceptClientInvitationByEmail(email, result.user.uid);
          if (updateResult.success) {
            clientData = await clientService.getClientByUserId(result.user.uid);
          }
        }

        if (clientData) {
          console.log('✅ Client data found, creating session for:', clientData.id);

          if (clientData.isActive === false) {
            console.warn('❌ Account is disabled for client:', clientData.id);
            throw new Error('ACCOUNT_DISABLED');
          }

          // Ensure invitation status is accepted
          if (clientData.invitationStatus !== 'accepted') {
            await clientService.updateClientInvitationStatus(clientData.id!, 'accepted');
          }

          // Create client session
          const session: ClientSession = {
            clientId: clientData.id!,
            clientData: clientData,
            authenticatedAt: new Date().toISOString(),
            sessionToken: this.generateSessionToken(),
            authType: 'firebase'
          };
          await this.saveClientSession(session);
          console.log('✅ Client session successfully saved');
        } else {
          console.warn('⚠️ No client data found for user:', result.user.uid);
        }

      } catch (statusUpdateError: any) {
        // Re-throw ACCOUNT_DISABLED to prevent login
        if (statusUpdateError.message === 'ACCOUNT_DISABLED') {
          await this.signOut();
          throw statusUpdateError;
        }
        // Don't fail login if status update fails, but log the error
        console.warn('Failed to create client session after login:', statusUpdateError);
      }

      return result.user;
    } catch (error: any) {
      // Re-throw specific errors or Firebase auth errors
      if (error.message === 'USER_BLOCKED') {
        throw new Error('USER_BLOCKED');
      } else if (error.message === 'USERNAME_NOT_FOUND') {
        throw new Error('USERNAME_NOT_FOUND');
      } else if (error.message === 'ACCOUNT_DISABLED') {
        throw new Error('ACCOUNT_DISABLED');
      }
      // Let Firebase auth errors pass through
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // After successful login, check if this is a client and update status only then
    try {
      // First check if user has client data
      const userData = await this.getUserData(result.user.uid);

      // Only update client status if user has username (indicating client account)
      if (userData?.username && userData.username.match(/^CLI\d{9}$/)) {
        const updateResult = await clientService.acceptClientInvitationByEmail(email, result.user.uid);
        if (updateResult.success) {
          console.log('Client invitation status updated to accepted for:', email);

          // Create client session with correct clientId (from clients collection)
          const clientData = await clientService.getClientByUserId(result.user.uid);
          if (clientData) {
            const session: ClientSession = {
              clientId: clientData.id!, // Use the document ID from clients collection
              clientData: clientData,
              authenticatedAt: new Date().toISOString(),
              sessionToken: this.generateSessionToken(),
              authType: 'firebase'
            };
            await this.saveClientSession(session);
            console.log('Client session created with clientId:', clientData.id);
          }
        }
      } else {
        console.log('Non-client user logged in:', email, '- skipping client status update');
      }
    } catch (statusUpdateError) {
      // Don't fail login if status update fails, but log the error
      console.warn('Failed to update client status after login:', statusUpdateError);
    }

    return result.user;
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    displayName: string,
    phoneNumber?: string
  ): Promise<User> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Update user profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    const userData: FirebaseUser = {
      uid: user.uid,
      email: user.email!,
      displayName,
      phoneNumber,
      role: UserRole.CHEF, // Default to CHEF for in-app signups
      createdAt: Timestamp.now()
    };

    await setDoc(doc(db, COLLECTIONS.users, user.uid), userData);
    return user;
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Get user data from Firestore
   */
  async getUserData(uid: string): Promise<FirebaseUser | null> {
    const userDoc = await getDoc(doc(db, COLLECTIONS.users, uid));
    return userDoc.exists() ? userDoc.data() as FirebaseUser : null;
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  // ====== NOUVELLES MÉTHODES POUR L'AUTHENTIFICATION PAR INVITATION ======

  /**
   * Authentification avec token d'invitation
   */
  async authenticateWithInvitationToken(token: string): Promise<{ success: boolean; session?: ClientSession; reason?: string }> {
    try {
      const result = await invitationService.authenticateWithToken(token);

      if (result.success && result.clientData) {
        const session: ClientSession = {
          clientId: result.clientData.id,
          clientData: result.clientData,
          authenticatedAt: new Date().toISOString(),
          sessionToken: this.generateSessionToken(),
          authType: 'invitation'
        };

        await this.saveClientSession(session);
        return { success: true, session };
      } else {
        return { success: false, reason: result.reason };
      }
    } catch (error) {
      console.error('Erreur d\'authentification par invitation:', error);
      return { success: false, reason: 'Erreur de connexion' };
    }
  }

  /**
   * Vérifier s'il y a une session client active
   */
  async hasActiveClientSession(): Promise<boolean> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      return sessionData !== null;
    } catch (error) {
      console.error('Erreur lors de la vérification de session:', error);
      return false;
    }
  }

  /**
   * Récupérer la session client actuelle
   */
  async getCurrentClientSession(): Promise<ClientSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        const session: ClientSession = JSON.parse(sessionData);

        // Rafraîchir les données client depuis Firebase
        const freshClientData = await clientService.getClientById(session.clientId);
        if (freshClientData) {
          if (freshClientData.isActive === false) {
            console.warn('❌ Account disabled detected during session refresh');
            await this.signOutAll();
            return null;
          }
          session.clientData = freshClientData;
          await this.saveClientSession(session);
        }

        return session;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de session:', error);
      return null;
    }
  }

  /**
   * Sauvegarder la session client
   */
  private async saveClientSession(session: ClientSession): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de session:', error);
    }
  }

  /**
   * Générer un token de session
   */
  private generateSessionToken(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Déconnexion complète (Firebase + session client)
   */
  async signOutAll(): Promise<void> {
    try {
      // Déconnexion Firebase
      if (this.isAuthenticated()) {
        await this.signOut();
      }

      // Supprimer la session client
      await AsyncStorage.multiRemove([this.SESSION_KEY, this.PIN_KEY]);
    } catch (error) {
      console.error('Erreur lors de la déconnexion complète:', error);
    }
  }

  /**
   * Créer un code PIN pour les reconnexions
   */
  async createPIN(pin: string): Promise<boolean> {
    try {
      const hashedPIN = btoa(pin); // Base64 simple (en production, utiliser bcrypt)
      await AsyncStorage.setItem(this.PIN_KEY, hashedPIN);
      return true;
    } catch (error) {
      console.error('Erreur lors de la création du PIN:', error);
      return false;
    }
  }

  /**
   * Vérifier le code PIN
   */
  async verifyPIN(pin: string): Promise<boolean> {
    try {
      const storedPIN = await AsyncStorage.getItem(this.PIN_KEY);
      if (!storedPIN) return false;

      const hashedPIN = btoa(pin);
      return hashedPIN === storedPIN;
    } catch (error) {
      console.error('Erreur lors de la vérification du PIN:', error);
      return false;
    }
  }

  /**
   * Vérifier si un PIN existe
   */
  async hasPIN(): Promise<boolean> {
    try {
      const pin = await AsyncStorage.getItem(this.PIN_KEY);
      return pin !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rafraîchir les données client
   */
  async refreshClientData(): Promise<boolean> {
    try {
      const session = await this.getCurrentClientSession();
      if (!session) return false;

      const freshClientData = await clientService.getClientById(session.clientId);
      if (freshClientData) {
        session.clientData = freshClientData;
        await this.saveClientSession(session);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      return false;
    }
  }

  /**
   * Connexion automatique si session active
   */
  async autoLoginClient(): Promise<{ success: boolean; session?: ClientSession; requiresPIN?: boolean }> {
    try {
      const hasSession = await this.hasActiveClientSession();
      if (!hasSession) {
        return { success: false };
      }

      const hasPIN = await this.hasPIN();
      if (hasPIN) {
        return { success: false, requiresPIN: true };
      }

      const session = await this.getCurrentClientSession();
      if (session) {
        return { success: true, session };
      }

      return { success: false };
    } catch (error) {
      console.error('Erreur lors de la connexion automatique:', error);
      return { success: false };
    }
  }

  /**
   * Connexion avec PIN
   */
  async loginWithPIN(pin: string): Promise<{ success: boolean; session?: ClientSession; reason?: string }> {
    try {
      const isValidPIN = await this.verifyPIN(pin);
      if (!isValidPIN) {
        return { success: false, reason: 'Code PIN incorrect' };
      }

      const session = await this.getCurrentClientSession();
      if (session) {
        return { success: true, session };
      } else {
        return { success: false, reason: 'Session expirée' };
      }
    } catch (error) {
      console.error('Erreur lors de la connexion avec PIN:', error);
      return { success: false, reason: 'Erreur de connexion' };
    }
  }

  /**
   * Supprimer le compte utilisateur
   */
  async deleteAccount(): Promise<{ success: boolean; reason?: string }> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, reason: 'Aucun utilisateur connecté' };
      }

      // Supprimer les données utilisateur dans Firestore
      await deleteDoc(doc(db, COLLECTIONS.users, currentUser.uid));

      // Supprimer le compte Firebase Auth
      await currentUser.delete();

      // Nettoyer les données locales
      await this.signOutAll();

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      return { success: false, reason: 'Erreur lors de la suppression du compte' };
    }
  }

  /**
   * Supprimer le compte client
   */
  async deleteClientAccount(clientId: string): Promise<{ success: boolean; reason?: string }> {
    try {
      // Supprimer le client de la collection clients
      await deleteDoc(doc(db, COLLECTIONS.clients, clientId));

      // Nettoyer les données locales
      await this.signOutAll();

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression du compte client:', error);
      return { success: false, reason: 'Erreur lors de la suppression du compte' };
    }
  }
}

export const authService = new AuthService();