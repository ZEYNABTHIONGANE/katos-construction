import { signInAnonymously, signOut, User } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Service d'authentification pour tests et MVP
 */

export const simulateLogin = async (userType: 'client' | 'chef'): Promise<User> => {
  try {
    // Connexion anonyme pour simuler un utilisateur
    const result = await signInAnonymously(auth);

    // En mode test, on stocke temporairement le type d'utilisateur
    // TODO: En production, ces infos seront dans Firestore
    (result.user as any).mockUserType = userType;

    console.log(`🎭 Simulation connexion ${userType}:`, result.user.uid);

    return result.user;
  } catch (error) {
    console.error('Erreur simulation connexion:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log('👋 Déconnexion réussie');
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    throw error;
  }
};

/**
 * Obtenir le type d'utilisateur simulé
 * TODO: En production, récupérer depuis Firestore
 */
export const getCurrentUserType = (): 'client' | 'chef' | null => {
  const user = auth.currentUser as any;
  return user?.mockUserType || null;
};