import { useState, useEffect } from 'react';
import { materialService } from '../services/materialService';
import type { FirebaseMaterial } from '../types/firebase';

export const useFirebaseMaterials = () => {
  const [materials, setMaterials] = useState<FirebaseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = materialService.subscribeToMaterials((materials) => {
      setMaterials(materials);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const addMaterial = async (materialData: Omit<FirebaseMaterial, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      return await materialService.addMaterial(materialData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateMaterial = async (id: string, updates: Partial<Omit<FirebaseMaterial, 'id' | 'createdAt'>>) => {
    try {
      setError(null);
      await materialService.updateMaterial(id, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      setError(null);
      await materialService.deleteMaterial(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const searchMaterials = async (searchTerm: string) => {
    try {
      setError(null);
      return await materialService.searchMaterials(searchTerm);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getMaterialsByCategory = async (category: string) => {
    try {
      setError(null);
      return await materialService.getMaterialsByCategory(category);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getMaterialsBySupplier = async (supplier: string) => {
    try {
      setError(null);
      return await materialService.getMaterialsBySupplier(supplier);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getCategories = async () => {
    try {
      setError(null);
      return await materialService.getCategories();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getSuppliers = async () => {
    try {
      setError(null);
      return await materialService.getSuppliers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getPriceStatistics = async () => {
    try {
      setError(null);
      return await materialService.getPriceStatistics();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    materials,
    loading,
    error,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    searchMaterials,
    getMaterialsByCategory,
    getMaterialsBySupplier,
    getCategories,
    getSuppliers,
    getPriceStatistics
  };
};

export const useFirebaseMaterialsByCategory = (category: string) => {
  const [materials, setMaterials] = useState<FirebaseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = materialService.subscribeToMaterialsByCategory(category, (materials) => {
      setMaterials(materials);
      setLoading(false);
    });

    return unsubscribe;
  }, [category]);

  return {
    materials,
    loading,
    error
  };
};

export const useFirebaseMaterial = (id: string) => {
  const [material, setMaterial] = useState<FirebaseMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setError(null);
        setLoading(true);
        const materialData = await materialService.getMaterialById(id);
        setMaterial(materialData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMaterial();
    }
  }, [id]);

  return {
    material,
    loading,
    error
  };
};