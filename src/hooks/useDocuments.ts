import { useState, useEffect, useCallback } from 'react';
import { documentService } from '../services/documentService';
import type { FirebaseDocument, DocumentCategory, DocumentVisibility } from '../types/firebase';

interface UseDocumentsOptions {
  chantierId: string;
  userRole?: 'client' | 'chef';
  autoSubscribe?: boolean;
}

interface UploadDocumentOptions {
  description?: string;
  visibility?: DocumentVisibility;
  tags?: string[];
}

export function useDocuments({ chantierId, userRole, autoSubscribe = true }: UseDocumentsOptions) {
  const [documents, setDocuments] = useState<FirebaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents for the chantier
  const fetchDocuments = useCallback(async () => {
    if (!chantierId) return;

    try {
      setLoading(true);
      setError(null);
      const docs = await documentService.getChantierDocuments(chantierId, userRole);
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, [chantierId, userRole]);

  // Upload a new document
  const uploadDocument = useCallback(async (
    file: { uri: string; name: string; size: number; mimeType?: string },
    category: DocumentCategory,
    uploadedBy: string,
    options?: UploadDocumentOptions
  ): Promise<FirebaseDocument | null> => {
    if (!chantierId) {
      setError('ID du chantier manquant');
      return null;
    }

    try {
      setUploading(true);
      setError(null);

      const document = await documentService.uploadDocument(
        file,
        chantierId,
        category,
        uploadedBy,
        options
      );

      // Refresh documents list if not auto-subscribing
      if (!autoSubscribe) {
        await fetchDocuments();
      }

      return document;
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Erreur lors du téléchargement du document');
      return null;
    } finally {
      setUploading(false);
    }
  }, [chantierId, autoSubscribe, fetchDocuments]);

  // Delete a document
  const deleteDocument = useCallback(async (documentId: string, deletedBy: string) => {
    try {
      setError(null);
      await documentService.deleteDocument(documentId, deletedBy);

      // Refresh documents list if not auto-subscribing
      if (!autoSubscribe) {
        await fetchDocuments();
      }

      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Erreur lors de la suppression du document');
      return false;
    }
  }, [autoSubscribe, fetchDocuments]);

  // Update document metadata
  const updateDocument = useCallback(async (
    documentId: string,
    updates: Partial<Omit<FirebaseDocument, 'id' | 'chantierId' | 'uploadedBy' | 'uploadedAt' | 'url'>>
  ) => {
    try {
      setError(null);
      await documentService.updateDocument(documentId, updates);

      // Refresh documents list if not auto-subscribing
      if (!autoSubscribe) {
        await fetchDocuments();
      }

      return true;
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Erreur lors de la mise à jour du document');
      return false;
    }
  }, [autoSubscribe, fetchDocuments]);

  // Get documents by category
  const getDocumentsByCategory = useCallback(async (category: DocumentCategory) => {
    if (!chantierId) return [];

    try {
      return await documentService.getDocumentsByCategory(chantierId, category, userRole);
    } catch (err) {
      console.error('Error fetching documents by category:', err);
      return [];
    }
  }, [chantierId, userRole]);

  // Get document statistics
  const getDocumentStats = useCallback(async () => {
    if (!chantierId) return null;

    try {
      return await documentService.getChantierDocumentStats(chantierId);
    } catch (err) {
      console.error('Error fetching document stats:', err);
      return null;
    }
  }, [chantierId]);

  // Format file size helper
  const formatFileSize = useCallback((bytes: number) => {
    return documentService.formatFileSize(bytes);
  }, []);

  // Get document icon helper
  const getDocumentIcon = useCallback((mimeType: string) => {
    return documentService.getDocumentIcon(mimeType);
  }, []);

  // Effect to handle auto-subscription or manual fetch
  useEffect(() => {
    if (!chantierId) {
      // No chantierId, set loading to false and clear documents
      setLoading(false);
      setDocuments([]);
      return;
    }

    if (autoSubscribe) {
      // Subscribe to real-time updates
      const unsubscribe = documentService.subscribeToChantierDocuments(
        chantierId,
        (docs) => {
          setDocuments(docs);
          setLoading(false);
        },
        userRole
      );

      return unsubscribe;
    } else {
      // Manual fetch
      fetchDocuments();
    }
  }, [chantierId, userRole, autoSubscribe, fetchDocuments]);

  // Computed values
  const documentsByCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<DocumentCategory, FirebaseDocument[]>);

  const totalDocuments = documents.length;
  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);

  return {
    // State
    documents,
    loading,
    uploading,
    error,

    // Actions
    uploadDocument,
    deleteDocument,
    updateDocument,
    fetchDocuments,
    getDocumentsByCategory,
    getDocumentStats,

    // Helpers
    formatFileSize,
    getDocumentIcon,

    // Computed values
    documentsByCategory,
    totalDocuments,
    totalSize,

    // Clear error
    clearError: () => setError(null),
  };
}

// Specialized hook for client documents
export function useClientDocuments(chantierId: string) {
  return useDocuments({
    chantierId,
    userRole: 'client',
    autoSubscribe: true,
  });
}

// Specialized hook for chef documents
export function useChefDocuments(chantierId: string) {
  return useDocuments({
    chantierId,
    userRole: 'chef',
    autoSubscribe: true,
  });
}