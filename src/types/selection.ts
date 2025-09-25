/**
 * Types pour la sous-collection 'selections'
 * Collection: /projects/{projectId}/selections/{id}
 *
 * Index recommandés:
 * - createdAt DESC (pour ordre chronologique)
 * - category, createdAt DESC (sélections par catégorie)
 * - status, createdAt DESC (sélections par statut)
 * - category, status (pour filtres combinés)
 */

export type SelectionStatus = 'pending' | 'validated' | 'rejected';

export interface Selection {
  /** ID unique de la sélection */
  id: string;

  /** Catégorie de la sélection (ex: "flooring", "paint", "fixtures") */
  category: string;

  /** ID de l'item du catalogue sélectionné */
  itemId: string;

  /** Label/nom de la sélection pour affichage */
  label: string;

  /** Note ou commentaire du client */
  note?: string;

  /** Statut de validation par le chef */
  status: SelectionStatus;

  /** Date de création de la sélection */
  createdAt: Date;

  /** Date de la dernière mise à jour du statut */
  statusUpdatedAt?: Date;

  /** UID de l'utilisateur qui a fait la sélection */
  selectedBy: string;

  /** UID de l'utilisateur qui a validé/rejeté (optionnel) */
  reviewedBy?: string;

  /** Commentaire du chef lors de la validation/rejet */
  reviewNote?: string;

  /** Quantité sélectionnée */
  quantity?: number;

  /** Unité de mesure (ex: "m²", "pièces", "litres") */
  unit?: string;

  /** Prix unitaire estimé */
  estimatedPrice?: number;

  /** Référence ou code produit */
  productReference?: string;
}

/**
 * Type pour la création d'une nouvelle sélection
 * Exclut les champs générés automatiquement
 */
export type CreateSelectionData = Omit<
  Selection,
  'id' | 'createdAt' | 'statusUpdatedAt' | 'reviewedBy' | 'reviewNote'
>;

/**
 * Type pour la mise à jour d'une sélection par le client
 */
export type UpdateSelectionData = Pick<
  Selection,
  'label' | 'note' | 'quantity' | 'unit' | 'productReference'
>;

/**
 * Type pour la validation/rejet par le chef
 */
export type ReviewSelectionData = {
  status: 'validated' | 'rejected';
  reviewedBy: string;
  reviewNote?: string;
  statusUpdatedAt: Date;
  estimatedPrice?: number;
};