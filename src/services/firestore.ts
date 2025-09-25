import {
  collection,
  doc,
  FirestoreDataConverter,
  DocumentReference,
  CollectionReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
  PartialWithFieldValue,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Référence de collection Firestore
 */
export const colRef = <T = any>(path: string): CollectionReference<T> => {
  return collection(db, path) as CollectionReference<T>;
};

/**
 * Référence de document Firestore
 */
export const docRef = <T = any>(path: string): DocumentReference<T> => {
  return doc(db, path) as DocumentReference<T>;
};

/**
 * Créer un converter Firestore typé
 * Permet la sérialisation/désérialisation automatique des objets TypeScript
 *
 * @example
 * interface User {
 *   id?: string;
 *   name: string;
 *   email: string;
 *   createdAt: Date;
 * }
 *
 * const usersRef = colRef('users').withConverter(withConverter<User>());
 */
export const withConverter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: WithFieldValue<T>): any => {
    // Convertir les dates en timestamps pour Firestore
    const result: any = {};

    for (const [key, value] of Object.entries(data as any)) {
      if (value instanceof Date) {
        result[key] = value;
      } else if (value && typeof value === 'object' && value.constructor === Object) {
        // Récursif pour les objets imbriqués
        result[key] = withConverter<any>().toFirestore(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  },

  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T => {
    const data = snapshot.data(options);

    // Ajouter l'ID du document
    return {
      id: snapshot.id,
      ...data,
    } as T;
  },
});

/**
 * Helper pour créer une référence de collection typée avec converter
 */
export const typedColRef = <T>(path: string): CollectionReference<T> => {
  return colRef(path).withConverter(withConverter<T>());
};

/**
 * Helper pour créer une référence de document typée avec converter
 */
export const typedDocRef = <T>(path: string): DocumentReference<T> => {
  return docRef(path).withConverter(withConverter<T>());
};