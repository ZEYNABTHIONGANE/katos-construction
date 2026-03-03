import {
    collection,
    addDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FirebaseProspect {
    id?: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    project?: string;
    // New technical fields
    type?: 'Standard' | 'Custom' | 'Meeting';
    terrainLocation?: string;
    terrainSurface?: string;
    hasTitreFoncier?: boolean;
    budget?: string;
    description?: string;
    planUrl?: string; // For future file storage
    status: 'pending' | 'validated' | 'rejected';
    createdAt: Timestamp;
}

export class ProspectService {
    private collectionName = 'prospects';

    /**
     * Crée une nouvelle demande de prospect (Devenir Propriétaire)
     */
    async addProspect(data: Omit<FirebaseProspect, 'id' | 'status' | 'createdAt'>): Promise<string> {
        try {
            const ref = collection(db, this.collectionName);
            const newProspect: Omit<FirebaseProspect, 'id'> = {
                ...data,
                status: 'pending',
                createdAt: Timestamp.now()
            };

            const docRef = await addDoc(ref, newProspect);
            return docRef.id;
        } catch (error) {
            console.error('Erreur lors de l\'ajout du prospect:', error);
            throw error;
        }
    }
}

export const prospectService = new ProspectService();
