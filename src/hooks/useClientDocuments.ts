import { useState, useEffect, useCallback, useMemo } from 'react';
import { clientDocumentService } from '../services/clientDocumentService';
import type { FirebaseDocument, DocumentCategory } from '../types/firebase';

interface UseClientDocumentsResult {
  // Documents data
  documents: FirebaseDocument[];
  filteredDocuments: FirebaseDocument[];
  loading: boolean;
  error: string | null;

  // Statistics
  totalDocuments: number;
  newDocuments: number;
  unreadDocuments: number;
  documentsByCategory: Record<DocumentCategory, FirebaseDocument[]>;

  // Actions
  markAsRead: (documentId: string) => Promise<void>;
  refreshDocuments: () => void;
  filterDocuments: (filters: DocumentFilters) => void;
  clearError: () => void;

  // Helpers
  isDocumentNew: (document: FirebaseDocument) => boolean;
  isDocumentUnread: (document: FirebaseDocument) => boolean;
  formatFileSize: (bytes: number) => string;
  getDocumentIcon: (mimeType: string) => string;
}

interface DocumentFilters {
  category?: DocumentCategory | 'all';
  searchText?: string;
  dateFrom?: Date;
  dateTo?: Date;
  onlyUnread?: boolean;
}

export function useClientDocuments(
  clientId: string,
  chantierId: string
): UseClientDocumentsResult {
  const [documents, setDocuments] = useState<FirebaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({});

  // Subscribe to documents from backoffice
  useEffect(() => {
    if (!clientId || !chantierId) {
      setLoading(false);
      setDocuments([]);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = clientDocumentService.subscribeToClientDocuments(
      clientId,
      chantierId,
      (docs) => {
        setDocuments(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading documents:', err);
        setError('Erreur lors du chargement des documents');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [clientId, chantierId]);

  // Mark document as read
  const markAsRead = useCallback(async (documentId: string) => {
    try {
      await clientDocumentService.markDocumentAsRead(documentId, clientId);
      // Document will be updated through the real-time subscription
    } catch (err) {
      console.error('Error marking document as read:', err);
      setError('Erreur lors du marquage comme lu');
    }
  }, [clientId]);

  // Refresh documents manually
  const refreshDocuments = useCallback(() => {
    setError(null);
    // The subscription will automatically refresh
  }, []);

  // Filter documents
  const filterDocuments = useCallback((newFilters: DocumentFilters) => {
    setFilters(newFilters);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper functions
  const isDocumentNew = useCallback((document: FirebaseDocument): boolean => {
    const uploadDate = document.uploadedAt?.toDate?.() || new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return uploadDate > weekAgo;
  }, []);

  const isDocumentUnread = useCallback((document: FirebaseDocument): boolean => {
    return !document.readByClient;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const getDocumentIcon = useCallback((mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'videocam';
    if (mimeType.includes('pdf')) return 'picture-as-pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table-chart';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slideshow';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
    return 'insert-drive-file';
  }, []);

  // Computed values
  const filteredDocuments = useMemo(() => {
    return clientDocumentService.filterDocuments(documents, filters);
  }, [documents, filters]);

  const totalDocuments = documents.length;

  const newDocuments = useMemo(() => {
    return documents.filter(isDocumentNew).length;
  }, [documents, isDocumentNew]);

  const unreadDocuments = useMemo(() => {
    return documents.filter(isDocumentUnread).length;
  }, [documents, isDocumentUnread]);

  const documentsByCategory = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const category = doc.category as DocumentCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    }, {} as Record<DocumentCategory, FirebaseDocument[]>);
  }, [documents]);

  return {
    // Documents data
    documents,
    filteredDocuments,
    loading,
    error,

    // Statistics
    totalDocuments,
    newDocuments,
    unreadDocuments,
    documentsByCategory,

    // Actions
    markAsRead,
    refreshDocuments,
    filterDocuments,
    clearError,

    // Helpers
    isDocumentNew,
    isDocumentUnread,
    formatFileSize,
    getDocumentIcon,
  };
}

// Simplified hook for basic document access
export function useClientDocumentsSimple(clientId: string, chantierId: string) {
  const {
    documents,
    loading,
    error,
    totalDocuments,
    newDocuments,
    unreadDocuments,
    markAsRead,
    clearError,
  } = useClientDocuments(clientId, chantierId);

  return {
    documents,
    loading,
    error,
    stats: {
      total: totalDocuments,
      new: newDocuments,
      unread: unreadDocuments,
    },
    markAsRead,
    clearError,
  };
}