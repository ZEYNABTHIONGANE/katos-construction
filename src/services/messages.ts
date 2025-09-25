import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  runTransaction,
  writeBatch,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import { db } from './firebase';
import { CreateMessageData, UpdateMessageData } from '../types/message';

/**
 * Service pour gérer les messages du chat
 */

/**
 * Envoyer un nouveau message
 */
export const sendMessage = async (
  projectId: string,
  messageData: CreateMessageData
): Promise<string> => {
  try {
    console.log('📤 Envoi message:', messageData.text?.substring(0, 50));

    // Utiliser une transaction pour garantir la cohérence
    const messageId = await runTransaction(db, async (transaction) => {
      // 1. Créer le message dans la sous-collection
      const messagesCollectionRef = collection(db, 'projects', projectId, 'messages');
      const messageDocRef = doc(messagesCollectionRef); // Générer un ID automatiquement

      // Données du message avec serverTimestamp
      const messageDoc = {
        ...messageData,
        createdAt: serverTimestamp(),
        isRead: false, // Par défaut non lu
      };

      transaction.set(messageDocRef, messageDoc);

      // 2. Mettre à jour le projet avec le dernier message
      const projectRef = doc(db, 'projects', projectId);
      const lastMessageData = {
        lastMessage: {
          text: messageData.text || '[Média]',
          fromUid: messageData.fromUid,
          createdAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      };

      transaction.update(projectRef, lastMessageData);

      return messageDocRef.id;
    });

    console.log('✅ Message envoyé avec succès:', messageId);
    return messageId;

  } catch (error) {
    console.error('❌ Erreur envoi message:', error);
    throw new Error('Impossible d\'envoyer le message');
  }
};

/**
 * Marquer un message comme lu
 */
export const markMessageAsRead = async (
  projectId: string,
  messageId: string
): Promise<void> => {
  try {
    const messageRef = doc(db, 'projects', projectId, 'messages', messageId);
    await updateDoc(messageRef, {
      isRead: true,
    } as UpdateMessageData);

    console.log('✅ Message marqué comme lu:', messageId);
  } catch (error) {
    console.error('❌ Erreur marquage message lu:', error);
    throw new Error('Impossible de marquer le message comme lu');
  }
};

/**
 * Marquer tous les messages d'un utilisateur comme lus
 * (tous les messages reçus par l'utilisateur actuel)
 */
export const markAllMessagesAsRead = async (
  projectId: string,
  currentUserId: string
): Promise<void> => {
  try {
    console.log('📖 Marquage tous messages comme lus pour:', currentUserId);

    // Requête pour obtenir tous les messages non lus de cet utilisateur
    // (messages reçus par l'utilisateur actuel)
    const unreadMessagesQuery = query(
      collection(db, 'projects', projectId, 'messages'),
      where('fromUid', '!=', currentUserId),
      where('isRead', '==', false)
    );

    const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);

    if (unreadMessagesSnapshot.empty) {
      console.log('📖 Aucun message non lu trouvé');
      return;
    }

    // Utiliser un batch pour marquer plusieurs messages
    const batch = writeBatch(db);

    unreadMessagesSnapshot.docs.forEach(messageDoc => {
      const messageRef = doc(db, 'projects', projectId, 'messages', messageDoc.id);
      batch.update(messageRef, { isRead: true } as UpdateMessageData);
    });

    await batch.commit();

    console.log(`✅ ${unreadMessagesSnapshot.size} messages marqués comme lus`);
  } catch (error) {
    console.error('❌ Erreur marquage tous messages lus:', error);
    throw new Error('Impossible de marquer tous les messages comme lus');
  }
};

/**
 * Envoyer un message avec média (préparation pour plus tard)
 */
export const sendMessageWithMedia = async (
  projectId: string,
  messageData: CreateMessageData,
  mediaUrl: string,
  mediaType: 'image' | 'video' | 'document'
): Promise<string> => {
  const messageWithMedia: CreateMessageData = {
    ...messageData,
    mediaUrl,
    mediaType,
  };

  return sendMessage(projectId, messageWithMedia);
};