import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UnifiedDocument, DocumentNotification } from '../types/documents';

export class MobileDocumentService {
  private documentsCollection = 'unifiedDocuments';
  private notificationsCollection = 'documentNotifications';

  /**
   * Récupérer tous les documents visibles par le client (lecture seule)
   * Seuls les documents avec visibility 'client_only' ou 'both' sont retournés
   */
  async getClientDocuments(clientId: string): Promise<UnifiedDocument[]> {
    try {
      const q = query(
        collection(db, this.documentsCollection),
        where('clientId', '==', clientId),
        where('status', '==', 'active'),
        where('visibility', 'in', ['client_only', 'both']),
        orderBy('uploadedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UnifiedDocument[];
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw error;
    }
  }

  /**
   * Écouter les documents en temps réel (pour le mobile)
   */
  subscribeToClientDocuments(
    clientId: string,
    callback: (documents: UnifiedDocument[]) => void
  ): () => void {
    const q = query(
      collection(db, this.documentsCollection),
      where('clientId', '==', clientId),
      where('status', '==', 'active'),
      where('visibility', 'in', ['client_only', 'both']),
      orderBy('uploadedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UnifiedDocument[];
      callback(documents);
    });
  }

  /**
   * Récupérer les documents par catégorie pour l'affichage mobile
   */
  async getDocumentsByCategory(clientId: string): Promise<{
    contracts: UnifiedDocument[];
    invoices: UnifiedDocument[];
    plans: UnifiedDocument[];
    photos: UnifiedDocument[];
    reports: UnifiedDocument[];
    other: UnifiedDocument[];
  }> {
    const documents = await this.getClientDocuments(clientId);

    return {
      contracts: documents.filter(doc => doc.type === 'contract'),
      invoices: documents.filter(doc => doc.type === 'invoice'),
      plans: documents.filter(doc => doc.type === 'plan'),
      photos: documents.filter(doc => doc.type === 'photo'),
      reports: documents.filter(doc => doc.type === 'report' || doc.type === 'progress_update'),
      other: documents.filter(doc => !['contract', 'invoice', 'plan', 'photo', 'report', 'progress_update'].includes(doc.type))
    };
  }

  /**
   * Récupérer les notifications de documents pour le client
   */
  async getDocumentNotifications(clientId: string): Promise<DocumentNotification[]> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DocumentNotification[];
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Écouter les notifications en temps réel
   */
  subscribeToDocumentNotifications(
    clientId: string,
    callback: (notifications: DocumentNotification[]) => void
  ): () => void {
    const q = query(
      collection(db, this.notificationsCollection),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DocumentNotification[];
      callback(notifications);
    });
  }

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notifRef = doc(db, this.notificationsCollection, notificationId);
      await updateDoc(notifRef, { isRead: true });
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      throw error;
    }
  }

  /**
   * Marquer toutes les notifications comme lues pour un client
   */
  async markAllNotificationsAsRead(clientId: string): Promise<void> {
    try {
      const notifications = await this.getDocumentNotifications(clientId);
      const unreadNotifications = notifications.filter(notif => !notif.isRead);

      const updatePromises = unreadNotifications.map(notif =>
        this.markNotificationAsRead(notif.id!)
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
      throw error;
    }
  }

  /**
   * Compter les notifications non lues
   */
  async getUnreadNotificationCount(clientId: string): Promise<number> {
    try {
      const notifications = await this.getDocumentNotifications(clientId);
      return notifications.filter(notif => !notif.isRead).length;
    } catch (error) {
      console.error('Erreur lors du comptage des notifications:', error);
      return 0;
    }
  }

  /**
   * Vérifier si un document peut être téléchargé par le client
   */
  canDownloadDocument(document: UnifiedDocument): boolean {
    return document.allowClientDownload && document.status === 'active';
  }

  /**
   * Vérifier si un document est en lecture seule pour le client
   */
  isDocumentReadOnly(document: UnifiedDocument): boolean {
    // Les documents envoyés par l'admin sont toujours en lecture seule
    if (document.source === 'admin_upload') {
      return true;
    }

    // Les documents avec isReadOnly activé
    if (document.isReadOnly) {
      return true;
    }

    // Les documents approuvés peuvent être considérés comme lecture seule
    if (document.isApproved) {
      return true;
    }

    return false;
  }

  /**
   * Obtenir les statistiques de documents pour le dashboard mobile
   */
  async getDocumentStats(clientId: string): Promise<{
    totalDocuments: number;
    newDocuments: number; // Documents de la semaine
    byCategory: Record<string, number>;
    unreadNotifications: number;
  }> {
    try {
      const [documents, notifications] = await Promise.all([
        this.getClientDocuments(clientId),
        this.getDocumentNotifications(clientId)
      ]);

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newDocuments = documents.filter(doc =>
        doc.uploadedAt.toDate() > weekAgo
      );

      const byCategory: Record<string, number> = {};
      documents.forEach(doc => {
        const category = this.getCategoryDisplayName(doc.type);
        byCategory[category] = (byCategory[category] || 0) + 1;
      });

      const unreadNotifications = notifications.filter(notif => !notif.isRead).length;

      return {
        totalDocuments: documents.length,
        newDocuments: newDocuments.length,
        byCategory,
        unreadNotifications
      };
    } catch (error) {
      console.error('Erreur lors des statistiques:', error);
      return {
        totalDocuments: 0,
        newDocuments: 0,
        byCategory: {},
        unreadNotifications: 0
      };
    }
  }

  /**
   * Utilitaires pour l'affichage mobile
   */
  getDocumentIcon(type: UnifiedDocument['type']): string {
    const icons = {
      plan: '📋',
      contract: '📄',
      invoice: '🧾',
      photo: '📷',
      report: '📊',
      permit: '🔖',
      progress_update: '📈',
      other: '📎'
    };
    return icons[type] || icons.other;
  }

  getDocumentColor(type: UnifiedDocument['type']): string {
    const colors = {
      plan: '#3B82F6', // blue
      contract: '#10B981', // green
      invoice: '#F59E0B', // yellow
      photo: '#8B5CF6', // purple
      report: '#F97316', // orange
      permit: '#EF4444', // red
      progress_update: '#6366F1', // indigo
      other: '#6B7280' // gray
    };
    return colors[type] || colors.other;
  }

  getCategoryDisplayName(type: UnifiedDocument['type']): string {
    const names = {
      plan: 'Plans',
      contract: 'Contrats',
      invoice: 'Factures',
      photo: 'Photos',
      report: 'Rapports',
      permit: 'Permis',
      progress_update: 'Suivi',
      other: 'Autres'
    };
    return names[type] || names.other;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(timestamp: Timestamp): string {
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Moins de 24h
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours === 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        return minutes <= 1 ? 'À l\'instant' : `Il y a ${minutes} min`;
      }
      return `Il y a ${hours}h`;
    }

    // Moins de 7 jours
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }

    // Format complet
    return date.toLocaleDateString('fr-FR');
  }
}

export const mobileDocumentService = new MobileDocumentService();