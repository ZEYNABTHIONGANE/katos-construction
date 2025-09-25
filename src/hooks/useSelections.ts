import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';

import { db } from '../services/firebase';
import { Selection, SelectionStatus } from '../types/selection';

/**
 * Hook pour écouter les sélections d'un projet en temps réel
 */
export const useSelections = (projectId: string | null | undefined) => {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setSelections([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('🎯 Chargement sélections pour projet:', projectId);
    setLoading(true);
    setError(null);

    // Requête Firestore : sélections ordonnées par date (décroissant = plus récent en premier)
    const selectionsQuery = query(
      collection(db, 'projects', projectId, 'selections'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      selectionsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          console.log('🆕 Nouvelles sélections reçues:', snapshot.size);

          const selectionsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              // Convertir Timestamp Firestore en Date JavaScript
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              statusUpdatedAt: data.statusUpdatedAt?.toDate
                ? data.statusUpdatedAt.toDate()
                : data.statusUpdatedAt ? new Date(data.statusUpdatedAt) : undefined,
            } as Selection;
          });

          setSelections(selectionsData);
          setLoading(false);
        } catch (err) {
          console.error('❌ Erreur parsing sélections:', err);
          setError('Erreur lors du chargement des sélections');
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Erreur écoute sélections:', err);
        setError('Erreur de connexion aux sélections');
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Nettoyage listener sélections');
      unsubscribe();
    };
  }, [projectId]);

  return {
    selections,
    loading,
    error,
  };
};

/**
 * Hook pour filtrer les sélections par statut
 */
export const useSelectionsByStatus = (
  projectId: string | null | undefined,
  status?: SelectionStatus
) => {
  const { selections, loading, error } = useSelections(projectId);

  const filteredSelections = status
    ? selections.filter(selection => selection.status === status)
    : selections;

  return {
    selections: filteredSelections,
    loading,
    error,
  };
};

/**
 * Hook pour filtrer les sélections par catégorie
 */
export const useSelectionsByCategory = (
  projectId: string | null | undefined,
  category?: string
) => {
  const { selections, loading, error } = useSelections(projectId);

  const filteredSelections = category
    ? selections.filter(selection => selection.category === category)
    : selections;

  return {
    selections: filteredSelections,
    loading,
    error,
  };
};

/**
 * Hook pour statistiques des sélections en temps réel
 */
export const useSelectionsStats = (projectId: string | null | undefined) => {
  const { selections, loading, error } = useSelections(projectId);

  const stats = {
    total: selections.length,
    pending: selections.filter(s => s.status === 'pending').length,
    validated: selections.filter(s => s.status === 'validated').length,
    rejected: selections.filter(s => s.status === 'rejected').length,
    byCategory: selections.reduce((acc, selection) => {
      acc[selection.category] = (acc[selection.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    stats,
    loading,
    error,
  };
};