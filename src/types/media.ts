/**
 * Types pour la sous-collection 'media'
 * Collection: /projects/{projectId}/media/{id}
 *
 * Index recommandés:
 * - createdAt DESC (pour ordre chronologique)
 * - type, createdAt DESC (médias par type)
 * - category, createdAt DESC (médias par catégorie)
 */

export type MediaType = 'image' | 'video' | 'document';

export interface Media {
  /** ID unique du média */
  id: string;

  /** Type de média */
  type: MediaType;

  /** Chemin de stockage dans Firebase Storage */
  storagePath: string;

  /** URL de téléchargement direct depuis Firebase Storage */
  downloadURL: string;

  /** URL de la miniature (pour vidéos) */
  thumbnailUrl?: string;

  /** Titre/nom du média */
  title?: string;

  /** Légende ou description du média */
  caption?: string;

  /** Catégorie du média (ex: "before", "progress", "after", "materials") */
  category?: string;

  /** Taille du fichier en octets */
  size?: number;

  /** Type MIME */
  mimeType?: string;

  /** Date de création */
  createdAt: Date;

  /** Date de mise à jour */
  updatedAt?: Date;

  /** UID de l'utilisateur qui a uploadé */
  uploadedBy: string;

  /** Date d'upload */
  uploadedAt?: Date;

  /** Métadonnées du fichier */
  metadata?: {
    /** Largeur (pour images/vidéos) */
    width?: number;
    /** Hauteur (pour images/vidéos) */
    height?: number;
    /** Durée (pour vidéos, en secondes) */
    duration?: number;
  };
}

/**
 * Type pour la création d'un nouveau média
 * Exclut les champs générés automatiquement
 */
export type CreateMediaData = Omit<Media, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type pour la mise à jour d'un média
 * Seuls certains champs peuvent être mis à jour
 */
export type UpdateMediaData = Pick<Media, 'title' | 'caption' | 'category' | 'thumbnailUrl'> & {
  updatedAt?: Date;
};

/**
 * Type pour l'upload de média
 * Informations nécessaires avant l'upload
 */
export interface MediaUpload {
  /** URI locale du fichier */
  uri: string;
  /** Type de média */
  type: MediaType;
  /** Nom du fichier */
  filename: string;
  /** Légende optionnelle */
  caption?: string;
  /** Catégorie optionnelle */
  category?: string;
}