import { useState, useEffect } from 'react';
import { materialService } from '../services/materialService';
import { transformFirebaseMaterialToMaterial } from '../utils/dataTransformers';
import type { FirebaseMaterial } from '../types/firebase';
import type { Material } from '../types';

export const useFirebaseMaterials = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = materialService.subscribeToMaterials((firebaseMaterials) => {
            try {
                const transformedMaterials = firebaseMaterials.map(transformFirebaseMaterialToMaterial);
                setMaterials(transformedMaterials);
                setLoading(false);
            } catch (err) {
                setError(err as Error);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return { materials, loading, error };
};

export const useFirebaseMaterialsByCategory = (category: string) => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = materialService.subscribeToMaterialsByCategory(category, (firebaseMaterials) => {
            try {
                const transformedMaterials = firebaseMaterials.map(transformFirebaseMaterialToMaterial);
                setMaterials(transformedMaterials);
                setLoading(false);
            } catch (err) {
                setError(err as Error);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [category]);

    return { materials, loading, error };
};

export const useFirebaseMaterial = (id: string) => {
    const [material, setMaterial] = useState<Material | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchMaterial = async () => {
            try {
                const data = await materialService.getMaterialById(id);
                if (data) {
                    setMaterial(transformFirebaseMaterialToMaterial(data));
                }
                setLoading(false);
            } catch (err) {
                setError(err as Error);
                setLoading(false);
            }
        };

        fetchMaterial();
    }, [id]);

    return { material, loading, error };
};
