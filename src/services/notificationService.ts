import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  where,
  getDocs,
  addDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Notification } from '../types';
import { pushNotificationService } from './pushNotificationService';

export const notificationService = {
  // Résoudre un clientId (collection 'clients') en userId (UID Firebase Auth)
  async getClientUserId(clientId: string): Promise<string | null> {
    try {
      if (!clientId) return null;
      const clientDoc = await getDoc(doc(db, 'clients', clientId));
      if (clientDoc.exists()) {
        const clientData = clientDoc.data();
        return clientData.userId || null;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la résolution du userId du client:', error);
      return null;
    }
  },

  // Récupérer le Push Token d'un utilisateur
  async getPushTokenByUserId(userId: string): Promise<string | null> {
    try {
      if (!userId) return null;
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.expoPushToken || null;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du push token:', error);
      return null;
    }
  },

  // Écouter les notifications en temps réel
  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt
      })) as Notification[];

      // Sort in memory to avoid needing a composite index
      notifications.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      callback(notifications);
    }, (error) => {
      console.error('Erreur lors de l\'écoute des notifications:', error);
      callback([]);
    });
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      throw error;
    }
  },

  // Marquer toutes les notifications comme lues pour un utilisateur
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(docSnapshot =>
        updateDoc(docSnapshot.ref, { isRead: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      throw error;
    }
  },

  // Créer une notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp()
      });

      // --- OPTION A: Envoi direct de la Push Notification ---
      try {
        if (notification.userId) {
          const pushToken = await this.getPushTokenByUserId(notification.userId);
          if (pushToken) {
            await pushNotificationService.sendPushNotification(
              pushToken,
              notification.title,
              notification.message,
              { link: notification.link, type: notification.type }
            );
          }
        }
      } catch (pushError) {
        console.error('Erreur lors de l\'envoi de la push (Option A):', pushError);
      }
      // ------------------------------------------------------

    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  },

  // Notifier d'un média ajouté (photo, vidéo, document)
  async notifyMediaUploaded(
    userId: string,
    type: 'photo' | 'video' | 'document_upload' | 'document',
    projectName: string,
    phaseName?: string,
    recipientRole: 'client' | 'backoffice' = 'client'
  ) {
    const typeLabel = type === 'video' ? 'une vidéo' : type === 'photo' ? 'une photo' : 'un document';
    const message = `Nouvelle ${typeLabel} ajoutée pour le projet ${projectName}${phaseName ? ` (${phaseName})` : ''}.`;
    
    await this.createNotification({
      userId,
      type: type === 'document_upload' ? 'document_upload' : type === 'video' ? 'video' : 'photo',
      title: 'Nouveau média',
      message,
      isRead: false,
      link: recipientRole === 'client' ? '/chantier' : '/projects'
    });
  },

  // Notifier d'un nouveau message chat
  async notifyNewMessage(
    userId: string,
    senderName: string,
    messagePreview: string,
    projectName?: string,
    recipientRole: 'client' | 'backoffice' = 'client'
  ) {
    await this.createNotification({
      userId,
      type: 'chat',
      title: 'Nouveau message',
      message: projectName 
        ? `Nouveau message de ${senderName} pour le projet ${projectName} : "${messagePreview}"`
        : `Nouveau message de ${senderName} : "${messagePreview}"`,
      isRead: false,
      link: recipientRole === 'client' ? '/chat' : '/messages'
    });
  },

  // Notifier la fin d'une phase
  async notifyPhaseCompleted(
    clientId: string,
    projectName: string,
    phaseName: string
  ) {
    const userId = await this.getClientUserId(clientId);
    if (!userId) return;

    await this.createNotification({
      userId,
      type: 'photo', // Ou un type spécifique 'phase' si disponible
      title: 'Phase terminée !',
      message: `Bonne nouvelle ! La phase "${phaseName}" de votre projet "${projectName}" est terminée à 100%.`,
      isRead: false,
      link: '/chantier'
    });
  },

  // Notifier d'un changement de statut du projet
  async notifyProjectStatusChanged(
    clientId: string,
    projectName: string,
    newStatus: string
  ) {
    const userId = await this.getClientUserId(clientId);
    if (!userId) return;

    await this.createNotification({
      userId,
      type: 'client_update',
      title: 'Mise à jour du projet',
      message: `Le statut de votre projet "${projectName}" est désormais : ${newStatus}.`,
      isRead: false,
      link: '/chantier'
    });
  },

  // Obtenir l'icône selon le type de notification (utilisé par NotificationScreen)
  getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'document_upload': return 'description';
      case 'material_selection': return 'shopping-cart';
      case 'client_update': return 'person';
      case 'payment': return 'receipt';
      case 'photo': return 'photo-library';
      case 'video': return 'videocam';
      case 'chat': return 'chat';
      default: return 'notifications';
    }
  },

  // Obtenir la couleur selon le type
  getNotificationColor(type: Notification['type']): string {
    switch (type) {
      case 'payment': return '#2B2E83';
      case 'chat': return '#0284C7';
      case 'photo': 
      case 'video': return '#DB2777';
      default: return '#E96C2E';
    }
  },

  // Formater le temps relatif
  getRelativeTime(timestamp: any): string {
    if (!timestamp) return 'À l\'instant';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays} j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  },

  // Compter les non lues
  countUnreadNotifications(notifications: Notification[]): number {
    return notifications.filter(n => !n.isRead).length;
  }
};
