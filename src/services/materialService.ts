import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  where,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FirebaseMaterial } from '../types/firebase';
import { COLLECTIONS } from '../types/firebase';

export class MaterialService {
  private collectionName = COLLECTIONS.materials;

  /**
   * Add a new material
   */
  async addMaterial(materialData: Omit<FirebaseMaterial, 'id' | 'createdAt'>): Promise<string> {
    const materialRef = collection(db, this.collectionName);
    const newMaterial = {
      ...materialData,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(materialRef, newMaterial);
    return docRef.id;
  }

  /**
   * Get all materials
   */
  async getMaterials(): Promise<FirebaseMaterial[]> {
    const materialRef = collection(db, this.collectionName);
    const q = query(materialRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseMaterial));
  }

  /**
   * Get a single material by ID
   */
  async getMaterialById(id: string): Promise<FirebaseMaterial | null> {
    const materialRef = doc(db, this.collectionName, id);
    const materialDoc = await getDoc(materialRef);

    if (materialDoc.exists()) {
      return {
        id: materialDoc.id,
        ...materialDoc.data()
      } as FirebaseMaterial;
    }

    return null;
  }

  /**
   * Get materials by category
   */
  async getMaterialsByCategory(category: string): Promise<FirebaseMaterial[]> {
    const materialRef = collection(db, this.collectionName);
    const q = query(
      materialRef,
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseMaterial));
  }

  /**
   * Get materials by supplier
   */
  async getMaterialsBySupplier(supplier: string): Promise<FirebaseMaterial[]> {
    const materialRef = collection(db, this.collectionName);
    const q = query(
      materialRef,
      where('supplier', '==', supplier),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseMaterial));
  }

  /**
   * Get materials by price range
   */
  async getMaterialsByPriceRange(minPrice: number, maxPrice: number): Promise<FirebaseMaterial[]> {
    const materialRef = collection(db, this.collectionName);
    const q = query(
      materialRef,
      where('price', '>=', minPrice),
      where('price', '<=', maxPrice),
      orderBy('price', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseMaterial));
  }

  /**
   * Get recent materials (limited number)
   */
  async getRecentMaterials(limitCount: number = 10): Promise<FirebaseMaterial[]> {
    const materialRef = collection(db, this.collectionName);
    const q = query(
      materialRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseMaterial));
  }

  /**
   * Update a material
   */
  async updateMaterial(id: string, updates: Partial<Omit<FirebaseMaterial, 'id' | 'createdAt'>>): Promise<void> {
    const materialRef = doc(db, this.collectionName, id);
    await updateDoc(materialRef, updates);
  }

  /**
   * Delete a material
   */
  async deleteMaterial(id: string): Promise<void> {
    const materialRef = doc(db, this.collectionName, id);
    await deleteDoc(materialRef);
  }

  /**
   * Subscribe to real-time material updates
   */
  subscribeToMaterials(callback: (materials: FirebaseMaterial[]) => void): () => void {
    const materialRef = collection(db, this.collectionName);
    const q = query(materialRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const materials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseMaterial));
      callback(materials);
    });
  }

  /**
   * Subscribe to materials by category with real-time updates
   */
  subscribeToMaterialsByCategory(
    category: string,
    callback: (materials: FirebaseMaterial[]) => void
  ): () => void {
    const materialRef = collection(db, this.collectionName);
    const q = query(
      materialRef,
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const materials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseMaterial));
      callback(materials);
    });
  }

  /**
   * Search materials by name or description
   */
  async searchMaterials(searchTerm: string): Promise<FirebaseMaterial[]> {
    const materials = await this.getMaterials();
    const lowercaseSearch = searchTerm.toLowerCase();

    return materials.filter(material =>
      material.name.toLowerCase().includes(lowercaseSearch) ||
      material.description.toLowerCase().includes(lowercaseSearch) ||
      material.supplier.toLowerCase().includes(lowercaseSearch)
    );
  }

  /**
   * Get unique categories
   */
  async getCategories(): Promise<string[]> {
    const materials = await this.getMaterials();
    const categories = materials.map(material => material.category);
    return [...new Set(categories)].sort();
  }

  /**
   * Get unique suppliers
   */
  async getSuppliers(): Promise<string[]> {
    const materials = await this.getMaterials();
    const suppliers = materials.map(material => material.supplier);
    return [...new Set(suppliers)].sort();
  }

  /**
   * Get price statistics (min, max, average)
   */
  async getPriceStatistics(): Promise<{ min: number; max: number; average: number }> {
    const materials = await this.getMaterials();

    if (materials.length === 0) {
      return { min: 0, max: 0, average: 0 };
    }

    const prices = materials.map(material => material.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return { min, max, average: Math.round(average * 100) / 100 };
  }
}

export const materialService = new MaterialService();