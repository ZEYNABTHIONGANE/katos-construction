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
  role: UserRole; // Required field to match backoffice (not optional)
  isChef?: boolean; // Permet aux admins d'avoir aussi le rôle de chef
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
  telephone: string;
  adresse: string;
  localisationSite: string;
  projetAdhere: string;
  status: 'En cours' | 'Terminé' | 'En attente';
  isActive?: boolean;
  invitationStatus: 'pending' | 'sent' | 'accepted' | 'declined';
  invitationToken?: string;
  userId?: string; // Lié à l'utilisateur une fois qu'il accepte l'invitation
  username?: string; // Nom d'utilisateur généré pour la connexion
  tempPassword?: string; // Mot de passe temporaire
  typePaiement: 'comptant' | 'echeancier'; // Type de paiement
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
  price: number;
  currency: string;
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

// Types pour la structure hiérarchique des phases Katos (identique au backoffice)
export interface PhaseStep {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number; // 0-100%
  estimatedDuration: number; // en jours
  actualStartDate?: Timestamp;
  actualEndDate?: Timestamp;
  notes?: string;
  updatedBy?: string;
  photos?: string[];
}

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

// Extension de ChantierPhase pour supporter les sous-étapes (identique au backoffice)
export interface KatosChantierPhase extends Omit<ChantierPhase, 'progress'> {
  steps?: PhaseStep[]; // Sous-étapes optionnelles
  progress: number; // Calculé automatiquement à partir des steps si elles existent
  category: 'main' | 'gros_oeuvre' | 'second_oeuvre'; // Catégorie pour regroupement
  order: number; // Ordre d'exécution
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
  type: 'image' | 'video'; // Media type
  phaseId?: string; // Optional: link to specific phase
  stepId?: string; // Optional: link to specific step
  description?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  duration?: number; // Video duration in seconds (for videos only)
  thumbnailUrl?: string; // Video thumbnail URL (for videos only)
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
  phases: KatosChantierPhase[];

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
  coverImage?: string; // URL of the cover image
}

// Document types for chantier documents
export type DocumentCategory = 'contract' | 'plan' | 'invoice' | 'permit' | 'photo' | 'report' | 'video' | 'other';
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

// Firebase client selection interface
export interface FirebaseClientSelection {
  id?: string;
  clientId: string;
  chantierId?: string; // Optional since some clients might not have a chantier yet
  selections: {
    materialId: string;
    materialName: string;
    materialCategory: string;
    materialPrice: number;
    materialImageUrl: string;
    selectedAt: Timestamp;
  }[];
  totalAmount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  clientSelections: 'clientSelections';
  invitationCodes: 'invitationCodes';
  documentNotifications: 'documentNotifications';
  feedbacks: 'feedbacks'; // Sub-collection of chantiers
}

export interface VoiceNoteFeedback {
  id: string;
  chantierId: string;
  phaseId: string;
  stepId?: string; // Optional (if linked to main phase)
  clientId: string;
  audioUrl: string; // Firebase Storage URL
  duration: number; // In seconds
  createdAt: Timestamp;
  status: 'unread' | 'read' | 'resolved';
  readBy?: string[]; // IDs of users who listened
  type?: 'audio' | 'text'; // Type of message (default: 'audio' for backward compatibility)
  text?: string; // Content if type is 'text'
}

// Collection names constant for easy reference
export const COLLECTIONS: FirebaseCollections = {
  users: 'users',
  clients: 'clients',
  materials: 'materials',
  projects: 'projects',
  invitations: 'invitations',
  chantiers: 'chantiers',
  documents: 'documents',
  clientSelections: 'clientSelections',
  invitationCodes: 'invitationCodes',
  documentNotifications: 'documentNotifications',
  feedbacks: 'feedbacks'
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

// Export des phases standards selon la structure Katos (identique au backoffice)
export const KATOS_STANDARD_PHASES: Omit<KatosChantierPhase, 'id' | 'lastUpdated' | 'updatedBy'>[] = [
  {
    name: 'Approvisionnement',
    description: 'Commande et réception des matériaux nécessaires',
    status: 'pending',
    progress: 0,
    category: 'main',
    order: 1,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 3,
    photos: [],
    notes: ''
  },

  // GROS ŒUVRE
  {
    name: 'Fondation',
    description: 'Travaux de fondation complets',
    status: 'pending',
    progress: 0,
    category: 'gros_oeuvre',
    order: 2,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 10,
    photos: [],
    notes: '',
    steps: [
      {
        id: 'implantation',
        name: 'Implantation',
        description: 'Marquage et positionnement des fondations',
        status: 'pending',
        progress: 0,
        estimatedDuration: 1,
        notes: ''
      },
      {
        id: 'terrassement',
        name: 'Terrassement',
        description: 'Excavation et préparation du terrain',
        status: 'pending',
        progress: 0,
        estimatedDuration: 4,
        notes: ''
      },
      {
        id: 'fondation',
        name: 'Fondation',
        description: 'Coulage des fondations',
        status: 'pending',
        progress: 0,
        estimatedDuration: 5,
        notes: ''
      }
    ]
  },
  {
    name: 'Élévation',
    description: 'Construction des murs et structures verticales',
    status: 'pending',
    progress: 0,
    category: 'gros_oeuvre',
    order: 3,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 15,
    photos: [],
    notes: '',
    steps: [
      {
        id: 'maconnerie',
        name: 'Maçonnerie',
        description: 'Construction des murs en maçonnerie',
        status: 'pending',
        progress: 0,
        estimatedDuration: 10,
        notes: ''
      },
      {
        id: 'beton_arme',
        name: 'Éléments béton armé',
        description: 'Mise en place des éléments en béton armé',
        status: 'pending',
        progress: 0,
        estimatedDuration: 5,
        notes: ''
      }
    ]
  },
  {
    name: 'Coulage',
    description: 'Coulage des dalles',
    status: 'pending',
    progress: 0,
    category: 'gros_oeuvre',
    order: 4,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 3,
    photos: [],
    notes: '',
    steps: [
      {
        id: 'coulage_dalle',
        name: 'Coulage dalle',
        description: 'Coulage de la dalle de plancher',
        status: 'pending',
        progress: 0,
        estimatedDuration: 3,
        notes: ''
      }
    ]
  },
  {
    name: 'Vérification gros œuvre',
    description: 'Contrôle qualité du gros œuvre',
    status: 'pending',
    progress: 0,
    category: 'gros_oeuvre',
    order: 5,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 2,
    photos: [],
    notes: ''
  },

  // SECOND ŒUVRE
  {
    name: 'Plomberie',
    description: 'Installation complète de la plomberie',
    status: 'pending',
    progress: 0,
    category: 'second_oeuvre',
    order: 6,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 5,
    photos: [],
    notes: '',
    steps: [
      {
        id: 'alimentation',
        name: 'Alimentation',
        description: 'Installation du réseau d\'alimentation en eau',
        status: 'pending',
        progress: 0,
        estimatedDuration: 3,
        notes: ''
      },
      {
        id: 'evacuation',
        name: 'Évacuation',
        description: 'Installation du réseau d\'évacuation',
        status: 'pending',
        progress: 0,
        estimatedDuration: 2,
        notes: ''
      }
    ]
  },
  {
    name: 'Électricité',
    description: 'Installation électrique complète',
    status: 'pending',
    progress: 0,
    category: 'second_oeuvre',
    order: 7,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 7,
    photos: [],
    notes: '',
    steps: [
      {
        id: 'fourretage',
        name: 'Fourretage',
        description: 'Passage des gaines électriques',
        status: 'pending',
        progress: 0,
        estimatedDuration: 2,
        notes: ''
      },
      {
        id: 'cablage',
        name: 'Câblage',
        description: 'Installation des câbles électriques',
        status: 'pending',
        progress: 0,
        estimatedDuration: 3,
        notes: ''
      }
    ]
  },
  {
    name: 'Carrelage',
    description: 'Pose du carrelage',
    status: 'pending',
    progress: 0,
    category: 'second_oeuvre',
    order: 8,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 6,
    photos: [],
    notes: ''
  },
  {
    name: 'Étanchéité',
    description: 'Travaux d\'étanchéité',
    status: 'pending',
    progress: 0,
    category: 'second_oeuvre',
    order: 9,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 3,
    photos: [],
    notes: ''
  },
  {
    name: 'Menuiserie',
    description: 'Installation des menuiseries',
    status: 'pending',
    progress: 0,
    category: 'second_oeuvre',
    order: 10,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 5,
    photos: [],
    notes: ''
  },
  {
    name: 'Faux plafond',
    description: 'Installation des faux plafonds',
    status: 'pending',
    progress: 0,
    category: 'second_oeuvre',
    order: 11,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 4,
    photos: [],
    notes: ''
  },
  {
    name: 'Peinture',
    description: 'Travaux de peinture complets',
    status: 'pending',
    progress: 0,
    category: 'second_oeuvre',
    order: 12,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 8,
    photos: [],
    notes: '',
    steps: [
      {
        id: 'grattage',
        name: 'Grattage',
        description: 'Préparation des surfaces',
        status: 'pending',
        progress: 0,
        estimatedDuration: 2,
        notes: ''
      },
      {
        id: 'couche_primaire',
        name: 'Application couche primaire',
        description: 'Application de la sous-couche',
        status: 'pending',
        progress: 0,
        estimatedDuration: 3,
        notes: ''
      },
      {
        id: 'couche_secondaire',
        name: 'Application couche secondaire',
        description: 'Application de la couche de finition',
        status: 'pending',
        progress: 0,
        estimatedDuration: 3,
        notes: ''
      }
    ]
  },
  {
    name: 'Vérification second œuvre',
    description: 'Contrôle qualité du second œuvre',
    status: 'pending',
    progress: 0,
    category: 'second_oeuvre',
    order: 13,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 2,
    photos: [],
    notes: ''
  },
  {
    name: 'Clef en main',
    description: 'Livraison finale du projet',
    status: 'pending',
    progress: 0,
    category: 'main',
    order: 14,
    assignedTeamMembers: [],
    requiredMaterials: [],
    estimatedDuration: 1,
    photos: [],
    notes: ''
  }
];

// Fonction pour calculer le progrès d'une phase avec sous-étapes (identique au backoffice)
export const calculatePhaseProgress = (phase: KatosChantierPhase): number => {
  if (!phase.steps || phase.steps.length === 0) {
    return phase.progress;
  }

  const totalStepProgress = phase.steps.reduce((sum, step) => sum + step.progress, 0);
  return Math.round(totalStepProgress / phase.steps.length);
};

// Fonction pour obtenir toutes les phases par catégorie (identique au backoffice)
export const getPhasesByCategory = (category: 'main' | 'gros_oeuvre' | 'second_oeuvre') => {
  return KATOS_STANDARD_PHASES.filter(phase => phase.category === category);
};