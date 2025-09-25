import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';

import { db } from '../services/firebase';
import { useSessionStore } from '../store/session';

interface ProjectCounts {
  mediaCount: number;
  unreadMessagesCount: number;
  pendingSelectionsCount: number;
}

/**
 * Hook pour compter les médias, messages non lus et sélections en attente d'un projet
 * Utilise des requêtes Firestore optimisées avec indexes
 */
export const useCounts = (projectId: string | null | undefined) => {
  const { firebaseUser } = useSessionStore();

  const [counts, setCounts] = useState<ProjectCounts>({
    mediaCount: 0,
    unreadMessagesCount: 0,
    pendingSelectionsCount: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setCounts({
        mediaCount: 0,
        unreadMessagesCount: 0,
        pendingSelectionsCount: 0,
      });
      setLoading(false);
      setError(null);
      return;
    }

    console.log('📊 Chargement compteurs pour projet:', projectId);
    setLoading(true);
    setError(null);

    const unsubscribes: (() => void)[] = [];

    try {
      // 1. Compter les médias (tous les médias du projet)
      const mediaQuery = collection(db, 'projects', projectId, 'media');
      const unsubscribeMedia = onSnapshot(
        mediaQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const mediaCount = snapshot.size;
          console.log('📸 Médias comptés:', mediaCount);
          setCounts(prev => ({ ...prev, mediaCount }));
        },
        (err) => {
          console.error('❌ Erreur comptage médias:', err);
          setError('Erreur comptage médias');
        }
      );
      unsubscribes.push(unsubscribeMedia);

      // 2. Compter les messages non lus par l'utilisateur actuel
      if (firebaseUser) {
        // Messages non lus = messages où isRead est false ou n'existe pas
        // ET qui ne sont pas envoyés par l'utilisateur actuel
        const messagesQuery = query(
          collection(db, 'projects', projectId, 'messages'),
          where('fromUid', '!=', firebaseUser.uid)
        );

        const unsubscribeMessages = onSnapshot(
          messagesQuery,
          (snapshot: QuerySnapshot<DocumentData>) => {
            // Compter les messages non lus
            const unreadCount = snapshot.docs.filter(doc => {
              const data = doc.data();
              return !data.isRead; // isRead false ou undefined
            }).length;

            console.log('💬 Messages non lus comptés:', unreadCount);
            setCounts(prev => ({ ...prev, unreadMessagesCount: unreadCount }));
          },
          (err) => {
            console.error('❌ Erreur comptage messages:', err);
            setError('Erreur comptage messages');
          }
        );
        unsubscribes.push(unsubscribeMessages);
      }

      // 3. Compter les sélections en attente (status = 'pending')
      const selectionsQuery = query(
        collection(db, 'projects', projectId, 'selections'),
        where('status', '==', 'pending')
      );

      const unsubscribeSelections = onSnapshot(
        selectionsQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const pendingCount = snapshot.size;
          console.log('🎯 Sélections en attente comptées:', pendingCount);
          setCounts(prev => ({ ...prev, pendingSelectionsCount: pendingCount }));
        },
        (err) => {
          console.error('❌ Erreur comptage sélections:', err);
          setError('Erreur comptage sélections');
        }
      );
      unsubscribes.push(unsubscribeSelections);

    } catch (err) {
      console.error('❌ Erreur initialisation compteurs:', err);
      setError('Erreur initialisation compteurs');
    } finally {
      setLoading(false);
    }

    // Cleanup function
    return () => {
      console.log('🧹 Nettoyage listeners compteurs');
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [projectId, firebaseUser?.uid]);

  return {
    counts,
    loading,
    error,
  };
};