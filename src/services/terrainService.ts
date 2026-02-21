
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FirebaseTerrain, COLLECTIONS } from '../types/firebase';

export const terrainService = {
    async getTerrains() {
        const q = query(
            collection(db, COLLECTIONS.terrains),
            where('status', '==', 'Disponible')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FirebaseTerrain));
    },

    subscribeToTerrains(callback: (terrains: FirebaseTerrain[]) => void) {
        const q = query(
            collection(db, COLLECTIONS.terrains),
            where('status', '==', 'Disponible')
        );

        return onSnapshot(q, (snapshot) => {
            const terrains = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FirebaseTerrain));
            callback(terrains);
        });
    },

    async searchTerrains(zone: string) {
        let q = query(
            collection(db, COLLECTIONS.terrains),
            where('status', '==', 'Disponible')
        );

        if (zone) {
            // Firestore doesn't support case-insensitive contains natively well
            // For now, we'll do a simple filter or perfect match
            q = query(
                collection(db, COLLECTIONS.terrains),
                where('status', '==', 'Disponible'),
                where('zone', '==', zone)
            );
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FirebaseTerrain));
    },

    async submitInterest(terrainId: string, interestData: any) {
        return addDoc(collection(db, 'terrainInterests'), {
            terrainId,
            ...interestData,
            createdAt: Timestamp.now(),
            status: 'pending'
        });
    }
};
