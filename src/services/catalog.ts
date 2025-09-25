import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

import { db } from './firebase';
import { CatalogItem, CatalogCategory, CatalogFilters } from '../types/catalog';

// Données de catalogue (normalement chargées depuis un JSON ou API)
const catalogData = [
  {
    "id": "peinture-blanche-mat",
    "category": "paint",
    "subcategory": "murale",
    "label": "Peinture Blanche Mat",
    "description": "Peinture acrylique blanche mate pour murs et plafonds. Excellent pouvoir couvrant.",
    "specs": {
      "material": "Acrylique",
      "color": "Blanc",
      "finish": "Mat",
      "brand": "Dulux",
      "reference": "DLX-BL-MAT-001",
      "rendement": "12 m²/L"
    },
    "images": ["https://via.placeholder.com/300x200?text=Peinture+Blanche+Mat"],
    "basePrice": 35,
    "priceUnit": "litre",
    "isAvailable": true,
    "isActive": true,
    "searchTerms": ["peinture", "blanche", "mat", "acrylique", "dulux"]
  },
  {
    "id": "carrelage-metro-blanc",
    "category": "tiles",
    "subcategory": "mural",
    "label": "Carrelage Métro Blanc",
    "description": "Carrelage métro blanc brillant 7.5x15 cm, style parisien classique.",
    "specs": {
      "material": "Céramique",
      "dimensions": "7.5 x 15 cm",
      "color": "Blanc",
      "finish": "Brillant",
      "brand": "Cerabati",
      "reference": "CER-MET-BL-001",
      "epaisseur": "6 mm"
    },
    "images": ["https://via.placeholder.com/300x200?text=Carrelage+Metro+Blanc"],
    "basePrice": 25,
    "priceUnit": "m²",
    "isAvailable": true,
    "isActive": true,
    "searchTerms": ["carrelage", "metro", "blanc", "brillant", "parisien", "cerabati"]
  },
  {
    "id": "parquet-chene-massif",
    "category": "flooring",
    "subcategory": "parquet",
    "label": "Parquet Chêne Massif",
    "description": "Parquet chêne massif 14 mm, finition huilée naturelle.",
    "specs": {
      "material": "Chêne massif",
      "dimensions": "14 x 125 x 1000 mm",
      "color": "Chêne naturel",
      "finish": "Huilé naturel",
      "brand": "Panaget",
      "reference": "PAN-CHE-HUI-001",
      "epaisseur": "14 mm"
    },
    "images": ["https://via.placeholder.com/300x200?text=Parquet+Chene+Massif"],
    "basePrice": 85,
    "priceUnit": "m²",
    "isAvailable": true,
    "isActive": true,
    "searchTerms": ["parquet", "chene", "massif", "huile", "panaget", "naturel"]
  }
];

/**
 * Service pour gérer le catalogue d'éléments
 */

/**
 * Initialiser le catalogue en chargeant les données depuis le JSON local
 * À n'exécuter qu'une fois pour peupler Firestore
 */
export const seedCatalog = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding catalogue Firestore...');

    const batch = [];
    const catalogCollection = collection(db, 'catalog');

    for (const item of catalogData) {
      const catalogItem: Omit<CatalogItem, 'createdAt' | 'updatedAt'> = {
        ...item,
        createdBy: 'system', // Ajouté par le système
      };

      // Créer le document avec l'ID spécifié
      const docRef = doc(catalogCollection, item.id);
      const itemWithDates = {
        ...catalogItem,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      batch.push(setDoc(docRef, itemWithDates));
    }

    await Promise.all(batch);

    console.log(`✅ Catalogue initialisé avec ${catalogData.length} éléments`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du catalogue:', error);
    throw new Error('Impossible d\'initialiser le catalogue');
  }
};

/**
 * Récupérer tous les éléments du catalogue
 */
export const getCatalogItems = async (filters?: CatalogFilters): Promise<CatalogItem[]> => {
  try {
    console.log('📖 Chargement catalogue avec filtres:', filters);

    let catalogQuery = query(
      collection(db, 'catalog'),
      where('isActive', '==', true),
      orderBy('category'),
      orderBy('label')
    );

    // Appliquer les filtres
    if (filters?.category) {
      catalogQuery = query(catalogQuery, where('category', '==', filters.category));
    }

    if (filters?.isAvailable !== undefined) {
      catalogQuery = query(catalogQuery, where('isAvailable', '==', filters.isAvailable));
    }

    const querySnapshot = await getDocs(catalogQuery);

    let items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        // Convertir les dates Firestore
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as CatalogItem;
    });

    // Filtres côté client (pour les cas non couverts par Firestore)
    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      items = items.filter(item =>
        item.searchTerms.some(term => term.toLowerCase().includes(searchLower)) ||
        item.label.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.priceRange) {
      items = items.filter(item => {
        if (!item.basePrice) return true;
        if (filters.priceRange!.min && item.basePrice < filters.priceRange!.min) return false;
        if (filters.priceRange!.max && item.basePrice > filters.priceRange!.max) return false;
        return true;
      });
    }

    console.log(`✅ ${items.length} éléments trouvés`);
    return items;

  } catch (error) {
    console.error('❌ Erreur récupération catalogue:', error);
    throw new Error('Impossible de charger le catalogue');
  }
};

/**
 * Récupérer un élément du catalogue par ID
 */
export const getCatalogItem = async (itemId: string): Promise<CatalogItem | null> => {
  try {
    const itemDoc = await getDocs(
      query(collection(db, 'catalog'), where('id', '==', itemId))
    );

    if (itemDoc.empty) {
      return null;
    }

    const data = itemDoc.docs[0].data();
    return {
      ...data,
      id: itemDoc.docs[0].id,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as CatalogItem;

  } catch (error) {
    console.error('❌ Erreur récupération élément catalogue:', error);
    return null;
  }
};

/**
 * Récupérer les catégories disponibles avec leurs counts
 */
export const getCatalogCategories = async (): Promise<Array<{
  category: string;
  count: number;
  label: string;
}>> => {
  try {
    const items = await getCatalogItems();
    const categoryCounts = new Map<string, number>();

    // Compter les éléments par catégorie
    items.forEach(item => {
      const current = categoryCounts.get(item.category) || 0;
      categoryCounts.set(item.category, current + 1);
    });

    // Mapper vers les labels français
    const categoryLabels: { [key: string]: string } = {
      'paint': 'Peinture',
      'tiles': 'Carrelage',
      'flooring': 'Revêtements sol',
      'fixtures': 'Sanitaires',
      'lighting': 'Éclairage',
      'hardware': 'Électricité',
      'materials': 'Matériaux',
    };

    return Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      count,
      label: categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1),
    }));

  } catch (error) {
    console.error('❌ Erreur récupération catégories:', error);
    return [];
  }
};

/**
 * Rechercher dans le catalogue
 */
export const searchCatalog = async (searchTerm: string): Promise<CatalogItem[]> => {
  return getCatalogItems({ searchTerm });
};