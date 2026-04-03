import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    where,
    serverTimestamp,
    Timestamp,
    arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase'; // Adjust path if needed, assuming standard setup
import { cloudinaryService } from './cloudinaryService';
import { VoiceNoteFeedback } from '../types/firebase';
import { notificationService } from './notificationService';

const FEEDBACKS_SUBCOLLECTION = 'feedbacks';
const CHANTIERS_COLLECTION = 'chantiers';

export const feedbackService = {
    /**
     * Uploads a voice note audio file to Firebase Storage
     */
    uploadAudioFile: async (uri: string, chantierId: string): Promise<string> => {
        try {
            const downloadURL = await cloudinaryService.uploadFile(uri, 'video'); // Cloudinary uses 'video' for audio as well
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
            const feedbackData: any = {
                chantierId,
                phaseId,
                clientId,
                type: 'audio',
                audioUrl,
                duration,
                createdAt: serverTimestamp(),
                status: 'unread',
                readBy: []
            };

            // Only add stepId if it is defined to avoid "Unsupported field value: undefined" error
            if (stepId) {
                feedbackData.stepId = stepId;
            }

            const feedbacksRef = collection(db, CHANTIERS_COLLECTION, chantierId, FEEDBACKS_SUBCOLLECTION);
            const docRef = await addDoc(feedbacksRef, feedbackData);

            // Notifier le destinataire
            try {
                const { chantierService } = await import('./chantierService');
                const chantier = await chantierService.getChantierById(chantierId);
                if (chantier) {
                    // Résoudre l'ID utilisateur du client pour la comparaison
                    const clientUserId = await notificationService.getClientUserId(chantier.clientId);

                    // Si le message ne vient PAS du client (donc vient d'un staff), notifier le client
                    if (clientUserId !== clientId) {
                        if (clientUserId) {
                            await notificationService.notifyNewMessage(
                                clientUserId,
                                "L'équipe",
                                "Note vocale",
                                chantier.name,
                                'client'
                            );
                        }
                    } 
                    // Si le message vient du client, notifier le chef de chantier
                    else if (chantier.assignedChefId) {
                        await notificationService.notifyNewMessage(
                            chantier.assignedChefId,
                            chantier.name,
                            "Note vocale",
                            chantier.name,
                            'backoffice'
                        );
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la création de la notification de note vocale:', error);
            }

            return docRef.id;
        } catch (error) {
            console.error('Error creating voice note:', error);
            throw error;
        }
    },

    /**
     * Creates a new text message feedback document in Firestore
     */
    createTextMessage: async (
        chantierId: string,
        phaseId: string,
        clientId: string,
        text: string,
        stepId?: string
    ): Promise<string> => {
        try {
            const feedbackData: any = {
                chantierId,
                phaseId,
                clientId,
                type: 'text',
                text,
                audioUrl: '', // Placeholder
                duration: 0,
                createdAt: serverTimestamp(),
                status: 'unread',
                readBy: []
            };

            if (stepId) {
                feedbackData.stepId = stepId;
            }

            const feedbacksRef = collection(db, CHANTIERS_COLLECTION, chantierId, FEEDBACKS_SUBCOLLECTION);
            const docRef = await addDoc(feedbacksRef, feedbackData);

            // Notifier le destinataire
            try {
                const { chantierService } = await import('./chantierService');
                const chantier = await chantierService.getChantierById(chantierId);
                if (chantier) {
                    // Résoudre l'ID utilisateur du client pour la comparaison
                    const clientUserId = await notificationService.getClientUserId(chantier.clientId);

                    // Si le message ne vient PAS du client (donc vient d'un staff), notifier le client
                    if (clientUserId !== clientId) {
                        if (clientUserId) {
                            await notificationService.notifyNewMessage(
                                clientUserId,
                                "L'équipe",
                                text,
                                chantier.name,
                                'client'
                            );
                        }
                    }
                    // Si le message vient du client, notifier le chef de chantier
                    else if (chantier.assignedChefId) {
                        await notificationService.notifyNewMessage(
                            chantier.assignedChefId,
                            chantier.name,
                            text,
                            chantier.name,
                            'backoffice'
                        );
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la création de la notification de message:', error);
            }

            return docRef.id;
        } catch (error) {
            console.error('Error creating text message:', error);
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

        const q = query(
            feedbacksRef,
            where('phaseId', '==', phaseId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let feedbacks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as VoiceNoteFeedback[];

            // Filter locally by stepId to avoid needing a composite index
            if (stepId) {
                feedbacks = feedbacks.filter(f => f.stepId === stepId);
            } else {
                // If no stepId provided, we only want feedbacks belonging to the phase directly
                // (some might have a stepId if they were sent from a sub-step)
                feedbacks = feedbacks.filter(f => !f.stepId);
            }

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
    },

    /**
     * Deletes a feedback document from Firestore
     */
    deleteFeedback: async (chantierId: string, feedbackId: string) => {
        try {
            const feedbackRef = doc(db, CHANTIERS_COLLECTION, chantierId, FEEDBACKS_SUBCOLLECTION, feedbackId);
            await deleteDoc(feedbackRef);
        } catch (error) {
            console.error('Error deleting feedback:', error);
            throw error;
        }
    }
};
