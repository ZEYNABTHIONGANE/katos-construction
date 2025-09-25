import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';

import { db } from './firebase';
import {
  Selection,
  CreateSelectionData,
  UpdateSelectionData,
  ReviewSelectionData,
  SelectionStatus,
} from '../types/selection';

/**
 * Service pour gérer les sélections d'éléments par les clients
 */

/**
 * Créer une nouvelle sélection
 */
export const createSelection = async (
  projectId: string,
  selectionData: CreateSelectionData
): Promise<string> => {
  try {
    console.log('➕ Création sélection pour projet:', projectId);

    const selectionDoc = {
      ...selectionData,
      createdAt: serverTimestamp(),
    };

    const selectionsCollectionRef = collection(db, 'projects', projectId, 'selections');
    const docRef = await addDoc(selectionsCollectionRef, selectionDoc);

    console.log('✅ Sélection créée:', docRef.id);
    return docRef.id;

  } catch (error) {
    console.error('❌ Erreur création sélection:', error);
    throw new Error('Impossible de créer la sélection');
  }
};

/**
 * Mettre à jour une sélection (côté client)
 */
export const updateSelection = async (
  projectId: string,
  selectionId: string,
  updates: UpdateSelectionData
): Promise<void> => {
  try {
    const selectionRef = doc(db, 'projects', projectId, 'selections', selectionId);
    await updateDoc(selectionRef, updates);

    console.log('✅ Sélection mise à jour:', selectionId);

  } catch (error) {
    console.error('❌ Erreur mise à jour sélection:', error);
    throw new Error('Impossible de mettre à jour la sélection');
  }
};

/**
 * Supprimer une sélection
 */
export const deleteSelection = async (
  projectId: string,
  selectionId: string
): Promise<void> => {
  try {
    const selectionRef = doc(db, 'projects', projectId, 'selections', selectionId);
    await deleteDoc(selectionRef);

    console.log('✅ Sélection supprimée:', selectionId);

  } catch (error) {
    console.error('❌ Erreur suppression sélection:', error);
    throw new Error('Impossible de supprimer la sélection');
  }
};

/**
 * Valider ou rejeter une sélection (côté chef)
 */
export const reviewSelection = async (
  projectId: string,
  selectionId: string,
  reviewData: ReviewSelectionData
): Promise<void> => {
  try {
    const selectionRef = doc(db, 'projects', projectId, 'selections', selectionId);

    const updateData = {
      ...reviewData,
      statusUpdatedAt: serverTimestamp(),
    };

    await updateDoc(selectionRef, updateData);

    console.log(`✅ Sélection ${reviewData.status === 'validated' ? 'validée' : 'rejetée'}:`, selectionId);

  } catch (error) {
    console.error('❌ Erreur review sélection:', error);
    throw new Error('Impossible de valider/rejeter la sélection');
  }
};

/**
 * Vérifier si un élément du catalogue est déjà sélectionné
 */
export const isItemSelected = async (
  projectId: string,
  itemId: string,
  category: string
): Promise<boolean> => {
  try {
    const selectionsQuery = query(
      collection(db, 'projects', projectId, 'selections'),
      where('itemId', '==', itemId),
      where('category', '==', category)
    );

    const querySnapshot = await getDocs(selectionsQuery);
    return !querySnapshot.empty;

  } catch (error) {
    console.error('❌ Erreur vérification sélection:', error);
    return false;
  }
};

/**
 * Obtenir les statistiques des sélections
 */
export const getSelectionsStats = async (projectId: string) => {
  try {
    const selectionsQuery = query(
      collection(db, 'projects', projectId, 'selections'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(selectionsQuery);
    const selections = querySnapshot.docs.map(doc => doc.data());

    const stats = {
      total: selections.length,
      pending: selections.filter(s => s.status === 'pending').length,
      validated: selections.filter(s => s.status === 'validated').length,
      rejected: selections.filter(s => s.status === 'rejected').length,
    };

    return stats;

  } catch (error) {
    console.error('❌ Erreur statistiques sélections:', error);
    return {
      total: 0,
      pending: 0,
      validated: 0,
      rejected: 0,
    };
  }
};

/**
 * Obtenir les sélections par catégorie
 */
export const getSelectionsByCategory = async (
  projectId: string,
  category?: string
): Promise<Selection[]> => {
  try {
    let selectionsQuery = query(
      collection(db, 'projects', projectId, 'selections'),
      orderBy('createdAt', 'desc')
    );

    if (category) {
      selectionsQuery = query(selectionsQuery, where('category', '==', category));
    }

    const querySnapshot = await getDocs(selectionsQuery);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        statusUpdatedAt: data.statusUpdatedAt?.toDate
          ? data.statusUpdatedAt.toDate()
          : data.statusUpdatedAt ? new Date(data.statusUpdatedAt) : undefined,
      } as Selection;
    });

  } catch (error) {
    console.error('❌ Erreur récupération sélections:', error);
    return [];
  }
};