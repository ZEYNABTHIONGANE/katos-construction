import { Timestamp } from 'firebase/firestore';

// Types identiques au backoffice pour la cohérence
export type UnifiedDocumentType =
  | 'plan'
  | 'contract'
  | 'invoice'
  | 'photo'
  | 'progress_update'
  | 'report'
  | 'permit'
  | 'other';

export type DocumentSource = 'client_upload' | 'admin_upload';
export type DocumentVisibility = 'client_only' | 'admin_only' | 'both';
export type DocumentStatus = 'active' | 'archived' | 'deleted';

// Document unifié côté mobile (lecture seule pour la plupart)
export interface UnifiedDocument {
  id?: string;

  // Références
  clientId: string;
  chantierId?: string;
  projectId?: string;
  invoiceId?: string;

  // Informations du fichier
  name: string;
  originalName: string;
  type: UnifiedDocumentType;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;

  // Métadonnées
  description?: string;
  tags?: string[];
  category?: string;

  // Contrôle d'accès côté mobile
  source: DocumentSource;
  visibility: DocumentVisibility;
  status: DocumentStatus;

  // Permissions pour le client mobile
  isReadOnly: boolean; // Si true, le client ne peut pas modifier/supprimer
  allowClientDownload: boolean; // Si true, le client peut télécharger
  requiresApproval: boolean; // Si true, le document client nécessite approbation
  isApproved?: boolean; // Statut d'approbation pour les documents clients
  approvedBy?: string;
  approvedAt?: Timestamp;

  // Dates
  uploadedAt: Timestamp;
  uploadedBy: string;
  updatedAt?: Timestamp;
  updatedBy?: string;

  // Version
  version: number;
  previousVersionId?: string;

  // Soft delete
  deletedAt?: Timestamp;
  deletedBy?: string;
  deleteReason?: string;
}

// Notification de document côté mobile
export interface DocumentNotification {
  id?: string;
  documentId: string;
  clientId: string;
  type: 'new_document' | 'document_approved' | 'document_updated';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
  metadata?: {
    documentName: string;
    documentType: string;
    senderName?: string;
  };
}

// Catégories pour l'organisation mobile
export interface DocumentCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
  description?: string;
  hasUnread?: boolean;
}

// Vue d'ensemble des documents pour le dashboard mobile
export interface DocumentOverview {
  totalDocuments: number;
  recentDocuments: UnifiedDocument[];
  categories: DocumentCategory[];
  unreadNotifications: number;
  lastUpdated: Timestamp;
}

// Élément de liste pour l'affichage mobile
export interface DocumentListItem {
  document: UnifiedDocument;
  isNew: boolean; // Document de moins de 7 jours
  canDownload: boolean;
  isReadOnly: boolean;
  formattedDate: string;
  formattedSize: string;
}

// Détails d'un document pour la vue détaillée mobile
export interface DocumentDetails {
  document: UnifiedDocument;
  relatedDocuments: UnifiedDocument[]; // Documents liés (même type, même projet, etc.)
  canDownload: boolean;
  isReadOnly: boolean;
  downloadCount?: number; // Nombre de téléchargements par le client
  lastViewedAt?: Timestamp; // Dernière consultation par le client
}

// Configuration pour l'upload côté mobile (restrictions)
export interface MobileUploadConfig {
  isUploadAllowed: boolean; // Si false, l'upload est complètement désactivé
  allowedTypes: UnifiedDocumentType[];
  maxFileSize: number;
  maxFilesPerDay: number;
  allowedMimeTypes: string[];
  requiresApproval: boolean;
  message?: string; // Message à afficher au client concernant les restrictions
}

// Statistiques pour le dashboard mobile
export interface MobileDocumentStats {
  totalDocuments: number;
  newThisWeek: number;
  pendingApproval: number;
  byCategory: {
    contracts: number;
    plans: number;
    photos: number;
    other: number;
  };
  recentActivity: {
    date: string;
    count: number;
    type: 'received' | 'approved';
  }[];
}

// Action disponible sur un document côté mobile
export interface DocumentAction {
  id: string;
  label: string;
  icon: string;
  action: 'view' | 'download' | 'share' | 'details';
  isAvailable: boolean;
  isLoading?: boolean;
}

// État de téléchargement pour les documents
export interface DownloadState {
  isDownloading: boolean;
  progress: number; // 0-100
  error?: string;
}

// Filtre pour la recherche de documents côté mobile
export interface DocumentFilter {
  type?: UnifiedDocumentType[];
  source?: DocumentSource[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchText?: string;
  sortBy: 'uploadedAt' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
}

// Résultat de recherche
export interface DocumentSearchResult {
  documents: UnifiedDocument[];
  totalCount: number;
  hasMore: boolean;
  filters: DocumentFilter;
}