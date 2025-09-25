import { useState, useEffect } from 'react';
import { CatalogItem, CatalogFilters } from '../types/catalog';
import { getCatalogItems, getCatalogCategories, getCatalogItem } from '../services/catalog';

/**
 * Hook pour charger le catalogue avec filtres
 */
export const useCatalog = (filters?: CatalogFilters) => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      setError(null);

      try {
        const catalogItems = await getCatalogItems(filters);
        setItems(catalogItems);
      } catch (err) {
        console.error('❌ Erreur chargement catalogue:', err);
        setError('Impossible de charger le catalogue');
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, [filters?.category, filters?.isAvailable, filters?.searchTerm]);

  return {
    items,
    loading,
    error,
    refetch: () => {
      // Force reload
      const loadCatalog = async () => {
        setLoading(true);
        setError(null);

        try {
          const catalogItems = await getCatalogItems(filters);
          setItems(catalogItems);
        } catch (err) {
          console.error('❌ Erreur chargement catalogue:', err);
          setError('Impossible de charger le catalogue');
        } finally {
          setLoading(false);
        }
      };

      loadCatalog();
    },
  };
};

/**
 * Hook pour charger les catégories du catalogue
 */
export const useCatalogCategories = () => {
  const [categories, setCategories] = useState<Array<{
    category: string;
    count: number;
    label: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const catalogCategories = await getCatalogCategories();
        setCategories(catalogCategories);
      } catch (err) {
        console.error('❌ Erreur chargement catégories:', err);
        setError('Impossible de charger les catégories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return {
    categories,
    loading,
    error,
  };
};

/**
 * Hook pour charger un élément du catalogue par ID
 */
export const useCatalogItem = (itemId: string | null) => {
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      setLoading(false);
      setError(null);
      return;
    }

    const loadItem = async () => {
      setLoading(true);
      setError(null);

      try {
        const catalogItem = await getCatalogItem(itemId);
        setItem(catalogItem);
      } catch (err) {
        console.error('❌ Erreur chargement élément catalogue:', err);
        setError('Impossible de charger l\'élément');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [itemId]);

  return {
    item,
    loading,
    error,
  };
};