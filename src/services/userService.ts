import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FirebaseUser } from '../types/firebase';

export class UserService {
    // Récupérer un utilisateur par UID
    async getUserByUid(uid: string): Promise<FirebaseUser | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            return userDoc.exists() ? userDoc.data() as FirebaseUser : null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            return null;
        }
    }
}

export const userService = new UserService();
