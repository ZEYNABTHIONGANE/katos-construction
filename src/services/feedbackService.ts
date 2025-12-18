import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    where,
    serverTimestamp,
    Timestamp,
    arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase'; // Adjust path if needed, assuming standard setup
import { VoiceNoteFeedback } from '../types/firebase';

const FEEDBACKS_SUBCOLLECTION = 'feedbacks';
const CHANTIERS_COLLECTION = 'chantiers';

export const feedbackService = {
    /**
     * Uploads a voice note audio file to Firebase Storage
     */
    uploadAudioFile: async (uri: string, chantierId: string): Promise<string> => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const filename = `voice_notes/${chantierId}/${Date.now()}.m4a`; // Assuming m4a from expo-av
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error('Error uploading audio file:', error);
            throw error;
        }
    },

    /**
     * Creates a new voice note feedback document in Firestore
     */
    createVoiceNote: async (
        chantierId: string,
        phaseId: string,
        clientId: string,
        audioUrl: string,
        duration: number,
        stepId?: string
    ): Promise<string> => {
        try {
            const feedbackData: Omit<VoiceNoteFeedback, 'id'> = {
                chantierId,
                phaseId,
                stepId,
                clientId,
                audioUrl,
                duration,
                createdAt: serverTimestamp() as Timestamp,
                status: 'unread',
                readBy: []
            };

            // Sanitize undefined stepId if needed, but Firestore handles it (fields undefined are not saved)
            // Actually strictly typing Omit<VoiceNoteFeedback, 'id'> requires all keys, 
            // but let's ensure we passed exactly what we want.

            const feedbacksRef = collection(db, CHANTIERS_COLLECTION, chantierId, FEEDBACKS_SUBCOLLECTION);
            const docRef = await addDoc(feedbacksRef, feedbackData);
            return docRef.id;
        } catch (error) {
            console.error('Error creating voice note:', error);
            throw error;
        }
    },

    /**
     * Subscribes to voice notes for a specific step (or phase)
     */
    subscribeToStepFeedbacks: (
        chantierId: string,
        phaseId: string,
        onUpdate: (feedbacks: VoiceNoteFeedback[]) => void,
        stepId?: string
    ) => {
        const feedbacksRef = collection(db, CHANTIERS_COLLECTION, chantierId, FEEDBACKS_SUBCOLLECTION);

        let q = query(
            feedbacksRef,
            where('phaseId', '==', phaseId),
            orderBy('createdAt', 'desc')
        );

        if (stepId) {
            q = query(q, where('stepId', '==', stepId));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const feedbacks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as VoiceNoteFeedback[];

            onUpdate(feedbacks);
        }, (error) => {
            console.error("Error creating feedback listener:", error);
        });

        return unsubscribe;
    },

    /**
     * Marks a feedback as read by a specific user
     */
    markAsRead: async (chantierId: string, feedbackId: string, userId: string) => {
        try {
            const feedbackRef = doc(db, CHANTIERS_COLLECTION, chantierId, FEEDBACKS_SUBCOLLECTION, feedbackId);
            await updateDoc(feedbackRef, {
                readBy: arrayUnion(userId)
            });
        } catch (error) {
            console.error('Error marking feedback as read:', error);
        }
    }
};
