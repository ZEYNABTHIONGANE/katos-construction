/**
 * Types pour la collection globale 'catalog'
 * Collection: /catalog/{id}
 *
 * Index recommandés:
 * - category, label ASC (pour navigation par catégorie)
 * - category, isActive DESC (items actifs par catégorie)
 * - searchTerms (pour recherche textuelle)
 */

export interface CatalogItem {
  /** ID unique de l'item du catalogue */
  id: string;

  /** Catégorie de l'item (ex: "flooring", "paint", "fixtures", "tiles") */
  category: string;

  /** Sous-catégorie (ex: "ceramic", "porcelain" pour tiles) */
  subcategory?: string;

  /** Nom/label de l'item */
  label: string;

  /** Description détaillée */
  description?: string;

  /** Spécifications techniques */
  specs?: {
    /** Matériau */
    material?: string;
    /** Dimensions */
    dimensions?: string;
    /** Couleur principale */
    color?: string;
    /** Finition */
    finish?: string;
    /** Marque */
    brand?: string;
    /** Référence fabricant */
    reference?: string;
    /** Caractéristiques techniques libres */
    [key: string]: string | undefined;
  };

  /** URLs des images */
  images?: string[];

  /** Prix indicatif */
  basePrice?: number;

  /** Unité de prix (ex: "m²", "pièce", "litre") */
  priceUnit?: string;

  /** Disponibilité */
  isAvailable?: boolean;

  /** Item actif dans le catalogue */
  isActive: boolean;

  /** Termes de recherche pour la recherche textuelle */
  searchTerms: string[];

  /** Date de création */
  createdAt: Date;

  /** Dernière mise à jour */
  updatedAt: Date;

  /** Créé par (UID admin) */
  createdBy: string;
}

/**
 * Type pour la création d'un nouvel item de catalogue
 * Exclut les champs générés automatiquement
 */
export type CreateCatalogItemData = Omit<
  CatalogItem,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * Type pour la mise à jour d'un item de catalogue
 */
export type UpdateCatalogItemData = Partial<
  Omit<CatalogItem, 'id' | 'createdAt' | 'createdBy'>
> & {
  updatedAt: Date;
};

/**
 * Catégories prédéfinies du catalogue
 */
export const CATALOG_CATEGORIES = {
  FLOORING: 'flooring',
  PAINT: 'paint',
  TILES: 'tiles',
  FIXTURES: 'fixtures',
  LIGHTING: 'lighting',
  HARDWARE: 'hardware',
  MATERIALS: 'materials',
} as const;

export type CatalogCategory = typeof CATALOG_CATEGORIES[keyof typeof CATALOG_CATEGORIES];

/**
 * Type pour les filtres de recherche dans le catalogue
 */
export interface CatalogFilters {
  category?: CatalogCategory;
  subcategory?: string;
  isAvailable?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
  searchTerm?: string;
}