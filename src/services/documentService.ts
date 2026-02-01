import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { storageService } from './storageService';
import type {
  FirebaseDocument,
  DocumentCategory,
  DocumentVisibility
} from '../types/firebase';
import { COLLECTIONS } from '../types/firebase';

export class DocumentService {
  private readonly COLLECTION_NAME = COLLECTIONS.documents;
  private readonly STORAGE_PATH = 'documents';

  /**
   * Upload a document file to Firebase Storage and save metadata to Firestore
   */
  async uploadDocument(
    file: { uri: string; name: string; size: number; mimeType?: string },
    chantierId: string,
    category: DocumentCategory,
    uploadedBy: string,
    options?: {
      description?: string;
      visibility?: DocumentVisibility;
      tags?: string[];
    }
  ): Promise<FirebaseDocument> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || '';
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}_${randomSuffix}.${extension}`;
      const storagePath = `${this.STORAGE_PATH}/${chantierId}/${fileName}`;

      // Fetch file from URI and convert to blob
      const response = await fetch(file.uri);
      const blob = await response.blob();

      // Upload to Cloudinary via StorageService
      const downloadURL = await storageService.uploadMediaFromUri(
        file.uri,
        '',
        (file.mimeType?.includes('video') || file.name.match(/\.(mp4|mov|avi)$/i)) ? 'video' : 'image'
      );

      // Prepare document metadata
      const documentData: Omit<FirebaseDocument, 'id'> = {
        chantierId,
        name: fileName,
        originalName: file.name,
        category,
        mimeType: file.mimeType || this.getMimeType(file.name),
        size: file.size,
        url: downloadURL,
        visibility: options?.visibility || 'both',
        uploadedBy,
        uploadedAt: Timestamp.now(),
        description: options?.description,
        tags: options?.tags || [],
        version: 1,
        isVisible: true,
        isDeleted: false
      };

      // Save metadata to Firestore
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), documentData);

      return {
        id: docRef.id,
        ...documentData
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Get all documents for a specific chantier
   */
  async getChantierDocuments(chantierId: string, userRole?: 'client' | 'chef'): Promise<FirebaseDocument[]> {
    try {
      console.log(`📚 Fetching documents for chantier: ${chantierId}, role: ${userRole}`);

      const documentsRef = collection(db, this.COLLECTION_NAME);
      const chantierRef = doc(db, 'chantiers', chantierId);

      // Fetch documents and chantier in parallel
      const [docsSnapshot, chantierSnapshot] = await Promise.all([
        getDocs(query(documentsRef, where('chantierId', '==', chantierId), orderBy('uploadedAt', 'desc'))),
        getDoc(chantierRef)
      ]);

      console.log(`📄 Retrieved ${docsSnapshot.docs.length} documents from Firestore`);

      let documents = docsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          category: data.category || data.type || 'other'
        } as FirebaseDocument;
      }).filter(doc =>
        doc.isVisible !== false && doc.isDeleted !== true
      );

      // Merge with gallery items
      if (chantierSnapshot.exists()) {
        const chantierData = chantierSnapshot.data();
        const galleryItems = (chantierData.gallery || []).map((item: any) => {
          const date = item.uploadedAt?.toDate ? item.uploadedAt.toDate() : new Date();
          const dateStr = date.toLocaleDateString('fr-FR');
          const typeLabel = item.type === 'video' ? 'Vidéo' : 'Photo';

          return {
            id: item.id,
            chantierId: chantierId,
            name: item.type === 'video' ? 'Vidéo Chantier' : 'Photo Chantier',
            originalName: `${typeLabel} - ${dateStr}`,
            category: item.type === 'video' ? 'video' : 'photo',
            mimeType: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
            size: 0,
            url: item.url,
            visibility: 'both' as DocumentVisibility,
            uploadedBy: item.uploadedBy,
            uploadedAt: item.uploadedAt,
            description: item.description,
            isVisible: true,
            isDeleted: false,
            thumbnailUrl: item.thumbnailUrl,
            duration: item.duration
          } as FirebaseDocument;
        });

        documents = [...documents, ...galleryItems];
        // Sort combined list
        documents.sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis());
      }

      // Filter by visibility based on user role
      if (userRole) {
        documents = documents.filter(doc =>
          doc.visibility === 'both' || doc.visibility === `${userRole}_only`
        );
      }

      console.log(`📋 Filtered to ${documents.length} visible documents for role: ${userRole}`);
      return documents;
    } catch (error) {
      console.error('Error fetching chantier documents:', error);
      return [];
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<FirebaseDocument | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, documentId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data()
      } as FirebaseDocument;
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: string,
    updates: Partial<Omit<FirebaseDocument, 'id' | 'chantierId' | 'uploadedBy' | 'uploadedAt' | 'url'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, documentId);

      // Filter undefined values
      const cleanedUpdates: any = {};
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value !== undefined) {
          cleanedUpdates[key] = value;
        }
      });

      await updateDoc(docRef, cleanedUpdates);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Soft delete a document (mark as deleted)
   */
  async deleteDocument(documentId: string, deletedBy: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, documentId);
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: Timestamp.now(),
        deletedBy,
        isVisible: false
      });
    } catch (error) {
      console.error('Error soft deleting document:', error);
      throw error;
    }
  }

  /**
   * Permanently delete a document and its file from Storage
   */
  async permanentlyDeleteDocument(documentId: string): Promise<void> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Delete from Cloudinary via StorageService
      try {
        await storageService.deleteImage(document.url);
      } catch (storageError) {
        console.warn('Error deleting file from Cloudinary:', storageError);
        // Continue with Firestore deletion even if storage deletion fails
      }

      // Delete from Firestore
      const docRef = doc(db, this.COLLECTION_NAME, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error permanently deleting document:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for chantier documents
   */
  subscribeToChantierDocuments(
    chantierId: string,
    callback: (documents: FirebaseDocument[]) => void,
    userRole?: 'client' | 'chef'
  ): () => void {
    console.log(`📚 Subscribing to documents for chantier: ${chantierId}, role: ${userRole}`);

    const documentsRef = collection(db, this.COLLECTION_NAME);

    // Simplified query without compound where clauses that might cause permission issues
    const q = query(
      documentsRef,
      where('chantierId', '==', chantierId),
      orderBy('uploadedAt', 'desc')
    );

    // Listen to documents collection
    const unsubDocs = onSnapshot(q, (snapshot) => {
      // This callback just triggers a full refresh from fetch/merge logic
      // optimization: store docs state locally and only merge when chantier updates too?
      // For simplicity, we delegate to a helper or just re-run the merge logic here.
      // actually we need to listen to BOTH.
      // Let's create a local state for docs and gallery to merge them.
    });

    // Actually, to avoid complexity of two listeners and merging state in a sync function return,
    // we can use a simpler approach: 
    // Just listen to both and whenever one changes, call the callback with merged result.
    // BUT we need to store the latest value of each.

    let cachedDocs: FirebaseDocument[] = [];
    let cachedGallery: FirebaseDocument[] = [];
    let initialLoad = true;

    const mergeAndCallback = () => {
      let combined = [...cachedDocs, ...cachedGallery];
      combined.sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis());

      if (userRole) {
        combined = combined.filter(doc =>
          doc.visibility === 'both' || doc.visibility === `${userRole}_only`
        );
      }
      callback(combined);
    };

    const documentsUnsubscribe = onSnapshot(q, (snapshot) => {
      cachedDocs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          category: data.category || data.type || 'other'
        } as FirebaseDocument;
      }).filter(doc => doc.isVisible !== false && doc.isDeleted !== true);
      mergeAndCallback();
    }, (error) => console.error("Docs listener error", error));

    const chantierUnsubscribe = onSnapshot(doc(db, 'chantiers', chantierId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        cachedGallery = (data.gallery || []).map((item: any) => {
          const date = item.uploadedAt?.toDate ? item.uploadedAt.toDate() : new Date();
          const dateStr = date.toLocaleDateString('fr-FR');
          const typeLabel = item.type === 'video' ? 'Vidéo' : 'Photo';

          return {
            id: item.id,
            chantierId: chantierId,
            name: item.type === 'video' ? 'Vidéo Chantier' : 'Photo Chantier',
            originalName: `${typeLabel} - ${dateStr}`,
            category: item.type === 'video' ? 'video' : 'photo',
            mimeType: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
            size: 0,
            url: item.url,
            visibility: 'both' as DocumentVisibility,
            uploadedBy: item.uploadedBy,
            uploadedAt: item.uploadedAt,
            description: item.description,
            isVisible: true,
            isDeleted: false,
            thumbnailUrl: item.thumbnailUrl,
            duration: item.duration
          } as FirebaseDocument;
        });
      } else {
        cachedGallery = [];
      }
      mergeAndCallback();
    }, (error) => console.error("Chantier listener error", error));

    return () => {
      documentsUnsubscribe();
      chantierUnsubscribe();
    };
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(
    chantierId: string,
    category: DocumentCategory,
    userRole?: 'client' | 'chef'
  ): Promise<FirebaseDocument[]> {
    try {
      const documentsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        documentsRef,
        where('chantierId', '==', chantierId),
        where('category', '==', category),
        where('isVisible', '==', true),
        where('isDeleted', '!=', true),
        orderBy('uploadedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      let documents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          category: data.category || data.type || 'other'
        } as FirebaseDocument;
      });

      // Filter by visibility based on user role
      if (userRole) {
        documents = documents.filter(doc =>
          doc.visibility === 'both' || doc.visibility === `${userRole}_only`
        );
      }

      return documents;
    } catch (error) {
      console.error('Error fetching documents by category:', error);
      return [];
    }
  }

  /**
   * Update document visibility
   */
  async updateDocumentVisibility(
    documentId: string,
    visibility: DocumentVisibility
  ): Promise<void> {
    try {
      await this.updateDocument(documentId, { visibility });
    } catch (error) {
      console.error('Error updating document visibility:', error);
      throw error;
    }
  }

  /**
   * Create a new version of an existing document
   */
  async createDocumentVersion(
    originalDocumentId: string,
    file: { uri: string; name: string; size: number; mimeType?: string },
    uploadedBy: string,
    description?: string
  ): Promise<FirebaseDocument> {
    try {
      const originalDoc = await this.getDocument(originalDocumentId);
      if (!originalDoc) {
        throw new Error('Original document not found');
      }

      const newVersion = (originalDoc.version || 1) + 1;

      return this.uploadDocument(
        file,
        originalDoc.chantierId,
        originalDoc.category,
        uploadedBy,
        {
          description,
          visibility: originalDoc.visibility,
          tags: originalDoc.tags
        }
      );
    } catch (error) {
      console.error('Error creating document version:', error);
      throw error;
    }
  }

  /**
   * Get document statistics for a chantier
   */
  async getChantierDocumentStats(chantierId: string): Promise<{
    total: number;
    byCategory: Record<DocumentCategory, number>;
    totalSize: number;
  }> {
    try {
      const documents = await this.getChantierDocuments(chantierId);

      const stats = {
        total: documents.length,
        byCategory: {} as Record<DocumentCategory, number>,
        totalSize: documents.reduce((sum, doc) => sum + doc.size, 0)
      };

      // Initialize category counts
      const categories: DocumentCategory[] = ['contract', 'plan', 'invoice', 'permit', 'photo', 'report', 'video', 'other'];
      categories.forEach(category => {
        stats.byCategory[category] = 0;
      });

      // Count documents by category
      documents.forEach(doc => {
        stats.byCategory[doc.category]++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting document stats:', error);
      return {
        total: 0,
        byCategory: {} as Record<DocumentCategory, number>,
        totalSize: 0
      };
    }
  }

  /**
   * Helper function to determine MIME type from file extension
   */
  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      txt: 'text/plain',
      zip: 'application/zip'
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Helper function to format file size
   */
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Helper function to get document icon name based on MIME type
   */
  getDocumentIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'picture-as-pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'videocam'; // Added video icon
    if (mimeType.includes('word')) return 'description';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table-chart';
    if (mimeType.includes('zip')) return 'folder-zip';
    return 'description';
  }
}

export const documentService = new DocumentService();