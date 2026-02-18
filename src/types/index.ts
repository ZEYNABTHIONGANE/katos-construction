import { NavigatorScreenParams } from '@react-navigation/native';

// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Login: { showPINLogin?: boolean } | undefined;
  InvitationAuth: { token: string };
  CreatePIN: undefined;
  ChangePassword: undefined;
  ClientProfile: undefined;
  ClientTabs: NavigatorScreenParams<HomeTabParamList> | undefined;
  ChefTabs: NavigatorScreenParams<ChefTabParamList> | undefined;
  ClientProjects: undefined;
  ClientDocuments: undefined;
  HelpSupport: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
  Diagnostic: undefined;
  Chat: undefined;
  Notifications: undefined;
  ClientInvoices: undefined;
  ChefChat: undefined;
  Main: undefined;
  Showcase: undefined;
  ProspectForm: { interestedProject?: string } | undefined;
  VillaDetail: { villa: import('./firebase').FirebaseProject };
  PhaseDetail: {
    chantierId: string;
    phaseId: string;
    phaseName: string;
    stepId?: string;
    stepName?: string;
  };
};

export type HomeTabParamList = {
  Home: undefined;
  Chantier: { chantierId?: string };
  Documents: undefined;
  ClientInvoices: undefined;
  Chat: undefined;
  Profil: undefined;
};

export type ChefTabParamList = {
  ChefDashboard: undefined;
  ChefChantiers: { selectedChantierId?: string };
  ChefGallery: undefined;
  ChefChat: undefined;
  ChefProfil: undefined;
};

export type ChefStackParamList = {
  ChefTabs: NavigatorScreenParams<ChefTabParamList> | undefined;
  ChefPhaseDetail: {
    chantierId: string;
    phaseId: string;
    phaseName: string;
    stepId?: string;
    stepName?: string;
  };
  ChefChantierDetails: {
    chantierId: string;
  };
};

// Data types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'chef';
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  status: 'En cours' | 'Terminé' | 'En attente';
  progress: number;
  imageUrl: string;
  startDate: string;
  endDate?: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isFromUser: boolean;
  isRead?: boolean;
  attachmentType?: 'image' | 'document';
  attachmentUrl?: string;
  attachmentName?: string;
}


export interface ProjectUpdate {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl?: string;
  status: 'completed' | 'in-progress' | 'pending';
}

export interface ProjectPhase {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  startDate?: string;
  endDate?: string;
  description: string;
}

export interface Notification {
  id: string;
  type: 'document_upload' | 'material_selection' | 'client_update' | 'payment';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any;
  userId?: string;
  clientId?: string;
}

