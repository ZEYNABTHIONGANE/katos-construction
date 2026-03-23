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
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  },

  // Notifier d'un média ajouté (photo, vidéo, document)
  async notifyMediaUploaded(
    targetId: string, // clientId or userId depending on role
    type: 'photo' | 'video' | 'document_upload' | 'document',
    projectName: string,
    phaseName?: string,
    recipientRole: 'client' | 'backoffice' = 'client'
  ) {
    if (recipientRole === 'backoffice') {
      return; // Désactivé selon la demande utilisateur
    }

    const typeLabel = type === 'photo' ? 'une photo' : type === 'video' ? 'une vidéo' : 'un document';
    
    // Pour le backoffice, on commence toujours par "L'équipe" car ce ne sont pas les clients qui ajoutent les médias
    const senderLabel = "L'équipe";
    
    const locationInfo = (recipientRole === 'client' && phaseName) 
      ? ` de la phase "${phaseName}"` 
      : ` au projet "${projectName}"`;
    
    let userId: string | null = targetId;
    if (recipientRole === 'client') {
      userId = await this.getClientUserId(targetId);
    }
    
    if (!userId) {
      console.warn(`Impossible d'envoyer la notification de média : aucun userId valide pour ${targetId}`);
      return;
    }

    await this.createNotification({
      userId,
      type: (type === 'document_upload' ? 'document_upload' : type) as any,
      title: 'Nouveau média ajouté',
      message: `${senderLabel} a ajouté ${typeLabel}${locationInfo}.`,
      isRead: false,
      link: type === 'document_upload' || type === 'document' ? 'Documents' : 'Chantier'
    });
  },

  // Notifier d'un nouveau message chat
  async notifyNewMessage(
    targetId: string, // clientId or userId depending on role
    senderName: string,
    messagePreview: string,
    projectName?: string,
    recipientRole: 'client' | 'backoffice' = 'client'
  ) {
    if (recipientRole === 'backoffice') {
      return; // Désactivé selon la demande utilisateur
    }

    const projectInfo = projectName ? ` concernant le projet "${projectName}"` : '';
    
    let userId: string | null = targetId;
    if (recipientRole === 'client') {
      userId = await this.getClientUserId(targetId);
    }

    if (!userId) {
      console.warn(`Impossible d'envoyer la notification de message : aucun userId valide pour ${targetId}`);
      return;
    }
    
    await this.createNotification({
      userId,
      type: 'chat',
      title: 'Nouveau message',
      message: `Vous avez un nouveau message de ${senderName}${projectInfo}.`,
      isRead: false,
      link: 'Chat'
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
