import { useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../services/firebase';
import { useSessionStore } from '../store/session';
import { User as AppUser } from '../types/user';
import { initializeNotifications } from '../services/notifications';

/**
 * Hook pour gérer l'état d'authentification avec Firebase
 * Synchronise Firebase Auth avec le store Zustand
 */
export const useAuthUser = () => {
  const { setFirebaseUser, setAppUser, setLoading, clearSession } = useSessionStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      try {
        setLoading(true);

        if (firebaseUser) {
          console.log('🔥 Utilisateur connecté:', firebaseUser.uid);

          // Mettre à jour l'utilisateur Firebase dans le store
          setFirebaseUser(firebaseUser);

          // Récupérer les données utilisateur depuis Firestore
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const appUser = userDocSnap.data() as AppUser;
              console.log('👤 Données utilisateur récupérées:', appUser.role);
              setAppUser(appUser);

              // Initialiser les notifications pour l'utilisateur connecté
              initializeNotifications(appUser).catch(err => {
                console.error('❌ Erreur initialisation notifications:', err);
              });
            } else {
              console.warn('⚠️ Document utilisateur non trouvé dans Firestore');
              // Utilisateur Firebase existe mais pas le document Firestore
              // Cela peut arriver si la création du document a échoué
              setAppUser(null);
            }
          } catch (firestoreError) {
            console.error('❌ Erreur récupération données Firestore:', firestoreError);
            setAppUser(null);
          }
        } else {
          console.log('👋 Utilisateur déconnecté');
          clearSession();
        }
      } catch (error) {
        console.error('❌ Erreur dans useAuthUser:', error);
        clearSession();
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [setFirebaseUser, setAppUser, setLoading, clearSession]);

  // Retourner les valeurs du store pour faciliter l'usage
  const { firebaseUser, appUser, isAuthenticated, isLoading } = useSessionStore();

  return {
    firebaseUser,
    appUser,
    isAuthenticated,
    isLoading,
  };
};