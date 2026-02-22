import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FirebaseDocument } from '../types/firebase';

export class ClientDocumentService {
  // Subscribe to documents sent from backoffice for a specific client
  subscribeToClientDocuments(
    clientId: string,
    chantierId: string,
    callback: (documents: FirebaseDocument[]) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const documentsRef = collection(db, 'documents');

      // Query documents for this chantier that are visible to client
      const q = query(
        documentsRef,
        where('chantierId', '==', chantierId),
        where('clientId', '==', clientId),
        where('visibility', 'in', ['client_only', 'both']),
        where('status', '==', 'active'),
        orderBy('uploadedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const documents: FirebaseDocument[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            documents.push({
              ...data,
              id: doc.id,
              uploadedAt: data.uploadedAt || Timestamp.now(),
              updatedAt: data.updatedAt || null,
            } as any as FirebaseDocument);
          });
          callback(documents);
        },
        (error) => {
          console.error('Error listening to client documents:', error);
          onError?.(error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up client documents subscription:', error);
      onError?.(error as Error);
      return () => { }; // Return empty function as fallback
    }
  }

  // Mark document as read by client
  async markDocumentAsRead(documentId: string, clientId: string): Promise<void> {
    try {
      const docRef = doc(db, 'documents', documentId);

      // Update document to mark as read by client
      await updateDoc(docRef, {
        readByClient: true,
        readByClientAt: Timestamp.now(),
        readByClientId: clientId,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error marking document as read:', error);
      throw error;
    }
  }

  // Get documents statistics for client dashboard
  async getClientDocumentStats(clientId: string, chantierId: string) {
    try {
      const documentsRef = collection(db, 'documents');

      const q = query(
        documentsRef,
        where('chantierId', '==', chantierId),
        where('clientId', '==', clientId),
        where('visibility', 'in', ['client_only', 'both']),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      const documents: FirebaseDocument[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          ...data,
          id: doc.id,
        } as any as FirebaseDocument);
      });

      // Calculate stats
      const totalDocuments = documents.length;
      const newDocuments = documents.filter(doc => {
        const uploadDate = doc.uploadedAt?.toDate?.() || new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return uploadDate > weekAgo;
      }).length;

      const unreadDocuments = documents.filter(doc => !doc.readByClient).length;

      const byCategory = documents.reduce((acc, doc) => {
        if (!acc[doc.category]) {
          acc[doc.category] = 0;
        }
        acc[doc.category]++;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalDocuments,
        newDocuments,
        unreadDocuments,
        byCategory,
        documents: documents.slice(0, 5), // Recent 5 documents
      };
    } catch (error) {
      console.error('Error getting client document stats:', error);
      throw error;
    }
  }

  // Get document notifications for client
  async getDocumentNotifications(clientId: string) {
    try {
      const notificationsRef = collection(db, 'documentNotifications');

      const q = query(
        notificationsRef,
        where('clientId', '==', clientId),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const notifications: any[] = [];

      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error getting document notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'documentNotifications', notificationId);

      await updateDoc(notificationRef, {
        isRead: true,
        readAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Get document download URL (for secure downloads)
  async getDocumentDownloadUrl(documentId: string): Promise<string> {
    try {
      // In a real implementation, you might want to validate permissions here
      // and possibly generate temporary signed URLs for security

      const docRef = doc(db, 'documents', documentId);
      const docSnapshot = await getDocs(query(collection(db, 'documents'), where('__name__', '==', documentId)));

      if (!docSnapshot.empty) {
        const data = docSnapshot.docs[0].data();
        return data.url || '';
      }

      throw new Error('Document not found');
    } catch (error) {
      console.error('Error getting document download URL:', error);
      throw error;
    }
  }

  // Filter documents by category and other criteria
  filterDocuments(
    documents: FirebaseDocument[],
    filters: {
      category?: string;
      searchText?: string;
      dateFrom?: Date;
      dateTo?: Date;
      onlyUnread?: boolean;
    }
  ): FirebaseDocument[] {
    let filtered = [...documents];

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(doc => doc.category === filters.category);
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.originalName?.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(doc => {
        const docDate = doc.uploadedAt?.toDate?.() || new Date();
        return docDate >= filters.dateFrom!;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(doc => {
        const docDate = doc.uploadedAt?.toDate?.() || new Date();
        return docDate <= filters.dateTo!;
      });
    }

    // Filter by read status
    if (filters.onlyUnread) {
      filtered = filtered.filter(doc => !doc.readByClient);
    }

    return filtered;
  }
}

export const clientDocumentService = new ClientDocumentService();