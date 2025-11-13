import { Timestamp } from 'firebase/firestore';

// User roles enum - should match backoffice roles
export enum UserRole {
  CLIENT = 'client',
  CHEF = 'chef',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Firebase user interface - identical to backoffice
export interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  username?: string; // Identifiant de connexion pour les clients
  phoneNumber?: string | null;
  clientId?: string;
  isTemporaryPassword?: boolean;
  role?: UserRole; // Add role field to match backoffice
  createdAt: Timestamp;
  createdBy?: string; // UID de l'utilisateur qui a créé ce compte
  isBlocked?: boolean;
  blockedAt?: Timestamp | null;
}

// Firebase client interface - identical to backoffice
export interface FirebaseClient {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  localisationSite: string;
  projetAdhere: string;
  telephone: string;
  adresse: string;

  status: 'En cours' | 'Terminé' | 'En attente';
  invitationStatus: 'pending' | 'sent' | 'accepted' | 'declined';
  invitationToken?: string;
  userId?: string; // Lié à l'utilisateur une fois qu'il accepte l'invitation
  createdAt: Timestamp;
  invitedAt?: Timestamp;
  acceptedAt?: Timestamp;
}

// Firebase material interface - identical to backoffice
export interface FirebaseMaterial {
  id?: string;
  name: string;
  category: string;
  price: number;
  image: string;
  supplier: string;
  description: string;
  createdAt: Timestamp;
}

// Firebase project interface - identical to backoffice
export interface FirebaseProject {
  id?: string;
  name: string;
  description: string;
  images: string[];
  type: string;
  createdAt: Timestamp;
}

// Firebase invitation interface - identical to backoffice
export interface FirebaseInvitation {
  id?: string;
  clientId: string;
  email: string;
  token: string;
  status: 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';
  createdAt: Timestamp;
  sentAt?: Timestamp;
  acceptedAt?: Timestamp;
  expiresAt: Timestamp;
}

// Firebase collections - identical to backoffice
export interface FirebaseCollections {
  users: 'users';
  clients: 'clients';
  materials: 'materials';
  projects: 'projects';
  invitations: 'invitations';
}

// Chantier-related types - consistent with backoffice
export type ChantierStatus = 'En attente' | 'En cours' | 'Terminé' | 'En retard';
export type PhaseStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

export interface ChantierPhase {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number; // 0-100%

  // Planning
  plannedStartDate?: Timestamp;
  plannedEndDate?: Timestamp;
  actualStartDate?: Timestamp;
  actualEndDate?: Timestamp;

  // Resources
  assignedTeamMembers: string[]; // Team member IDs
  requiredMaterials: RequiredMaterial[];
  estimatedDuration: number; // in days

  // Progress tracking
  notes?: string;
  photos: string[]; // Photo URLs for this phase
  lastUpdated: Timestamp;
  updatedBy: string; // Chef who last updated
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; // Maçon, Électricien, Plombier, etc.
  phone?: string;
  experience?: string;
  addedAt: Timestamp;
  addedBy: string;
}

export interface ProgressPhoto {
  id: string;
  url: string;
  phaseId?: string; // Optional: link to specific phase
  description?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface ProgressUpdate {
  id: string;
  title: string;
  description: string;
  type: 'phase_completion' | 'issue' | 'delivery' | 'milestone';
  relatedPhaseId?: string;
  photos: string[];
  createdAt: Timestamp;
  createdBy: string;
  isVisibleToClient: boolean;
}

export interface RequiredMaterial {
  materialId: string; // Reference to materials collection
  quantity: number;
  unit: string;
  status: 'ordered' | 'delivered' | 'installed';
  deliveryDate?: Timestamp;
}

export interface FirebaseChantier {
  id?: string;
  clientId: string; // Reference to client
  projectTemplateId: string; // Reference to base project template
  name: string; // Client-specific name (e.g., "Chantier Moussa Diop - Villa Amina")
  address: string; // Actual construction site address
  status: ChantierStatus;
  globalProgress: number; // 0-100% calculated from phases
  startDate: Timestamp;
  plannedEndDate: Timestamp;
  actualEndDate?: Timestamp;

  // Phase management
  phases: ChantierPhase[];

  // Team and resources
  assignedChefId: string; // Site manager/chef de chantier
  team: TeamMember[];

  // Progress documentation
  gallery: ProgressPhoto[];
  updates: ProgressUpdate[];

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Admin who created the chantier
}

// Document types for chantier documents
export type DocumentCategory = 'contract' | 'plan' | 'invoice' | 'permit' | 'photo' | 'report' | 'other';
export type DocumentVisibility = 'client_only' | 'chef_only' | 'both';

export interface FirebaseDocument {
  id?: string;
  chantierId: string; // Reference to the chantier this document belongs to
  name: string;
  originalName: string;
  category: DocumentCategory;
  mimeType: string;
  size: number; // File size in bytes
  url: string; // Firebase Storage download URL
  visibility: DocumentVisibility;

  // Upload information
  uploadedBy: string; // User ID who uploaded the document
  uploadedAt: Timestamp;

  // Metadata
  description?: string;
  tags?: string[];
  version?: number; // For document versioning

  // Access control
  isVisible: boolean;
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;
}

// Firebase collections - updated to include chantiers and documents
export interface FirebaseCollections {
  users: 'users';
  clients: 'clients';
  materials: 'materials';
  projects: 'projects';
  invitations: 'invitations';
  chantiers: 'chantiers';
  documents: 'documents';
}

// Collection names constant for easy reference
export const COLLECTIONS: FirebaseCollections = {
  users: 'users',
  clients: 'clients',
  materials: 'materials',
  projects: 'projects',
  invitations: 'invitations',
  chantiers: 'chantiers',
  documents: 'documents'
};

// Utility functions for chantier calculations
export const calculateGlobalProgress = (phases: ChantierPhase[]): number => {
  if (phases.length === 0) return 0;
  const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
  return Math.round(totalProgress / phases.length);
};

export const getChantierStatus = (phases: ChantierPhase[], plannedEndDate: Timestamp): ChantierStatus => {
  const globalProgress = calculateGlobalProgress(phases);
  const now = new Date();
  const endDate = plannedEndDate.toDate();

  if (globalProgress === 100) return 'Terminé';
  if (globalProgress === 0) return 'En attente';
  if (now > endDate && globalProgress < 100) return 'En retard';
  return 'En cours';
};

export const getPhaseStatus = (progress: number): PhaseStatus => {
  if (progress === 0) return 'pending';
  if (progress === 100) return 'completed';
  return 'in-progress';
};