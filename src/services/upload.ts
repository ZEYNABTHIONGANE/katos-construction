import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { storage, db } from './firebase';
import { CreateMediaData, UpdateMediaData } from '../types/media';

/**
 * Service pour gérer l'upload de médias vers Firebase Storage
 * et la création des documents Firestore associés
 */

export interface UploadResult {
  mediaId: string;
  downloadURL: string;
  storagePath: string;
}

/**
 * Uploader un fichier média (image/vidéo) pour un projet
 */
export const uploadMedia = async (
  projectId: string,
  file: File | Blob,
  mediaData: Omit<CreateMediaData, 'storagePath'>
): Promise<UploadResult> => {
  try {
    console.log('📤 Upload média pour projet:', projectId);

    // 1. Générer un UUID unique pour le fichier
    const mediaId = uuidv4();
    const fileExtension = getFileExtension(file, mediaData.type);
    const fileName = `${mediaId}.${fileExtension}`;

    // 2. Chemin dans Firebase Storage
    const storagePath = `projects/${projectId}/media/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log('📁 Upload vers:', storagePath);

    // 3. Upload du fichier vers Storage
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: getContentType(mediaData.type),
    });

    // 4. Récupérer l'URL de téléchargement
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // 5. Créer le document Firestore
    const mediaDoc = {
      ...mediaData,
      storagePath,
      downloadURL,
      createdAt: serverTimestamp(),
    };

    const mediaCollectionRef = collection(db, 'projects', projectId, 'media');
    const docRef = await addDoc(mediaCollectionRef, mediaDoc);

    console.log('✅ Média uploadé avec succès:', docRef.id);

    return {
      mediaId: docRef.id,
      downloadURL,
      storagePath,
    };

  } catch (error) {
    console.error('❌ Erreur upload média:', error);
    throw new Error('Impossible d\'uploader le média');
  }
};

/**
 * Supprimer un média (Storage + Firestore)
 */
export const deleteMedia = async (
  projectId: string,
  mediaId: string,
  storagePath: string
): Promise<void> => {
  try {
    console.log('🗑️ Suppression média:', mediaId);

    // 1. Supprimer le fichier de Storage
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    // 2. Supprimer le document Firestore
    const mediaRef = doc(db, 'projects', projectId, 'media', mediaId);
    await deleteDoc(mediaRef);

    console.log('✅ Média supprimé avec succès');

  } catch (error) {
    console.error('❌ Erreur suppression média:', error);
    throw new Error('Impossible de supprimer le média');
  }
};

/**
 * Mettre à jour les métadonnées d'un média
 */
export const updateMediaMetadata = async (
  projectId: string,
  mediaId: string,
  updates: UpdateMediaData
): Promise<void> => {
  try {
    const mediaRef = doc(db, 'projects', projectId, 'media', mediaId);
    await updateDoc(mediaRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Métadonnées média mises à jour:', mediaId);

  } catch (error) {
    console.error('❌ Erreur mise à jour média:', error);
    throw new Error('Impossible de mettre à jour les métadonnées');
  }
};

/**
 * Helpers pour déterminer l'extension et le type MIME
 */
function getFileExtension(file: File | Blob, mediaType: 'image' | 'video' | 'document'): string {
  if (file instanceof File && file.name) {
    const parts = file.name.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
  }

  // Fallback selon le type
  switch (mediaType) {
    case 'image':
      return 'jpg';
    case 'video':
      return 'mp4';
    case 'document':
      return 'pdf';
    default:
      return 'bin';
  }
}

function getContentType(mediaType: 'image' | 'video' | 'document'): string {
  switch (mediaType) {
    case 'image':
      return 'image/jpeg';
    case 'video':
      return 'video/mp4';
    case 'document':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Valider la taille et le type de fichier
 */
export const validateMediaFile = (
  file: File,
  maxSizeMB: number = 50
): { valid: boolean; error?: string } => {
  // Vérifier la taille
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale : ${maxSizeMB}MB`,
    };
  }

  // Vérifier le type MIME
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mov',
    'video/avi',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Type de fichier non supporté',
    };
  }

  return { valid: true };
};

/**
 * Obtenir le type de média depuis le type MIME
 */
export const getMediaTypeFromMime = (mimeType: string): 'image' | 'video' | 'document' => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'document';
};