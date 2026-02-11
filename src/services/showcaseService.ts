import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ShowcaseContent {
    heroProject: {
        title: string;
        subtitle: string;
        description: string;
        imageUrl: string;
    };
    promo: {
        active: boolean;
        title: string;
        subtitle: string;
    };
    featuredVillas: string[]; // IDs des projets (villas) mis en avant
}

class ShowcaseService {
    private collectionName = 'settings';
    private docName = 'showcase';

    /**
     * Récupère le contenu du showcase
     */
    async getShowcaseContent(): Promise<ShowcaseContent | null> {
        try {
            const docRef = doc(db, this.collectionName, this.docName);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as ShowcaseContent;
            }
            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération du showcase:', error);
            return null;
        }
    }

    /**
     * S'abonne aux changements du contenu du showcase en temps réel
     */
    subscribeToShowcase(callback: (content: ShowcaseContent | null) => void): () => void {
        const docRef = doc(db, this.collectionName, this.docName);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as ShowcaseContent);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Erreur lors de l\'abonnement au showcase:', error);
        });
    }
}

export const showcaseService = new ShowcaseService();
