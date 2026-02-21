import { collection, getDocs, query, where, setDoc, addDoc, doc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { COLLECTIONS, UserRole } from '../types/firebase';
import type { FirebaseUser, FirebaseClient } from '../types/firebase';

export interface GeneratedCredentials {
  username: string;
  password: string;
  userId: string;
}

export class CredentialGeneratorService {

  /**
   * Générer un username unique au format CLI + 9 chiffres
   */
  private async generateUniqueUsername(): Promise<string> {
    let username: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Générer 9 chiffres aléatoires
      const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
      username = `CLI${randomDigits}`;

      // Vérifier si le username existe déjà
      const usersRef = collection(db, COLLECTIONS.users);
      const q = query(usersRef, where('username', '==', username));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return username; // Username unique trouvé
      }

      attempts++;
    } while (attempts < maxAttempts);

    throw new Error('Impossible de générer un username unique après plusieurs tentatives');
  }

  /**
   * Générer un mot de passe aléatoire sécurisé
   */
  private generateRandomPassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '@#$%&*';

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // Assurer au moins un caractère de chaque type
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Compléter avec des caractères aléatoires
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Mélanger les caractères
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  /**
   * Créer un compte Firebase Auth avec email et mot de passe
   */
  private async createFirebaseAuthAccount(
    email: string,
    password: string,
    displayName: string
  ): Promise<string> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Mettre à jour le profil avec le nom d'affichage
      await updateProfile(user, { displayName });

      return user.uid;
    } catch (error: any) {
      console.error('Erreur création compte Firebase Auth:', error);
      throw new Error(`Erreur lors de la création du compte: ${error.message}`);
    }
  }

  /**
   * Créer un document utilisateur dans Firestore
   */
  private async createUserDocument(
    userId: string,
    email: string,
    username: string,
    displayName: string,
    clientId: string
  ): Promise<void> {
    try {
      const userData: FirebaseUser = {
        uid: userId,
        email,
        displayName,
        username,
        clientId,
        role: UserRole.CLIENT,
        isTemporaryPassword: true, // Le client devra changer son mot de passe
        createdAt: Timestamp.now(),
        createdBy: 'system' // ou l'ID de l'admin qui a créé le client
      };

      await addDoc(collection(db, COLLECTIONS.users), userData);
      console.log('Document utilisateur créé avec succès:', { userId, username, email });
    } catch (error) {
      console.error('Erreur création document utilisateur:', error);
      throw error;
    }
  }

  /**
   * Générer des credentials complets pour un nouveau client
   */
  async generateClientCredentials(
    clientData: FirebaseClient,
    clientId: string
  ): Promise<GeneratedCredentials> {
    try {
      console.log('🔐 Génération des credentials pour le client:', clientData.email);

      // 1. Générer username unique
      const username = await this.generateUniqueUsername();
      console.log('✅ Username généré:', username);

      // 2. Générer mot de passe
      const password = this.generateRandomPassword();
      console.log('✅ Mot de passe généré (longueur):', password.length);

      // 3. Créer le nom d'affichage
      const displayName = `${clientData.prenom} ${clientData.nom}`;

      // 4. Créer le compte Firebase Auth
      const userId = await this.createFirebaseAuthAccount(
        clientData.email,
        password,
        displayName
      );
      console.log('✅ Compte Firebase Auth créé:', userId);

      // 5. Créer le document utilisateur dans Firestore
      await this.createUserDocument(
        userId,
        clientData.email,
        username,
        displayName,
        clientId
      );
      console.log('✅ Document utilisateur créé dans Firestore');

      return {
        username,
        password,
        userId
      };

    } catch (error) {
      console.error('❌ Erreur lors de la génération des credentials:', error);
      throw error;
    }
  }

  /**
   * Valider le format du username
   */
  validateUsernameFormat(username: string): boolean {
    const regex = /^CLI\d{9}$/;
    return regex.test(username);
  }

  /**
   * Vérifier si un username existe déjà
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const usersRef = collection(db, COLLECTIONS.users);
      const q = query(usersRef, where('username', '==', username));
      const snapshot = await getDocs(q);
      return snapshot.empty;
    } catch (error) {
      console.error('Erreur vérification username:', error);
      return false;
    }
  }

  /**
   * Générer les credentials et retourner un résumé pour envoi au client
   */
  async generateAndFormatCredentials(
    clientData: FirebaseClient,
    clientId: string
  ): Promise<{
    success: boolean;
    credentials?: {
      username: string;
      password: string;
      loginUrl: string;
    };
    error?: string;
  }> {
    try {
      const generated = await this.generateClientCredentials(clientData, clientId);

      return {
        success: true,
        credentials: {
          username: generated.username,
          password: generated.password,
          loginUrl: 'katos://login' // Deep link vers l'app
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la génération des credentials'
      };
    }
  }
}

export const credentialGeneratorService = new CredentialGeneratorService();