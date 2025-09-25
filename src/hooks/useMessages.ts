import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  QuerySnapshot,
  DocumentData,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../services/firebase';
import { Message } from '../types/message';

/**
 * Hook pour écouter les messages d'un projet en temps réel
 * Ordonnés par date de création (plus récent en bas)
 */
export const useMessages = (projectId: string | null | undefined) => {
  const PAGE_SIZE = 30;
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const olderMessagesRef = useRef<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const earliestDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const reachedBeginningRef = useRef(false);

  const parseMessageDoc = useCallback((doc: QueryDocumentSnapshot<DocumentData>): Message => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    } as Message;
  }, []);

  const getDocTimestamp = useCallback((doc: QueryDocumentSnapshot<DocumentData>) => {
    const data = doc.data();
    const createdAt = data.createdAt;
    if (createdAt?.toDate) {
      return createdAt.toDate().getTime();
    }
    return new Date(createdAt).getTime();
  }, []);

  const resetState = useCallback(() => {
    setLiveMessages([]);
    setOlderMessages([]);
    olderMessagesRef.current = [];
    earliestDocRef.current = null;
    reachedBeginningRef.current = false;
    setHasMore(false);
  }, []);

  useEffect(() => {
    if (!projectId) {
      resetState();
      setLoading(false);
      setError(null);
      return;
    }

    console.log('💬 Chargement messages pour projet:', projectId);
    setLoading(true);
    setError(null);

    // Requête Firestore : messages ordonnés par date (plus récent en premier)
    const messagesRef = collection(db, 'projects', projectId, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          console.log('📨 Nouveaux messages reçus:', snapshot.size);

          const docs = snapshot.docs;
          const latestMessages = docs.map(parseMessageDoc).reverse();
          setLiveMessages(latestMessages);

          if (docs.length > 0) {
            const snapshotOldest = docs[docs.length - 1];

            if (!earliestDocRef.current) {
              earliestDocRef.current = snapshotOldest;
            } else {
              const currentTime = getDocTimestamp(earliestDocRef.current);
              const snapshotTime = getDocTimestamp(snapshotOldest);

              if (snapshotTime < currentTime) {
                earliestDocRef.current = snapshotOldest;
              }
            }

            if (!reachedBeginningRef.current) {
              setHasMore(docs.length === PAGE_SIZE);
            }
          } else if (olderMessagesRef.current.length === 0) {
            earliestDocRef.current = null;
            reachedBeginningRef.current = true;
            setHasMore(false);
          }

          setLoading(false);
        } catch (err) {
          console.error('❌ Erreur parsing messages:', err);
          setError('Erreur lors du chargement des messages');
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Erreur écoute messages:', err);
        setError('Erreur de connexion aux messages');
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Nettoyage listener messages');
      unsubscribe();
    };
  }, [projectId, refreshToken, parseMessageDoc, getDocTimestamp, resetState]);

  const loadOlder = useCallback(async () => {
    if (!projectId) return;
    if (loadingMore) return;
    if (reachedBeginningRef.current) return;

    const cursor = earliestDocRef.current;
    if (!cursor) {
      console.log('ℹ️ Aucun curseur disponible pour pagination');
      return;
    }

    try {
      setLoadingMore(true);
      const messagesRef = collection(db, 'projects', projectId, 'messages');
      const olderQuery = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        startAfter(cursor),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(olderQuery);
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        const olderBatch = docs.map(parseMessageDoc).reverse();

        setOlderMessages(prev => {
          const next = [...olderBatch, ...prev];
          olderMessagesRef.current = next;
          return next;
        });

        earliestDocRef.current = docs[docs.length - 1];

        if (docs.length < PAGE_SIZE) {
          reachedBeginningRef.current = true;
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        reachedBeginningRef.current = true;
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Erreur pagination messages:', err);
      setError('Erreur lors du chargement des anciens messages');
    } finally {
      setLoadingMore(false);
    }
  }, [projectId, loadingMore, parseMessageDoc]);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    resetState();
    setLoading(true);
    setRefreshToken(prev => prev + 1);
  }, [projectId, resetState]);

  const messages = useMemo(
    () => [...olderMessages, ...liveMessages],
    [olderMessages, liveMessages]
  );

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadOlder,
    refresh,
  };
};
