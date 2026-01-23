import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FirebaseUser } from '../types/firebase';

export class UserService {
    // Récupérer un utilisateur par UID
    async getUserByUid(uid: string): Promise<FirebaseUser | null> {
        try {
            // 1. Try 'users' collection (Backoffice/Chef)
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return userDoc.data() as FirebaseUser;
            }

            // 2. Try 'clients' collection (App Clients)
            const clientDoc = await getDoc(doc(db, 'clients', uid));
            if (clientDoc.exists()) {
                const clientData = clientDoc.data();
                return {
                    uid: clientDoc.id,
                    email: clientData.email,
                    displayName: `${clientData.prenom || ''} ${clientData.nom || ''}`.trim() || 'Client',
                    role: 'client',
                    // Add other fields if necessary to match FirebaseUser
                } as FirebaseUser;
            }

            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            return null;
        }
    }
}

export const userService = new UserService();
