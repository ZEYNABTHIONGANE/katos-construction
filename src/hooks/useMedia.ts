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
  getCountFromServer,
  where,
} from 'firebase/firestore';

import { db } from '../services/firebase';
import { Media } from '../types/media';

const PAGE_SIZE = 24;

const toDate = (value: any) => {
  if (!value) return undefined;
  if (value.toDate) {
    return value.toDate() as Date;
  }
  return new Date(value);
};

/**
 * Hook pour écouter les médias d'un projet avec pagination
 */
export const useMedia = (projectId: string | null | undefined) => {
  const [liveMedia, setLiveMedia] = useState<Media[]>([]);
  const [olderMedia, setOlderMedia] = useState<Media[]>([]);
  const olderMediaRef = useRef<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const earliestDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const reachedBeginningRef = useRef(false);

  const parseMediaDoc = useCallback((doc: QueryDocumentSnapshot<DocumentData>): Media => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt) ?? new Date(),
      updatedAt: toDate(data.updatedAt),
    } as Media;
  }, []);

  const getDocTimestamp = useCallback((doc: QueryDocumentSnapshot<DocumentData>) => {
    const data = doc.data();
    return toDate(data.createdAt)?.getTime() ?? 0;
  }, []);

  const resetState = useCallback(() => {
    setLiveMedia([]);
    setOlderMedia([]);
    olderMediaRef.current = [];
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

    console.log('📸 Chargement médias pour projet:', projectId);
    setLoading(true);
    setError(null);

    const mediaRef = collection(db, 'projects', projectId, 'media');
    const mediaQuery = query(
      mediaRef,
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(
      mediaQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          console.log('🖼️ Nouveaux médias reçus:', snapshot.size);

          const docs = snapshot.docs;
          const latestMedia = docs.map(parseMediaDoc).reverse();
          setLiveMedia(latestMedia);

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
          } else if (olderMediaRef.current.length === 0) {
            earliestDocRef.current = null;
            reachedBeginningRef.current = true;
            setHasMore(false);
          }

          setLoading(false);
        } catch (err) {
          console.error('❌ Erreur parsing médias:', err);
          setError('Erreur lors du chargement des médias');
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Erreur écoute médias:', err);
        setError('Erreur de connexion aux médias');
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Nettoyage listener médias');
      unsubscribe();
    };
  }, [projectId, refreshToken, parseMediaDoc, getDocTimestamp, resetState]);

  const loadMore = useCallback(async () => {
    if (!projectId) return;
    if (loadingMore) return;
    if (reachedBeginningRef.current) return;

    const cursor = earliestDocRef.current;
    if (!cursor) {
      console.log('ℹ️ Aucun curseur disponible pour la pagination des médias');
      return;
    }

    try {
      setLoadingMore(true);

      const mediaRef = collection(db, 'projects', projectId, 'media');
      const olderQuery = query(
        mediaRef,
        orderBy('createdAt', 'desc'),
        startAfter(cursor),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(olderQuery);
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        const olderBatch = docs.map(parseMediaDoc).reverse();

        setOlderMedia(prev => {
          const next = [...olderBatch, ...prev];
          olderMediaRef.current = next;
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
      console.error('❌ Erreur pagination médias:', err);
      setError('Erreur lors du chargement des anciens médias');
    } finally {
      setLoadingMore(false);
    }
  }, [projectId, loadingMore, parseMediaDoc]);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    resetState();
    setLoading(true);
    setRefreshToken(prev => prev + 1);
  }, [projectId, resetState]);

  const media = useMemo(
    () => [...olderMedia, ...liveMedia],
    [olderMedia, liveMedia]
  );

  return {
    media,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
};

/**
 * Hook pour filtrer les médias par type
 */
export const useMediaByType = (
  projectId: string | null | undefined,
  mediaType?: 'image' | 'video' | 'document'
) => {
  const {
    media,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  } = useMedia(projectId);

  const filteredMedia = mediaType
    ? media.filter(item => item.type === mediaType)
    : media;

  return {
    media: filteredMedia,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
};

/**
 * Hook pour statistiques des médias (compteurs server-side)
 */
export const useMediaStats = (projectId: string | null | undefined) => {
  const [stats, setStats] = useState({
    total: 0,
    images: 0,
    videos: 0,
    documents: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    if (!projectId) {
      setStats({ total: 0, images: 0, videos: 0, documents: 0 });
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const mediaRef = collection(db, 'projects', projectId, 'media');
      const [totalSnapshot, imagesSnapshot, videosSnapshot, documentsSnapshot] = await Promise.all([
        getCountFromServer(mediaRef),
        getCountFromServer(query(mediaRef, where('type', '==', 'image'))),
        getCountFromServer(query(mediaRef, where('type', '==', 'video'))),
        getCountFromServer(query(mediaRef, where('type', '==', 'document'))),
      ]);

      setStats({
        total: totalSnapshot.data().count,
        images: imagesSnapshot.data().count,
        videos: videosSnapshot.data().count,
        documents: documentsSnapshot.data().count,
      });
    } catch (err) {
      console.error('❌ Erreur comptage médias:', err);
      setError('Impossible de récupérer les statistiques des médias');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    stats,
    loading,
    error,
    refresh: fetchCounts,
  };
};
