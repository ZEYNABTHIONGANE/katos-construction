// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  HomeTabs: undefined;
};

export type HomeTabParamList = {
  Home: undefined;
  Chantier: undefined;
  Chat: undefined;
  Finitions: undefined;
  Profil: undefined;
};

// Data types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
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
}

export interface Material {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description?: string;
  supplier?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  materials: Material[];
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

export interface Selection {
  id: string;
  materialId: string;
  material: Material;
  selectedAt: Date;
}